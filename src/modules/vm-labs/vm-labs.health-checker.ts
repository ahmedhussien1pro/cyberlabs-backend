import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service';
import { VmInstanceStatus } from '@prisma/client';
import { VmProviderFactory } from './providers/vm-provider.factory';

// ─────────────────────────────────────────────────────────────────────────────
// @nestjs/schedule is an OPTIONAL dependency.
// Install: npm install @nestjs/schedule
// Then add ScheduleModule.forRoot() to AppModule imports.
// Until installed, the runtime shim keeps the file compilable.
// ─────────────────────────────────────────────────────────────────────────────
let Cron: (expression: string) => MethodDecorator;
let CronExpression: { EVERY_MINUTE: string; EVERY_5_MINUTES: string };

try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const schedule = require('@nestjs/schedule');
  Cron = schedule.Cron;
  CronExpression = schedule.CronExpression;
} catch {
  Cron = (_expr: string) =>
    (_t: object, _k: string | symbol, d: PropertyDescriptor) => d;
  CronExpression = { EVERY_MINUTE: '* * * * *', EVERY_5_MINUTES: '*/5 * * * *' };
}

/**
 * VmLabsHealthChecker — periodic scheduler.
 *
 * Real schema field reference (from prisma/schema.prisma):
 *   VmLabInstance:  id, status, expiresAt, containerId, templateId
 *   VmLabTemplate:  id  (NO providerType field)
 *   VmLabPool:      provider (VmProviderType), templateId  ← provider lives HERE
 *
 * To get providerType for an instance we join:
 *   instance → template → pool.provider
 */
@Injectable()
export class VmLabsHealthChecker {
  private readonly logger = new Logger(VmLabsHealthChecker.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly providerFactory: VmProviderFactory,
  ) {}

  // ── 1. Expire stale instances every minute ────────────────────────────────
  @(Cron(CronExpression.EVERY_MINUTE))
  async expireStaleInstances(): Promise<void> {
    const now = new Date();

    const expired = await this.prisma.vmLabInstance.findMany({
      where: {
        status: { in: [VmInstanceStatus.RUNNING, VmInstanceStatus.PAUSED] },
        expiresAt: { lte: now },
      },
      select: {
        id: true,
        containerId: true,           // Docker container ID (may be null for stubs)
        template: {
          select: {
            pool: { select: { provider: true } }, // VmProviderType lives on VmLabPool
          },
        },
      },
    });

    if (expired.length === 0) return;
    this.logger.log(`[HealthChecker] Expiring ${expired.length} instance(s)`);

    await Promise.allSettled(
      expired.map(async (inst) => {
        try {
          // Resolve provider type from pool; fall back to DOCKER_LOCAL if pool not set yet
          const providerType = inst.template?.pool?.provider ?? 'DOCKER_LOCAL';
          const provider = this.providerFactory.resolve(providerType);

          // Use containerId when available; fall back to instance.id for stub environments
          await provider.destroy(inst.containerId ?? inst.id);

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

  // ── 2. Ping RUNNING instances every 5 minutes ─────────────────────────────
  @(Cron(CronExpression.EVERY_5_MINUTES))
  async pingRunningInstances(): Promise<void> {
    const running = await this.prisma.vmLabInstance.findMany({
      where: { status: VmInstanceStatus.RUNNING },
      select: {
        id: true,
        containerId: true,
        template: {
          select: {
            pool: { select: { provider: true } },
          },
        },
      },
    });

    if (running.length === 0) return;
    this.logger.debug(`[HealthChecker] Pinging ${running.length} running instance(s)`);

    await Promise.allSettled(
      running.map(async (inst) => {
        try {
          const providerType = inst.template?.pool?.provider ?? 'DOCKER_LOCAL';
          const provider = this.providerFactory.resolve(providerType);
          const result = await provider.healthCheck(inst.containerId ?? inst.id);

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
                meta: {
                  errorMessage: result.errorMessage,
                  latencyMs: result.latencyMs,
                },
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
