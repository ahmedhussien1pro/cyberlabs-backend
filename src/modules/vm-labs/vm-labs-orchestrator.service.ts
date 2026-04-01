/**
 * VmLabsOrchestratorService
 *
 * Security controls wired in this file:
 *   ✅ [9.1] Flag rate limiting via VmLabsThrottler
 *   ✅ [9.3] Timing-safe flag comparison (crypto.timingSafeEqual)
 *   ✅ [9.4] HMAC-derived per-instance flags (never stored in plaintext)
 *   ✅ [9.5] _getOwnedInstance enforces userId ownership check
 *   ✅ [9.6] State machine blocks invalid transitions
 *   ✅ [9.7] Raw flag value never returned in any response
 */

import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  TooManyRequestsException,
} from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service';
import { VmInstanceStatus, VmLabEventType } from '@prisma/client';
import * as crypto from 'crypto';
import { VmPoolService } from './vm-pool.service';
import { VmLabsThrottler } from './vm-labs.throttler';

// ─── State Machine: allowed transitions ─────────────────────────────────────────────────────
const ALLOWED_TRANSITIONS: Record<VmInstanceStatus, VmInstanceStatus[]> = {
  QUEUED:       [VmInstanceStatus.PROVISIONING, VmInstanceStatus.STOPPED],
  PROVISIONING: [VmInstanceStatus.STARTING, VmInstanceStatus.ERROR, VmInstanceStatus.STOPPED],
  STARTING:     [VmInstanceStatus.RUNNING, VmInstanceStatus.ERROR, VmInstanceStatus.STOPPED],
  RUNNING:      [VmInstanceStatus.PAUSED, VmInstanceStatus.STOPPING, VmInstanceStatus.STOPPED, VmInstanceStatus.EXPIRED, VmInstanceStatus.ERROR],
  PAUSED:       [VmInstanceStatus.RUNNING, VmInstanceStatus.STOPPING, VmInstanceStatus.STOPPED, VmInstanceStatus.EXPIRED],
  STOPPING:     [VmInstanceStatus.STOPPED],
  STOPPED:      [],
  ERROR:        [VmInstanceStatus.STOPPED],
  EXPIRED:      [VmInstanceStatus.STOPPED],
};

/** Returns true if status is terminal (no further transitions possible). */
function isTerminal(status: VmInstanceStatus): boolean {
  return status === VmInstanceStatus.STOPPED || status === VmInstanceStatus.EXPIRED;
}

@Injectable()
export class VmLabsOrchestratorService {
  private readonly logger = new Logger(VmLabsOrchestratorService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly poolService: VmPoolService,
    private readonly throttler: VmLabsThrottler,  // [9.1] flag rate limiter
  ) {}

  // ─── Start / Provision ───────────────────────────────────────────────────────────

  async startLab(userId: string, labTemplateId: string): Promise<any> {
    const template = await this.prisma.vmLabTemplate.findUnique({
      where: { id: labTemplateId },
    });
    if (!template) throw new NotFoundException('Lab template not found');
    if (!template.isActive) throw new BadRequestException('Lab is not active');

    // [5.2] Return existing active instance if any
    const existingId = await this.poolService.getExistingUserInstance(userId, labTemplateId);
    if (existingId) {
      this.logger.log(`startLab: user ${userId} already has instance ${existingId}, returning it`);
      return this.prisma.vmLabInstance.findUnique({
        where: { id: existingId },
        include: { template: { select: { title: true, dockerImage: true } } },
      });
    }

    await this.poolService.enforceUserCap(userId);

    const { available, estimatedWaitMin } = await this.poolService.checkAvailableSlot(labTemplateId);

    const sessionMinutes = template.instanceTtlMin ?? 120;
    const expiresAt = new Date(Date.now() + sessionMinutes * 60_000);

    const instance = await this.prisma.vmLabInstance.create({
      data: {
        userId,
        templateId: labTemplateId,
        status: available ? VmInstanceStatus.PROVISIONING : VmInstanceStatus.QUEUED,
        expiresAt,
        hintsUsed: 0,
        scoreDeduction: 0,
      },
    });

    await this._logEvent(instance.id, userId, VmLabEventType.INSTANCE_CREATED, {
      available,
      estimatedWaitMin,
    });

    if (!available) {
      this.logger.log(`startLab: pool full for ${labTemplateId} — instance ${instance.id} QUEUED`);
      return {
        ...instance,
        poolStatus: 'QUEUED',
        estimatedWaitMin,
        message: `You're in queue. Estimated wait: ${estimatedWaitMin} min.`,
      };
    }

    await this._transitionStatus(instance.id, VmInstanceStatus.STARTING, userId);
    await this._transitionStatus(instance.id, VmInstanceStatus.RUNNING, userId);

    return this.prisma.vmLabInstance.findUnique({
      where: { id: instance.id },
      include: { template: { select: { title: true, dockerImage: true } } },
    });
  }

  // ─── Stop ────────────────────────────────────────────────────────────────────────

