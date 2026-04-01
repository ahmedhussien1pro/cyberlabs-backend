import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service';
import { VmInstanceStatus } from '@prisma/client';
import { VmProviderFactory } from './providers/vm-provider.factory';

// ─────────────────────────────────────────────────────────────────────────────
// @nestjs/schedule is an OPTIONAL dependency.
// Install it to activate Cron jobs:
//   npm install @nestjs/schedule
//   Then add ScheduleModule.forRoot() to AppModule imports.
//
// Until it is installed the file still compiles — decorators are inlined as
// no-ops via the conditional shim below.
// ─────────────────────────────────────────────────────────────────────────────
let Cron: (expression: string) => MethodDecorator;
let CronExpression: { EVERY_MINUTE: string; EVERY_5_MINUTES: string };

try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const schedule = require('@nestjs/schedule');
  Cron = schedule.Cron;
  CronExpression = schedule.CronExpression;
} catch {
  // @nestjs/schedule not installed — use no-op stubs so the file compiles
  Cron = (_expr: string) => (_target: object, _key: string | symbol, descriptor: PropertyDescriptor) => descriptor;
  CronExpression = { EVERY_MINUTE: '* * * * *', EVERY_5_MINUTES: '*/5 * * * *' };
}

/**
 * VmLabsHealthChecker — periodic scheduler that:
 *   1. Detects expired instances and marks them EXPIRED / triggers cleanup
 *   2. Pings RUNNING instances to catch silent crashes (HEALTH_CHECK_FAILED)
 *   3. Logs every lifecycle event to VmLabEvent
 *
 * Requires @nestjs/schedule + ScheduleModule.forRoot() in AppModule.
 */
@Injectable()
export class VmLabsHealthChecker {
  private readonly logger = new Logger(VmLabsHealthChecker.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly providerFactory: VmProviderFactory,
  ) {}

  // ── 1. Expire stale instances every minute ──────────────────────────────
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
        externalId: true,
        providerType: true,
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

  // ── 2. Ping RUNNING instances every 5 minutes ───────────────────────────
  @(Cron(CronExpression.EVERY_5_MINUTES))
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
