import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../core/database';
import { NotificationsService } from '../notifications/services/notifications.service';
import { NotificationEvents } from '../notifications/notifications.events';

/** XP formula mirrors practice-labs.service */
function calcLevel(totalXP: number): number {
  return Math.floor(totalXP / 1000) + 1;
}

@Injectable()
export class BadgesService {
  constructor(
    private prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  // ── Public read methods ──────────────────────────────────────────────

  /** All badges in the catalog (no auth required) */
  async getAllBadges() {
    return this.prisma.badge.findMany({
      orderBy: [{ type: 'asc' }, { xpReward: 'desc' }],
    });
  }

  /** Only badges the authenticated user has earned */
  async getUserBadges(userId: string) {
    return this.prisma.userBadge.findMany({
      where: { userId },
      include: { badge: true },
      orderBy: { awardedAt: 'desc' },
    });
  }

  /**
   * Full catalog with earned/locked status per badge.
   * Returns: badge + { earned: boolean, awardedAt: Date | null }
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

  // ── Core award logic ─────────────────────────────────────────────────

  /**
   * Award a badge to a user — idempotent (safe to call multiple times).
   *
   * ⚠️  Does NOT wrap itself in a $transaction — callers must not call
   *     this method from inside an interactive transaction (Prisma does
   *     not support nested interactive transactions).
   */
  async awardBadge(
    userId: string,
    badgeCode: string,
    context?: string,
    awardedBy?: string,
  ): Promise<{ badge: any; awarded: boolean; message?: string }> {
    // 1. Resolve badge
    const badge = await this.prisma.badge.findUnique({
      where: { code: badgeCode },
    });
    if (!badge) {
      throw new NotFoundException(`Badge "${badgeCode}" not found in DB`);
    }

    // 2. Idempotency check (context-aware)
    const existing = await this.prisma.userBadge.findFirst({
      where: {
        userId,
        badgeId: badge.id,
        context: context !== undefined ? context : null,
      },
    });
    if (existing) {
      return { badge, awarded: false, message: 'Already earned' };
    }

    // 3. Create badge record
    await this.prisma.userBadge.create({
      data: {
        userId,
        badgeId: badge.id,
        context: context ?? null,
        awardedBy: awardedBy ?? null,
      },
    });

    // 4. Award XP + Points (mirrors practice-labs awardXP pattern)
    if (badge.xpReward > 0) {
      await this.prisma.$transaction(async (tx) => {
        const updated = await tx.userPoints.upsert({
          where: { userId },
          update: { totalXP: { increment: badge.xpReward } },
          create: { userId, totalXP: badge.xpReward, level: 1 },
        });
        const newLevel = calcLevel(updated.totalXP);
        if (newLevel !== updated.level) {
          await tx.userPoints.update({
            where: { userId },
            data: { level: newLevel },
          });
        }
        await tx.xPLog.create({
          data: {
            userId,
            source: 'MANUAL',
            amount: badge.xpReward,
            reason: `Badge earned: ${badge.title}`,
          },
        });
      });
    }

    if (badge.pointsReward > 0) {
      await this.prisma.userPoints.upsert({
        where: { userId },
        update: { totalPoints: { increment: badge.pointsReward } },
        create: { userId, totalPoints: badge.pointsReward },
      });
    }
    this.notifications
      .notify(
        userId,
        NotificationEvents.badgeEarned(badge.title, badge.ar_title || ''),
      )
      .catch(() => {});

    return { badge, awarded: true };
  }

  // ── Milestone checkers ───────────────────────────────────────────────

  /**
   * Call after a lab is solved to auto-award milestone badges.
   * Already called by practice-labs.service.ts inside a try/catch.
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
   * Call after a course is completed to auto-award milestone badges.
   * Called non-blocking from courses.service.ts markComplete().
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

  // ── Backfill ─────────────────────────────────────────────────────────

  /**
   * Retroactively awards all earned badges + issues missing certificates.
   * POST /badges/backfill-my-badges — idempotent, safe to call many times.
   */
  async backfillUserBadges(userId: string): Promise<string[]> {
    const awarded: string[] = [];

    // 1. Course milestone badges
    const completedCourses = await this.prisma.enrollment.count({
      where: { userId, isCompleted: true },
    });
    const courseBadges = await this.checkCourseMilestoneBadges(
      userId,
      completedCourses,
    );
    awarded.push(...courseBadges);

    // 2. Lab milestone badges
    const completedLabs = await this.prisma.userLabProgress.count({
      where: { userId, completedAt: { not: null } },
    });
    const labBadges = await this.checkLabMilestoneBadges(userId, completedLabs);
    awarded.push(...labBadges);

    // 3. Issue missing certificates for completed courses (idempotent)
    const completedEnrollments = await this.prisma.enrollment.findMany({
      where: { userId, isCompleted: true },
      select: { courseId: true },
    });

    for (const { courseId } of completedEnrollments) {
      const existing = await this.prisma.issuedCertificate.findUnique({
        where: { userId_courseId: { userId, courseId } },
      });
      if (!existing) {
        const date = new Date();
        const datePart = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
        const random = Math.random().toString(36).slice(2, 8).toUpperCase();
        await this.prisma.issuedCertificate
          .create({
            data: {
              userId,
              courseId,
              certificateUrl: '',
              verificationId: `CL-${datePart}-${random}`,
              status: 'ACTIVE',
            },
          })
          .catch(() => null);
      }
    }

    return awarded;
  }
}
