import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../core/database';

@Injectable()
export class BadgesService {
  constructor(private prisma: PrismaService) {}

  /** All badges in the catalog (public) */
  async getAllBadges() {
    return this.prisma.badge.findMany({
      orderBy: [{ type: 'asc' }, { xpReward: 'desc' }],
    });
  }

  /** Badges earned by the authenticated user */
  async getUserBadges(userId: string) {
    return this.prisma.userBadge.findMany({
      where: { userId },
      include: { badge: true },
      orderBy: { awardedAt: 'desc' },
    });
  }

  /**
   * Full catalog + earned status for the current user.
   * Returns each badge with { earned: boolean, awardedAt?: Date }
   */
  async getBadgesWithStatus(userId: string) {
    const [allBadges, userBadges] = await Promise.all([
      this.prisma.badge.findMany({
        orderBy: [{ type: 'asc' }, { xpReward: 'desc' }],
      }),
      this.prisma.userBadge.findMany({
        where: { userId },
        select: { badgeId: true, awardedAt: true },
      }),
    ]);

    const earnedMap = new Map(
      userBadges.map((ub) => [ub.badgeId, ub.awardedAt]),
    );

    return allBadges.map((badge) => ({
      ...badge,
      earned: earnedMap.has(badge.id),
      awardedAt: earnedMap.get(badge.id) ?? null,
    }));
  }

  /** Award a badge to a user — safe to call multiple times */
  async awardBadge(
    userId: string,
    badgeCode: string,
    context?: string,
    awardedBy?: string,
  ) {
    const badge = await this.prisma.badge.findUnique({
      where: { code: badgeCode },
    });
    if (!badge) throw new NotFoundException(`Badge "${badgeCode}" not found`);

    // Check if already earned with same context
    const existing = await this.prisma.userBadge.findFirst({
      where: { userId, badgeId: badge.id, context: context ?? null },
    });
    if (existing) return { badge, awarded: false, message: 'Already earned' };

    await this.prisma.$transaction(async (tx) => {
      await tx.userBadge.create({
        data: {
          userId,
          badgeId: badge.id,
          context: context ?? null,
          awardedBy: awardedBy ?? null,
        },
      });

      if (badge.xpReward > 0 || badge.pointsReward > 0) {
        if (badge.xpReward > 0) {
          await tx.xPLog.create({
            data: {
              userId,
              source: 'MANUAL',
              amount: badge.xpReward,
              reason: `Badge earned: ${badge.title}`,
              context: `badge:${badge.code}`,
            },
          });
        }

        await tx.userPoints.upsert({
          where: { userId },
          create: {
            userId,
            totalXP: badge.xpReward,
            totalPoints: badge.pointsReward,
            level: 1,
          },
          update: {
            totalXP: { increment: badge.xpReward },
            totalPoints: { increment: badge.pointsReward },
          },
        });
      }
    });

    return { badge, awarded: true };
  }

  /**
   * Auto-check and award milestone badges after a lab is completed.
   * Call from PracticeLabsService after successful flag submission.
   */
  async checkLabMilestoneBadges(
    userId: string,
    completedLabsCount: number,
  ): Promise<string[]> {
    const milestones = [
      { count: 1, code: 'first_lab' },
      { count: 5, code: 'lab_novice' },
      { count: 10, code: 'lab_apprentice' },
      { count: 25, code: 'lab_expert' },
      { count: 50, code: 'lab_master' },
    ];

    const awarded: string[] = [];
    for (const { count, code } of milestones) {
      if (completedLabsCount >= count) {
        const result = await this.awardBadge(userId, code).catch(() => null);
        if (result?.awarded) awarded.push(code);
      }
    }
    return awarded;
  }

  /**
   * Auto-check and award milestone badges after a course is completed.
   * Call from EnrollmentsService / CoursesService after course completion.
   */
  async checkCourseMilestoneBadges(
    userId: string,
    completedCoursesCount: number,
  ): Promise<string[]> {
    const milestones = [
      { count: 1, code: 'first_course' },
      { count: 3, code: 'course_explorer' },
      { count: 10, code: 'course_master' },
    ];

    const awarded: string[] = [];
    for (const { count, code } of milestones) {
      if (completedCoursesCount >= count) {
        const result = await this.awardBadge(userId, code).catch(() => null);
        if (result?.awarded) awarded.push(code);
      }
    }
    return awarded;
  }
}
