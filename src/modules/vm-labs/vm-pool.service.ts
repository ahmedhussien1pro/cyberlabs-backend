import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service';
import { VmInstanceStatus } from '@prisma/client';

const ACTIVE_STATUSES: VmInstanceStatus[] = [
  VmInstanceStatus.QUEUED,
  VmInstanceStatus.PROVISIONING,
  VmInstanceStatus.STARTING,
  VmInstanceStatus.RUNNING,
  VmInstanceStatus.PAUSED,
];

@Injectable()
export class VmPoolService {
  private readonly logger = new Logger(VmPoolService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Check if a slot is available for a given template.
   * Returns 'available' or 'queued'.
   * Throws if pool config is missing.
   */
  async checkAvailableSlot(
    templateId: string,
  ): Promise<{ available: boolean; activeCount: number; maxSize: number; estimatedWaitMin: number | null }> {
    const pool = await this.prisma.vmLabPool.findUnique({
      where: { templateId },
    });

    // If no pool row exists yet, allow up to 5 concurrent (safe default)
    const maxSize = pool?.maxSize ?? 5;

    const activeCount = await this.prisma.vmLabInstance.count({
      where: {
        templateId,
        status: { in: ACTIVE_STATUSES },
      },
    });

    if (activeCount < maxSize) {
      return { available: true, activeCount, maxSize, estimatedWaitMin: null };
    }

    // Estimate wait: average ~15 min per slot ahead in queue
    const queuedAhead = activeCount - maxSize;
    const estimatedWaitMin = Math.max(5, (queuedAhead + 1) * 15);
    return { available: false, activeCount, maxSize, estimatedWaitMin };
  }

  /**
   * Ensure user does NOT already have an active instance for this template.
   * Returns existing instance ID if found, null otherwise.
   */
  async getExistingUserInstance(
    userId: string,
    templateId: string,
  ): Promise<string | null> {
    const existing = await this.prisma.vmLabInstance.findFirst({
      where: {
        userId,
        templateId,
        status: { in: ACTIVE_STATUSES },
      },
      select: { id: true },
    });
    return existing?.id ?? null;
  }

  /**
   * Enforce global per-user cap: max N active instances across all templates.
   * Default max = 1 (configurable via VM_MAX_INSTANCES_PER_USER env var).
   */
  async enforceUserCap(userId: string): Promise<void> {
    const max = parseInt(process.env.VM_MAX_INSTANCES_PER_USER ?? '1', 10);
    const active = await this.prisma.vmLabInstance.count({
      where: {
        userId,
        status: { in: ACTIVE_STATUSES },
      },
    });
    if (active >= max) {
      throw new BadRequestException(
        `You already have ${active} active lab(s). Stop it before starting a new one.`,
      );
    }
  }

  /**
   * Sync pool.activeCount from real DB state.
   * Called by the cleanup cron (syncPoolCounts) to prevent drift.
   */
  async syncAllPoolCounts(): Promise<void> {
    const pools = await this.prisma.vmLabPool.findMany({
      select: { id: true, templateId: true },
    });

    await Promise.allSettled(
      pools.map(async (pool) => {
        const activeCount = await this.prisma.vmLabInstance.count({
          where: {
            templateId: pool.templateId,
            status: { in: ACTIVE_STATUSES },
          },
        });
        const queuedCount = await this.prisma.vmLabInstance.count({
          where: {
            templateId: pool.templateId,
            status: VmInstanceStatus.QUEUED,
          },
        });
        await this.prisma.vmLabPool.update({
          where: { id: pool.id },
          data: { activeCount, queuedCount },
        });
        this.logger.debug(
          `[Pool] Synced pool for template ${pool.templateId}: active=${activeCount}, queued=${queuedCount}`,
        );
      }),
    );
  }

  /**
   * Get pool stats for all templates (admin panel).
   */
  async getPoolStats() {
    const pools = await this.prisma.vmLabPool.findMany({
      include: {
        template: { select: { id: true, title: true, slug: true } },
      },
    });

    return pools.map((p) => ({
      templateId: p.templateId,
      templateTitle: p.template.title,
      templateSlug: p.template.slug,
      provider: p.provider,
      region: p.region,
      maxSize: p.maxSize,
      activeCount: p.activeCount,
      queuedCount: p.queuedCount,
      availableSlots: Math.max(0, p.maxSize - p.activeCount),
    }));
  }

  /**
   * Process QUEUED instances — transition the oldest queued instance
   * to PROVISIONING if a slot is now available.
   * Called every minute by the cleanup cron.
   */
  async processQueue(): Promise<void> {
    // Get all templates that have QUEUED instances
    const queuedGroups = await this.prisma.vmLabInstance.groupBy({
      by: ['templateId'],
      where: { status: VmInstanceStatus.QUEUED },
    });

    for (const group of queuedGroups) {
      const { available } = await this.checkAvailableSlot(group.templateId);
      if (!available) continue;

      // Grab oldest QUEUED instance for this template
      const next = await this.prisma.vmLabInstance.findFirst({
        where: {
          templateId: group.templateId,
          status: VmInstanceStatus.QUEUED,
        },
        orderBy: { queuedAt: 'asc' },
      });
      if (!next) continue;

      // Transition to PROVISIONING — orchestrator will pick it up
      await this.prisma.vmLabInstance.update({
        where: { id: next.id },
        data: { status: VmInstanceStatus.PROVISIONING },
      });

      await this.prisma.vmLabEvent.create({
        data: {
          instanceId: next.id,
          userId: next.userId,
          eventType: 'INSTANCE_STARTED',
          meta: { reason: 'Queue slot opened' },
        },
      });

      this.logger.log(
        `[Pool] Queue: instance ${next.id} → PROVISIONING (template ${group.templateId})`,
      );
    }
  }
}
