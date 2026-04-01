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

const DEFAULT_SESSION_MINUTES = 60;
const MAX_CONCURRENT_PER_USER = 2;

@Injectable()
export class VmLabsOrchestratorService {
  private readonly logger = new Logger(VmLabsOrchestratorService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ─── Start / Provision ────────────────────────────────────────────────────────────────

  async startLab(userId: string, labTemplateId: string): Promise<any> {
    const template = await this.prisma.vmLabTemplate.findUnique({
      where: { id: labTemplateId },
    });
    if (!template) throw new NotFoundException('Lab template not found');
    if (!template.isActive) throw new BadRequestException('Lab is not active');

    // Enforce concurrent cap
    const running = await this.prisma.vmLabInstance.count({
      where: {
        userId,
        status: { in: ['QUEUED', 'PROVISIONING', 'STARTING', 'RUNNING'] },
      },
    });
    if (running >= MAX_CONCURRENT_PER_USER) {
      throw new BadRequestException(
        `You already have ${running} active lab(s). Stop one before starting a new one.`,
      );
    }

    // instanceTtlMin is the schema field (not defaultSessionMinutes)
    const sessionMinutes = template.instanceTtlMin ?? DEFAULT_SESSION_MINUTES;
    const expiresAt = new Date(Date.now() + sessionMinutes * 60_000);

    const instance = await this.prisma.vmLabInstance.create({
      data: {
        userId,
        templateId: labTemplateId,
        status: 'QUEUED',
        expiresAt,
        hintsUsed: 0,       // Int field in schema
        scoreDeduction: 0,  // Int field in schema
      },
    });

    await this._logEvent(instance.id, userId, 'INSTANCE_CREATED');

    // Phase 0: transition directly to RUNNING (no real Docker orchestration yet)
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

  // ─── Get / List (user) ───────────────────────────────────────────────────────

  async getInstance(userId: string, instanceId: string) {
    return this._getOwnedInstance(userId, instanceId);
  }

  async listUserInstances(userId: string) {
    return this.prisma.vmLabInstance.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      // NOTE: VmLabTemplate has no "difficulty" field → use osType instead
      include: { template: { select: { title: true, osType: true } } },
    });
  }

  // ─── Extend session ─────────────────────────────────────────────────────────

  async extendSession(userId: string, instanceId: string, minutes: number) {
    const instance = await this._getOwnedInstance(userId, instanceId);
    if (instance.status !== 'RUNNING') {
      throw new BadRequestException('Can only extend a running session.');
    }
    const newExpiry = new Date(
      (instance.expiresAt?.getTime() ?? Date.now()) + minutes * 60_000,
    );
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

    const expectedFlag = await this._resolveExpectedFlag(instance, template);
    const correct = this._safeCompare(submittedFlag.trim(), expectedFlag);

    // Use the correct schema field: flagSubmitted (Boolean)
    if (correct) {
      await this.prisma.vmLabInstance.update({
        where: { id: instanceId },
        data: {
          flagSubmitted: true,
          flagSubmittedAt: new Date(),
        },
      });
    }

    // Log to VmLabEvent (the audit model in schema)
    await this._logEvent(
      instanceId,
      userId,
      correct ? 'FLAG_SUBMITTED_CORRECT' : 'FLAG_SUBMITTED_WRONG',
      { flag: submittedFlag.trim() },
    );

    // Record in LabSubmission for cross-module tracking
    await this.prisma.labSubmission.create({
      data: {
        userId,
        labId: template.labId ?? '', // requires linked Lab; guard below
        vmInstanceId: instanceId,
        flagAnswer: submittedFlag.trim(),
        isCorrect: correct,
        timeTaken: 0,
        pointsEarned: correct ? (template.maxScore - instance.scoreDeduction) : 0,
      },
    }).catch(() => {
      // LabSubmission.labId is required — skip if no linked lab
      this.logger.warn(`submitFlag: no linked Lab for template ${template.id}, skipping LabSubmission`);
    });

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

    // hints are stored in scenarioConfig JSON: { hints: [{text, penaltyPct}] }
    const config = template.scenarioConfig as any;
    const hints: { text: string; penaltyPct: number }[] = config?.hints ?? [];

    if (hintIndex < 0 || hintIndex >= hints.length) {
      throw new BadRequestException('Invalid hint index.');
    }

    // Check if already used via VmLabHintUsage (proper relation model)
    const existing = await this.prisma.vmLabHintUsage.findUnique({
      where: { instanceId_hintIndex: { instanceId, hintIndex } },
    });
    if (existing) {
      return { hint: hints[hintIndex].text, alreadyUnlocked: true, penalty: 0 };
    }

    const penaltyPct = hints[hintIndex].penaltyPct ?? 10;
    const penalty = Math.round((template.maxScore * penaltyPct) / 100);

    // Record hint usage
    await this.prisma.vmLabHintUsage.create({
      data: { instanceId, userId, hintIndex, penalty },
    });

    // Update instance: increment hintsUsed counter + add to scoreDeduction
    await this.prisma.vmLabInstance.update({
      where: { id: instanceId },
      data: {
        hintsUsed: { increment: 1 },
        scoreDeduction: { increment: penalty },
      },
    });

    await this._logEvent(instanceId, userId, 'HINT_UNLOCKED', { hintIndex, penalty });

    return {
      hint: hints[hintIndex].text,
      penaltyApplied: penalty,
      newScore: Math.max(0, template.maxScore - instance.scoreDeduction - penalty),
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

  // ─── Admin: template CRUD ──────────────────────────────────────────────────

  async adminCreateTemplate(dto: any) {
    return this.prisma.vmLabTemplate.create({ data: dto });
  }

  async adminListTemplates() {
    return this.prisma.vmLabTemplate.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async adminToggleTemplate(id: string, isActive: boolean) {
    return this.prisma.vmLabTemplate.update({ where: { id }, data: { isActive } });
  }

  // ─── Private helpers ────────────────────────────────────────────────────────────

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
    _actorId: string,
  ) {
    await this.prisma.vmLabInstance.update({
      where: { id: instanceId },
      data: {
        status,
        ...(status === 'RUNNING' ? { startedAt: new Date() } : {}),
        ...(status === 'STOPPED' || status === 'EXPIRED' ? { stoppedAt: new Date() } : {}),
      },
    });
    this.logger.log(`Instance ${instanceId} → ${status}`);
  }

  // Uses VmLabEvent (the correct audit model) — NOT vmLabAuditLog
  private async _logEvent(
    instanceId: string,
    userId: string,
    eventType: VmLabEventType,
    meta?: object,
  ) {
    await this.prisma.vmLabEvent.create({
      data: { instanceId, userId, eventType, meta: meta ?? {} },
    });
  }

  private async _resolveExpectedFlag(instance: any, template: any): Promise<string> {
    if (template.flagPolicyType === 'STATIC') {
      const config = template.scenarioConfig as any;
      return config?.staticFlag ?? '';
    }
    // Per-user deterministic flag derived from instanceId + HMAC secret
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

  private _safeCompare(a: string, b: string): boolean {
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
  }
}
