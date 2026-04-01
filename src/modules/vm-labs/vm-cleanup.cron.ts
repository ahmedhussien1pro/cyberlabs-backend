import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service';
import { VmInstanceStatus } from '@prisma/client';
import { VmPoolService } from './vm-pool.service';
import { VmLabsGateway } from './vm-labs.gateway';
import { VmProviderFactory } from './providers/vm-provider.factory';

// ────────────────────────────────────────────────────────────────────
// @nestjs/schedule shim — keeps the file compilable before the package is installed
// Install: npm install @nestjs/schedule && add ScheduleModule.forRoot() to AppModule
// ────────────────────────────────────────────────────────────────────
let Cron: (expression: string) => MethodDecorator;
let CronExpression: {
  EVERY_MINUTE: string;
  EVERY_2_MINUTES?: string;
  EVERY_5_MINUTES: string;
  EVERY_30_SECONDS: string;
};

try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const schedule = require('@nestjs/schedule');
  Cron = schedule.Cron;
  CronExpression = schedule.CronExpression;
} catch {
  Cron = (_expr: string) =>
    (_t: object, _k: string | symbol, d: PropertyDescriptor) => d;
  CronExpression = {
    EVERY_MINUTE:     '* * * * *',
    EVERY_2_MINUTES:  '*/2 * * * *',
    EVERY_5_MINUTES:  '*/5 * * * *',
    EVERY_30_SECONDS: '*/30 * * * * *',
  };
}

// Health-check failure tracking (in-memory per process)
const healthFailures = new Map<string, number>();
const HEALTH_FAIL_THRESHOLD = 3;

@Injectable()
export class VmCleanupCron {
  private readonly logger = new Logger(VmCleanupCron.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly poolService: VmPoolService,
    private readonly gateway: VmLabsGateway,
    private readonly providerFactory: VmProviderFactory,
  ) {}

  // ── Job 1: Expire instances every 2 minutes ─────────────────────────────────
  @(Cron(CronExpression.EVERY_2_MINUTES ?? '*/2 * * * *'))
  async checkExpiredInstances(): Promise<void> {
    const now = new Date();
    const expired = await this.prisma.vmLabInstance.findMany({
      where: {
        status: { in: [VmInstanceStatus.RUNNING, VmInstanceStatus.PAUSED] },
        expiresAt: { lte: now },
      },
      select: {
        id: true,
        userId: true,
        containerId: true,
        template: { select: { pool: { select: { provider: true } } } },
      },
    });

    if (!expired.length) return;
    this.logger.log(`[Cron:Expire] Found ${expired.length} expired instance(s)`);

    await Promise.allSettled(
      expired.map(async (inst) => {
        try {
          const providerType = inst.template?.pool?.provider ?? 'DOCKER_LOCAL';
          const provider = this.providerFactory.resolve(providerType);
          await provider.destroy(inst.containerId ?? inst.id);

          await this.prisma.vmLabInstance.update({
            where: { id: inst.id },
            data: { status: VmInstanceStatus.EXPIRED, stoppedAt: now },
          });
          await this.prisma.vmLabEvent.create({
            data: {
              instanceId: inst.id,
              userId: inst.userId,
              eventType: 'INSTANCE_EXPIRED',
              meta: { reason: 'TTL exceeded' },
            },
          });
          this.gateway.pushStatusUpdate(inst.id, 'EXPIRED');
        } catch (err) {
          this.logger.error(`[Cron:Expire] Failed for instance ${inst.id}`, err);
        }
      }),
    );
  }

  // ── Job 2: Expiry warnings (10 min before) every 2 minutes ────────────────
  @(Cron(CronExpression.EVERY_2_MINUTES ?? '*/2 * * * *'))
  async sendExpiryWarnings(): Promise<void> {
    const now = new Date();
    const warningCutoff = new Date(now.getTime() + 10 * 60_000); // +10 min
    // Only warn once — skip instances already expired or already warned
    const aboutToExpire = await this.prisma.vmLabInstance.findMany({
      where: {
        status: VmInstanceStatus.RUNNING,
        expiresAt: { gt: now, lte: warningCutoff },
      },
      select: { id: true, userId: true, expiresAt: true },
    });

    for (const inst of aboutToExpire) {
      const minutesLeft = Math.ceil(
        ((inst.expiresAt?.getTime() ?? 0) - now.getTime()) / 60_000,
      );
      this.gateway.pushExpiryWarning(inst.id, minutesLeft);
      this.logger.debug(`[Cron:Warn] Instance ${inst.id} expires in ${minutesLeft} min`);
    }
  }

  // ── Job 3: Process QUEUED instances every minute ────────────────────────────
  @(Cron(CronExpression.EVERY_MINUTE))
  async processQueue(): Promise<void> {
    await this.poolService.processQueue();
  }

  // ── Job 4: Health-check RUNNING instances every 30 seconds ────────────────
  @(Cron(CronExpression.EVERY_30_SECONDS))
  async healthCheckRunningInstances(): Promise<void> {
    const running = await this.prisma.vmLabInstance.findMany({
      where: { status: VmInstanceStatus.RUNNING },
      select: {
        id: true,
        containerId: true,
        template: { select: { pool: { select: { provider: true } } } },
      },
    });

    if (!running.length) return;

    await Promise.allSettled(
      running.map(async (inst) => {
        try {
          const providerType = inst.template?.pool?.provider ?? 'DOCKER_LOCAL';
          const provider = this.providerFactory.resolve(providerType);
          const result = await provider.healthCheck(inst.containerId ?? inst.id);

          if (result.healthy) {
            healthFailures.delete(inst.id); // reset on success
            return;
          }

          const failures = (healthFailures.get(inst.id) ?? 0) + 1;
          healthFailures.set(inst.id, failures);
          this.logger.warn(
            `[Cron:Health] Instance ${inst.id} fail #${failures}/${HEALTH_FAIL_THRESHOLD}`,
          );

          if (failures >= HEALTH_FAIL_THRESHOLD) {
            healthFailures.delete(inst.id);
            await this.prisma.vmLabInstance.update({
              where: { id: inst.id },
              data: { status: VmInstanceStatus.ERROR },
            });
            await this.prisma.vmLabEvent.create({
              data: {
                instanceId: inst.id,
                eventType: 'HEALTH_CHECK_FAILED',
                meta: { failures: HEALTH_FAIL_THRESHOLD, errorMessage: result.errorMessage },
              },
            });
            this.gateway.pushStatusUpdate(inst.id, 'ERROR');
          }
        } catch (err) {
          this.logger.error(`[Cron:Health] Error pinging instance ${inst.id}`, err);
        }
      }),
    );
  }

  // ── Job 5: Sync pool counts every 5 minutes ──────────────────────────────
  @(Cron(CronExpression.EVERY_5_MINUTES))
  async syncPoolCounts(): Promise<void> {
    await this.poolService.syncAllPoolCounts();
    this.logger.debug('[Cron:Pool] Pool counts synced');
  }

  // ── Job 6: Clean old VmLabEvent records daily (at 3:00 AM) ───────────────
  @(Cron('0 3 * * *'))
  async cleanupOldEvents(): Promise<void> {
    const cutoff = new Date(Date.now() - 90 * 24 * 60 * 60_000); // 90 days ago
    const { count } = await this.prisma.vmLabEvent.deleteMany({
      where: { createdAt: { lte: cutoff } },
    });
    if (count > 0) {
      this.logger.log(`[Cron:Cleanup] Deleted ${count} old VmLabEvent records (>90 days)`);
    }
  }
}
