import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from 'src/prisma/prisma.service';
import { VmInstanceStatus } from '@prisma/client';
import { VmProviderFactory } from './providers/vm-provider.factory';

/**
 * VmLabsHealthChecker — periodic scheduler that:
 *   1. Detects expired instances and marks them STOPPED / triggers cleanup
 *   2. Pings RUNNING instances to catch silent crashes (HEALTH_CHECK_FAILED)
 *   3. Logs every lifecycle event to VmLabEvent
 *
 * Runs every 60 seconds. Designed to be idempotent — safe to run concurrently.
 *
 * Register this in VmLabsModule providers array after adding @nestjs/schedule
 * to AppModule imports: ScheduleModule.forRoot().
 */
@Injectable()
export class VmLabsHealthChecker {
  private readonly logger = new Logger(VmLabsHealthChecker.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly providerFactory: VmProviderFactory,
  ) {}

  // ── 1. Expire stale instances ─────────────────────────────────────────────────
  @Cron(CronExpression.EVERY_MINUTE)
  async expireStaleInstances(): Promise<void> {
    const now = new Date();

    const expired = await this.prisma.vmLabInstance.findMany({
      where: {
        status: { in: [VmInstanceStatus.RUNNING, VmInstanceStatus.PAUSED] },
        expiresAt: { lte: now },
      },
      select: {
        id: true,
        externalId: true,
        providerType: true,
        template: { select: { slug: true } },
      },
    });

    if (expired.length === 0) return;

    this.logger.log(`[HealthChecker] Expiring ${expired.length} instance(s)`);

    await Promise.allSettled(
      expired.map(async (inst) => {
        try {
          const provider = this.providerFactory.resolve(inst.providerType);
          await provider.destroy(inst.externalId);

          await this.prisma.vmLabInstance.update({
            where: { id: inst.id },
            data: { status: VmInstanceStatus.EXPIRED },
          });

          await this.prisma.vmLabEvent.create({
            data: {
              instanceId: inst.id,
              eventType: 'INSTANCE_EXPIRED',
              meta: { reason: 'TTL exceeded', destroyedAt: now.toISOString() },
            },
          });
        } catch (err) {
          this.logger.error(`[HealthChecker] Failed to expire instance ${inst.id}`, err);
        }
      }),
    );
  }

  // ── 2. Health-ping RUNNING instances every 5 minutes ────────────────────────
  @Cron(CronExpression.EVERY_5_MINUTES)
  async pingRunningInstances(): Promise<void> {
    const running = await this.prisma.vmLabInstance.findMany({
      where: { status: VmInstanceStatus.RUNNING },
      select: { id: true, externalId: true, providerType: true },
    });

    if (running.length === 0) return;

    this.logger.debug(`[HealthChecker] Pinging ${running.length} running instance(s)`);

    await Promise.allSettled(
      running.map(async (inst) => {
        try {
          const provider = this.providerFactory.resolve(inst.providerType);
          const result = await provider.healthCheck(inst.externalId);

          if (!result.healthy) {
            this.logger.warn(`[HealthChecker] Instance ${inst.id} failed health check`);

            await this.prisma.vmLabInstance.update({
              where: { id: inst.id },
              data: { status: VmInstanceStatus.ERROR },
            });

            await this.prisma.vmLabEvent.create({
              data: {
                instanceId: inst.id,
                eventType: 'HEALTH_CHECK_FAILED',
                meta: { errorMessage: result.errorMessage, latencyMs: result.latencyMs },
              },
            });
          }
        } catch (err) {
          this.logger.error(`[HealthChecker] Ping error for instance ${inst.id}`, err);
        }
      }),
    );
  }
}
