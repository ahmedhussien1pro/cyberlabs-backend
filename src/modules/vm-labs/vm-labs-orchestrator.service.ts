import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service';
import { VmInstanceStatus, VmLabEventType } from '@prisma/client';
import * as crypto from 'crypto';

// ─── Constants ────────────────────────────────────────────────────────────────
const DEFAULT_SESSION_MINUTES = 60;
const MAX_CONCURRENT_PER_USER = 2;
const FULL_SOLVE_SCORE_PCT = 0.2; // 20% cap when using full solution

@Injectable()
export class VmLabsOrchestratorService {
  private readonly logger = new Logger(VmLabsOrchestratorService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ─── Start / Provision ─────────────────────────────────────────────────────

  async startLab(userId: string, labTemplateId: string): Promise<any> {
    const template = await this.prisma.vmLabTemplate.findUnique({
      where: { id: labTemplateId },
    });
    if (!template) throw new NotFoundException('Lab template not found');
    if (!template.isActive) throw new BadRequestException('Lab is not active');

    // Enforce concurrent cap
    const running = await this.prisma.vmLabInstance.count({
      where: { userId, status: { in: ['QUEUED', 'PROVISIONING', 'STARTING', 'RUNNING'] } },
    });
    if (running >= MAX_CONCURRENT_PER_USER) {
      throw new BadRequestException(
        `You already have ${running} active lab(s). Stop one before starting a new one.`,
      );
    }

    const expiresAt = new Date(
      Date.now() + (template.defaultSessionMinutes ?? DEFAULT_SESSION_MINUTES) * 60_000,
    );

    const instance = await this.prisma.vmLabInstance.create({
      data: {
        userId,
        templateId: labTemplateId,
        status: 'QUEUED',
        expiresAt,
        hintsUsed: [],
        flagsSubmitted: 0,
        currentScore: template.maxScore ?? 100,
      },
    });

    await this._logEvent(instance.id, userId, 'INSTANCE_CREATED');

    // In a real system this would enqueue a Kubernetes/Docker job.
    // For Phase 0 (local/Docker) we transition directly to RUNNING.
    await this._transitionStatus(instance.id, 'RUNNING', userId);

    return this.prisma.vmLabInstance.findUnique({
      where: { id: instance.id },
      include: { template: { select: { title: true, dockerImage: true } } },
    });
  }

  // ─── Stop ──────────────────────────────────────────────────────────────────

  async stopLab(userId: string, instanceId: string): Promise<void> {
    const instance = await this._getOwnedInstance(userId, instanceId);
    if (['STOPPED', 'ERROR', 'EXPIRED'].includes(instance.status)) {
      throw new BadRequestException('Instance is already stopped.');
    }
    await this._transitionStatus(instanceId, 'STOPPED', userId);
  }

  // ─── Get Instance (user) ────────────────────────────────────────────────────

  async getInstance(userId: string, instanceId: string) {
    return this._getOwnedInstance(userId, instanceId);
  }

  // ─── List user instances ────────────────────────────────────────────────────

  async listUserInstances(userId: string) {
    return this.prisma.vmLabInstance.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: { template: { select: { title: true, difficulty: true } } },
    });
  }

  // ─── Extend session ─────────────────────────────────────────────────────────

  async extendSession(userId: string, instanceId: string, minutes: number) {
    const instance = await this._getOwnedInstance(userId, instanceId);
    if (instance.status !== 'RUNNING') {
      throw new BadRequestException('Can only extend a running session.');
    }
    const newExpiry = new Date((instance.expiresAt?.getTime() ?? Date.now()) + minutes * 60_000);
    await this.prisma.vmLabInstance.update({
      where: { id: instanceId },
      data: { expiresAt: newExpiry },
    });
    await this._logEvent(instanceId, userId, 'SESSION_EXTENDED', { addedMinutes: minutes });
    return { expiresAt: newExpiry };
  }

  // ─── Submit Flag ─────────────────────────────────────────────────────────────

  async submitFlag(userId: string, instanceId: string, submittedFlag: string) {
    const instance = await this._getOwnedInstance(userId, instanceId);
    if (instance.status !== 'RUNNING') {
      throw new BadRequestException('Lab must be running to submit a flag.');
    }

    const template = await this.prisma.vmLabTemplate.findUnique({
      where: { id: instance.templateId },
    });
    if (!template) throw new NotFoundException('Template not found');

    // Resolve expected flag: per-user dynamic or static
    const expectedFlag = await this._resolveExpectedFlag(instance, template);
    const correct = this._safeCompare(submittedFlag.trim(), expectedFlag);

    await this.prisma.vmLabInstance.update({
      where: { id: instanceId },
      data: { flagsSubmitted: { increment: 1 } },
    });

    await this.prisma.vmFlagSubmission.create({
      data: {
        instanceId,
        userId,
        submittedFlag: submittedFlag.trim(),
        isCorrect: correct,
      },
    });

    await this._logEvent(
      instanceId,
      userId,
      correct ? 'FLAG_SUBMITTED_CORRECT' : 'FLAG_SUBMITTED_WRONG',
      { flag: submittedFlag.trim() },
    );

    if (correct) {
      await this._transitionStatus(instanceId, 'STOPPED', userId);
    }

    return { correct, message: correct ? '🎉 Flag accepted!' : 'Incorrect flag. Try again.' };
  }

  // ─── Unlock Hint ─────────────────────────────────────────────────────────────

  async unlockHint(userId: string, instanceId: string, hintIndex: number) {
    const instance = await this._getOwnedInstance(userId, instanceId);
    const template = await this.prisma.vmLabTemplate.findUnique({
      where: { id: instance.templateId },
    });
    if (!template) throw new NotFoundException('Template not found');

    const hints: any[] = (template.hints as any[]) ?? [];
    if (hintIndex < 0 || hintIndex >= hints.length) {
      throw new BadRequestException('Invalid hint index.');
    }

    const alreadyUsed: number[] = (instance.hintsUsed as number[]) ?? [];
    if (alreadyUsed.includes(hintIndex)) {
      return { hint: hints[hintIndex]?.text ?? '', alreadyUnlocked: true };
    }

    const penalty = hints[hintIndex]?.penaltyPct ?? 10;
    const newScore = Math.max(0, (instance.currentScore ?? 100) - penalty);

    await this.prisma.vmLabInstance.update({
      where: { id: instanceId },
      data: {
        hintsUsed: [...alreadyUsed, hintIndex],
        currentScore: newScore,
      },
    });

    await this._logEvent(instanceId, userId, 'HINT_UNLOCKED', { hintIndex, penalty, newScore });

    return {
      hint: hints[hintIndex]?.text ?? '',
      penaltyApplied: penalty,
      newScore,
      alreadyUnlocked: false,
    };
  }

  // ─── Admin: list all instances ──────────────────────────────────────────────

  async adminListInstances(status?: VmInstanceStatus, page = 1, limit = 20) {
    const where = status ? { status } : {};
    const [data, total] = await Promise.all([
      this.prisma.vmLabInstance.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, email: true, name: true } },
          template: { select: { title: true } },
        },
      }),
      this.prisma.vmLabInstance.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  // ─── Admin: terminate ───────────────────────────────────────────────────────

  async adminTerminate(adminId: string, instanceId: string) {
    const instance = await this.prisma.vmLabInstance.findUnique({
      where: { id: instanceId },
    });
    if (!instance) throw new NotFoundException('Instance not found');
    await this._transitionStatus(instanceId, 'STOPPED', adminId);
    await this._logEvent(instanceId, adminId, 'ADMIN_TERMINATED');
    return { success: true };
  }

  // ─── Admin: create template ─────────────────────────────────────────────────

  async adminCreateTemplate(dto: any) {
    return this.prisma.vmLabTemplate.create({ data: dto });
  }

  // ─── Admin: list templates ───────────────────────────────────────────────────

  async adminListTemplates() {
    return this.prisma.vmLabTemplate.findMany({ orderBy: { createdAt: 'desc' } });
  }

  // ─── Admin: toggle template active ──────────────────────────────────────────

  async adminToggleTemplate(id: string, isActive: boolean) {
    return this.prisma.vmLabTemplate.update({ where: { id }, data: { isActive } });
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  private async _getOwnedInstance(userId: string, instanceId: string) {
    const instance = await this.prisma.vmLabInstance.findUnique({
      where: { id: instanceId },
    });
    if (!instance) throw new NotFoundException('Instance not found');
    if (instance.userId !== userId) throw new ForbiddenException('Access denied');
    return instance;
  }

  private async _transitionStatus(
    instanceId: string,
    status: VmInstanceStatus,
    actorId: string,
  ) {
    await this.prisma.vmLabInstance.update({
      where: { id: instanceId },
      data: {
        status,
        ...(status === 'RUNNING' ? { startedAt: new Date() } : {}),
        ...(status === 'STOPPED' || status === 'EXPIRED' ? { stoppedAt: new Date() } : {}),
      },
    });
    this.logger.log(`Instance ${instanceId} → ${status} by ${actorId}`);
  }

  private async _logEvent(
    instanceId: string,
    actorId: string,
    eventType: VmLabEventType,
    meta?: object,
  ) {
    await this.prisma.vmLabAuditLog.create({
      data: {
        instanceId,
        actorId,
        eventType,
        meta: meta ?? {},
      },
    });
  }

  private async _resolveExpectedFlag(instance: any, template: any): Promise<string> {
    if (template.flagPolicy === 'STATIC') {
      return template.staticFlag ?? '';
    }
    // Per-user deterministic flag derived from instanceId + secret
    const secret = process.env.FLAG_HMAC_SECRET ?? 'change-me-in-env';
    return 'FLAG{' + crypto.createHmac('sha256', secret).update(instance.id).digest('hex').slice(0, 24) + '}';
  }

  private _safeCompare(a: string, b: string): boolean {
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
  }
}
