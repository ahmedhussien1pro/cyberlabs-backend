/**
 * [9.9] VmDailyCapGuard
 *
 * Enforces per-user daily VM lab start limits.
 * Configurable via env vars — no code changes needed for tier adjustments.
 *
 * Security controls implemented:
 *   ✅ [9.9] Max active VMs per user   — VM_MAX_INSTANCES_PER_USER (default: 1)
 *   ✅ [9.9] Max daily starts per user — VM_MAX_DAILY_STARTS (default: 5)
 *
 * Apply only on POST start routes:
 *   @UseGuards(JwtAuthGuard, VmDailyCapGuard)
 *   @Post(':slug/start')
 */

import {
  CanActivate,
  ExecutionContext,
  BadRequestException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma.service';
import { VmInstanceStatus } from '@prisma/client';

const MAX_ACTIVE_PER_USER = Number(process.env.VM_MAX_INSTANCES_PER_USER ?? 1);
const MAX_DAILY_STARTS   = Number(process.env.VM_MAX_DAILY_STARTS ?? 5);

/** Active statuses — instance is occupying a resource slot */
const ACTIVE_STATUSES: VmInstanceStatus[] = [
  VmInstanceStatus.QUEUED,
  VmInstanceStatus.PROVISIONING,
  VmInstanceStatus.STARTING,
  VmInstanceStatus.RUNNING,
  VmInstanceStatus.PAUSED,
  VmInstanceStatus.STOPPING,
];

@Injectable()
export class VmDailyCapGuard implements CanActivate {
  private readonly logger = new Logger(VmDailyCapGuard.name);

  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const userId  = request.user?.id;
    if (!userId) return false;

    // [9.9a] Check concurrent active instance cap
    const activeCount = await this.prisma.vmLabInstance.count({
      where: { userId, status: { in: ACTIVE_STATUSES } },
    });

    if (activeCount >= MAX_ACTIVE_PER_USER) {
      this.logger.warn(`VmDailyCapGuard: userId=${userId} hit active cap (${activeCount}/${MAX_ACTIVE_PER_USER})`);
      throw new BadRequestException(
        `You already have ${activeCount} active VM lab(s). ` +
        `Maximum allowed: ${MAX_ACTIVE_PER_USER}. Stop an existing session to start a new one.`,
      );
    }

    // [9.9b] Check daily start count
    const startOfDay = new Date();
    startOfDay.setUTCHours(0, 0, 0, 0);

    const dailyStarts = await this.prisma.vmLabInstance.count({
      where: {
        userId,
        createdAt: { gte: startOfDay },
      },
    });

    if (dailyStarts >= MAX_DAILY_STARTS) {
      this.logger.warn(`VmDailyCapGuard: userId=${userId} hit daily cap (${dailyStarts}/${MAX_DAILY_STARTS})`);
      throw new BadRequestException(
        `You have started ${dailyStarts} VM labs today. ` +
        `Daily limit: ${MAX_DAILY_STARTS}. Resets at midnight UTC.`,
      );
    }

    return true;
  }
}