  async stopLab(userId: string, instanceId: string): Promise<void> {
    const instance = await this._getOwnedInstance(userId, instanceId);
    this._assertTransition(instance.status, VmInstanceStatus.STOPPED);
    await this._transitionStatus(instanceId, VmInstanceStatus.STOPPED, userId);
  }

  // ─── Get / List ──────────────────────────────────────────────────────────────────

  async getInstance(userId: string, instanceId: string) {
    return this._getOwnedInstance(userId, instanceId);
  }

  async listUserInstances(userId: string) {
    return this.prisma.vmLabInstance.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: { template: { select: { title: true, osType: true } } },
    });
  }

  // ─── Extend Session ──────────────────────────────────────────────────────────────

  async extendSession(userId: string, instanceId: string, minutes: number) {
    const instance = await this._getOwnedInstance(userId, instanceId);
    if (instance.status !== VmInstanceStatus.RUNNING) {
      throw new BadRequestException('Can only extend a running session.');
    }
    const template = await this.prisma.vmLabTemplate.findUnique({
      where: { id: instance.templateId },
      select: { maxTtlMin: true },
    });
    const addMin = minutes ?? template?.maxTtlMin ?? 30;
    const newExpiry = new Date(
      (instance.expiresAt?.getTime() ?? Date.now()) + addMin * 60_000,
    );
    await this.prisma.vmLabInstance.update({
      where: { id: instanceId },
      data: { expiresAt: newExpiry },
    });
    await this._logEvent(instanceId, userId, VmLabEventType.SESSION_EXTENDED, { addedMinutes: addMin });
    return { expiresAt: newExpiry };
  }

  // ─── Submit Flag [9.1][9.3][9.4][9.7] ────────────────────────────────────────────────────

  async submitFlag(userId: string, instanceId: string, submittedFlag: string) {
    // [9.1] Enforce rate limit before any DB access
    if (!this.throttler.allow(userId, instanceId)) {
      const retryAfter = this.throttler.retryAfterSeconds(userId, instanceId);
      throw new TooManyRequestsException(
        `Too many flag attempts. Please wait ${retryAfter}s before trying again.`,
      );
    }

    const instance = await this._getOwnedInstance(userId, instanceId);

    if (instance.status !== VmInstanceStatus.RUNNING) {
      throw new BadRequestException('Lab must be running to submit a flag.');
    }
    if (instance.flagSubmitted) {
      throw new BadRequestException('Flag already submitted for this instance.');
    }

    const template = await this.prisma.vmLabTemplate.findUnique({
      where: { id: instance.templateId },
    });
    if (!template) throw new NotFoundException('Template not found');

    // [9.4] Resolve expected flag via HMAC — never stored in DB
    const expectedFlag = this._resolveExpectedFlag(instance);

    // [9.3] Timing-safe comparison — prevents timing attacks
    const correct = this._safeCompare(submittedFlag.trim(), expectedFlag);

    await this._logEvent(
      instanceId,
      userId,
      correct ? VmLabEventType.FLAG_SUBMITTED_CORRECT : VmLabEventType.FLAG_SUBMITTED_WRONG,
      // [9.7] Never log the flag value itself
      { attemptLength: submittedFlag.trim().length },
    );

    if (correct) {
      const finalScore = Math.max(0, template.maxScore - instance.scoreDeduction);
      await this.prisma.vmLabInstance.update({
        where: { id: instanceId },
        data: { flagSubmitted: true, flagSubmittedAt: new Date(), finalScore },
      });

      if (template.labId) {
        await this.prisma.labSubmission
          .create({
            data: {
              userId,
              labId: template.labId,
              vmInstanceId: instanceId,
              // [9.7] Store submitted flag for admin audit trail only — never echo to student
              flagAnswer: submittedFlag.trim(),
              isCorrect: true,
              timeTaken: 0,
              pointsEarned: finalScore,
            },
          })
          .catch((e) =>
            this.logger.warn(`submitFlag: LabSubmission skipped — ${e.message}`),
          );
      }

      await this._transitionStatus(instanceId, VmInstanceStatus.STOPPED, userId);
    }

    // [9.7] Never return the expected flag in any response branch
    return {
      correct,
      message: correct ? '\uD83C\uDF89 Flag accepted!' : 'Incorrect flag. Try again.',
      ...(correct ? { finalScore: Math.max(0, template.maxScore - instance.scoreDeduction) } : {}),
    };
  }

  // ─── Unlock Hint ────────────────────────────────────────────────────────────────────

  async unlockHint(userId: string, instanceId: string, hintIndex: number) {
    const instance = await this._getOwnedInstance(userId, instanceId);
    const template = await this.prisma.vmLabTemplate.findUnique({
      where: { id: instance.templateId },
    });
    if (!template) throw new NotFoundException('Template not found');

    const config = template.scenarioConfig as any;
    const hints: { text: string; penaltyPct: number }[] = config?.hints ?? [];

    if (hintIndex < 0 || hintIndex >= hints.length) {
      throw new BadRequestException('Invalid hint index.');
    }

    const existing = await this.prisma.vmLabHintUsage.findUnique({
      where: { instanceId_hintIndex: { instanceId, hintIndex } },
    });
    if (existing) {
      return { hint: hints[hintIndex].text, alreadyUnlocked: true, penalty: 0 };
    }

    const penaltyPct = hints[hintIndex].penaltyPct ?? 10;
    const penalty = Math.round((template.maxScore * penaltyPct) / 100);

    await this.prisma.vmLabHintUsage.create({
      data: { instanceId, userId, hintIndex, penalty },
    });
    await this.prisma.vmLabInstance.update({
      where: { id: instanceId },
      data: { hintsUsed: { increment: 1 }, scoreDeduction: { increment: penalty } },
    });
    await this._logEvent(instanceId, userId, VmLabEventType.HINT_UNLOCKED, { hintIndex, penalty });

    return {
      hint: hints[hintIndex].text,
      penaltyApplied: penalty,
      newScore: Math.max(0, template.maxScore - instance.scoreDeduction - penalty),
      alreadyUnlocked: false,
    };
  }

  // ─── Admin ───────────────────────────────────────────────────────────────────────────

  async adminListInstances(
    status?: VmInstanceStatus,
    templateId?: string,
    userId?: string,
    page = 1,
    limit = 20,
  ) {
    const where: any = {};
    if (status)     where.status = status;
    if (templateId) where.templateId = templateId;
    if (userId)     where.userId = userId;

    const [data, total] = await Promise.all([
      this.prisma.vmLabInstance.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user:     { select: { id: true, email: true, name: true } },
          template: { select: { title: true, slug: true } },
        },
      }),
      this.prisma.vmLabInstance.count({ where }),
    ]);
    return { data, total, page, limit, pages: Math.ceil(total / limit) };
  }

  async adminTerminate(adminId: string, instanceId: string) {
    const instance = await this.prisma.vmLabInstance.findUnique({
      where: { id: instanceId },
    });
    if (!instance) throw new NotFoundException('Instance not found');

    if (isTerminal(instance.status)) {
      throw new BadRequestException('Instance is already stopped.');
    }

    await this.prisma.vmLabInstance.update({
      where: { id: instanceId },
      data: { status: VmInstanceStatus.STOPPED, stoppedAt: new Date() },
    });
    await this._logEvent(instanceId, adminId, VmLabEventType.ADMIN_TERMINATED);
    return { success: true };
  }

  async adminCreateTemplate(dto: any) {
    return this.prisma.vmLabTemplate.create({ data: dto });
  }

  async adminListTemplates() {
    return this.prisma.vmLabTemplate.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async adminToggleTemplate(id: string, isActive: boolean) {
    return this.prisma.vmLabTemplate.update({ where: { id }, data: { isActive } });
  }

  // ─── Private helpers ───────────────────────────────────────────────────────────────────

  private async _getOwnedInstance(userId: string, instanceId: string) {
    const instance = await this.prisma.vmLabInstance.findUnique({
      where: { id: instanceId },
    });
    if (!instance) throw new NotFoundException('Instance not found');
    if (instance.userId !== userId) throw new ForbiddenException('Access denied');
    return instance;
  }

  private _assertTransition(from: VmInstanceStatus, to: VmInstanceStatus): void {
    const allowed = ALLOWED_TRANSITIONS[from] ?? [];
    if (!allowed.includes(to)) {
      throw new BadRequestException(
        `Invalid state transition: ${from} → ${to}. Allowed: [${allowed.join(', ')}]`,
      );
    }
  }

  private async _transitionStatus(
    instanceId: string,
    status: VmInstanceStatus,
    _actorId: string,
  ): Promise<void> {
    const current = await this.prisma.vmLabInstance.findUnique({
      where: { id: instanceId },
      select: { status: true },
    });
    if (!current) throw new NotFoundException('Instance not found');
    this._assertTransition(current.status, status);

    await this.prisma.vmLabInstance.update({
      where: { id: instanceId },
      data: {
        status,
        ...(status === VmInstanceStatus.RUNNING  ? { startedAt: new Date() } : {}),
        ...(status === VmInstanceStatus.STOPPED ||
            status === VmInstanceStatus.EXPIRED   ? { stoppedAt: new Date() } : {}),
      },
    });
    this.logger.log(`Instance ${instanceId} → ${status}`);
  }

  private async _logEvent(
    instanceId: string,
    userId: string,
    eventType: VmLabEventType,
    meta?: object,
  ): Promise<void> {
    await this.prisma.vmLabEvent.create({
      data: { instanceId, userId, eventType, meta: meta ?? {} },
    });
  }

  /** [9.4] HMAC-based per-instance flag derivation — never stored in DB */
  private _resolveExpectedFlag(instance: { id: string }): string {
    const secret = process.env.FLAG_HMAC_SECRET ?? 'change-me-in-env';
    return (
      'FLAG{' +
      crypto
        .createHmac('sha256', secret)
        .update(instance.id)
        .digest('hex')
        .slice(0, 24) +
      '}'
    );
  }

  /** [9.3] Timing-safe string comparison — prevents timing attacks on flag validation */
  private _safeCompare(a: string, b: string): boolean {
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
  }
}
