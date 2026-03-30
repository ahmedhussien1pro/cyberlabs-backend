// src/modules/practice-labs/services/flag-submission.service.ts
// Responsible for: flag validation, scoring, XP/points awarding, badge checks
// Extracted from PracticeLabsService (God Service refactor — PR #1)

import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../../core/database';
import { BadgesService } from '../../badges/badges.service';
import { NotificationsService } from '../../notifications/services/notifications.service';
import { NotificationEvents } from '../../notifications/notifications.events';
import { PracticeLabStateService } from '../shared/services/practice-lab-state.service';
import { HintPenaltyService } from '../shared/services/hint-penalty.service';
import { FlagRecordService } from '../shared/services/flag-record.service';
import { FlagPolicyType, HintPenaltyMode, LabWithPolicy } from '../types/lab.types';

@Injectable()
export class FlagSubmissionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly badgesService: BadgesService,
    private readonly notifications: NotificationsService,
    private readonly stateService: PracticeLabStateService,
    private readonly hintPenalty: HintPenaltyService,
    private readonly flagRecord: FlagRecordService,
  ) {}

  // ─────────────────────────────────────────────
  // POST /practice-labs/:labId/submit
  // ─────────────────────────────────────────────
  async submitFlag(
    labId: string,
    userId: string,
    flag: string,
    attemptId?: string,
  ) {
    const lab = (await this.prisma.lab.findUnique({
      where: { id: labId },
      include: { usersProgress: { where: { userId } } },
    })) as (LabWithPolicy & { usersProgress: any[] }) | null;

    if (!lab) throw new NotFoundException('Lab not found');

    const flagPolicy: FlagPolicyType = lab.flagPolicyType ?? 'PER_USER_PER_LAB';
    let isCorrect: boolean;

    if (
      attemptId &&
      (flagPolicy === 'PER_USER_PER_ATTEMPT' || flagPolicy === 'PER_SESSION')
    ) {
      const result = await this.flagRecord.verifyAndConsume(
        userId,
        labId,
        attemptId,
        flag,
      );
      if (result === 'already_used')
        throw new BadRequestException('Flag already used — lab already solved.');
      if (result === 'expired')
        throw new BadRequestException('Flag expired. Please relaunch the lab.');
      isCorrect = result === 'correct';
    } else {
      const expectedFlag = this.stateService.generateDynamicFlag(
        `FLAG{${lab.slug.toUpperCase().replace(/-/g, '_')}`,
        userId,
        labId,
      );
      isCorrect = expectedFlag === flag.trim();
    }

    let progress = lab.usersProgress[0];
    if (!progress) {
      progress = await this.prisma.userLabProgress.create({
        data: {
          userId,
          labId,
          attempts: 1,
          startedAt: new Date(),
          lastAccess: new Date(),
        },
      });
    } else if (!progress.flagSubmitted) {
      progress = await this.prisma.userLabProgress.update({
        where: { id: progress.id },
        data: { lastAccess: new Date() },
      });
    }

    const isFirstSolve = isCorrect && !progress.flagSubmitted;
    let finalPoints = isFirstSolve ? lab.pointsReward : 0;
    let finalXP = isFirstSolve ? lab.xpReward : 0;
    let penaltyPercent = 0;

    if (isFirstSolve) {
      const penaltyMode: HintPenaltyMode = lab.hintPenaltyMode ?? 'PERCENTAGE';
      const penalty = await this.hintPenalty.calculate(
        userId,
        labId,
        lab.pointsReward,
        lab.xpReward,
        penaltyMode,
      );
      finalPoints = penalty.finalPoints;
      finalXP = penalty.finalXP;
      penaltyPercent = penalty.penaltyPercent;
    }

    const submissionCount = await this.prisma.labSubmission.count({
      where: { userId, labId },
    });

    const instance = await this.prisma.labInstance.findUnique({
      where: { userId_labId: { userId, labId } },
      select: { startedAt: true },
    });
    const timeTaken = Math.floor(
      (Date.now() -
        new Date(instance?.startedAt ?? progress.startedAt).getTime()) /
        1000,
    );

    const submission = await this.prisma.labSubmission.create({
      data: {
        userId,
        labId,
        flagAnswer: flag,
        isCorrect,
        attemptNumber: submissionCount + 1,
        pointsEarned: finalPoints,
        xpEarned: finalXP,
        timeTaken,
      },
    });

    if (isFirstSolve) {
      await this.prisma.userLabProgress.update({
        where: { id: progress.id },
        data: { flagSubmitted: true, completedAt: new Date(), progress: 100 },
      });
      await this.awardXP(userId, finalXP, 'LAB', `Completed lab: ${lab.title}`);
      await this.awardPoints(userId, finalPoints, `Completed lab: ${lab.title}`);
      this.notifications
        .notify(
          userId,
          NotificationEvents.labCompleted(lab.title, finalXP, finalPoints),
        )
        .catch(() => {});
      try {
        const completedCount = await this.prisma.userLabProgress.count({
          where: { userId, completedAt: { not: null } },
        });
        await this.badgesService.checkLabMilestoneBadges(userId, completedCount);
      } catch {
        /* Non-blocking */
      }
    }

    return {
      success: true,
      isCorrect,
      isFirstSolve,
      isCompleted: isCorrect,
      totalAttempts: submissionCount + 1,
      penaltyPercent,
      message: isCorrect
        ? isFirstSolve
          ? penaltyPercent > 0
            ? `🎉 Lab completed! Penalty applied: ${penaltyPercent}% (hints used).`
            : '🎉 Congratulations! Lab completed with full reward!'
          : '✅ Correct flag — already solved before, no new points awarded.'
        : '❌ Wrong flag. Try again!',
      submission: {
        id: submission.id,
        attemptNumber: submission.attemptNumber,
        pointsEarned: submission.pointsEarned,
        xpEarned: submission.xpEarned,
        submittedAt: submission.submittedAt,
      },
    };
  }

  // ─────────────────────────────────────────────
  // Private: XP & Points awarding helpers
  // (kept here — tightly coupled to submitFlag flow)
  // ─────────────────────────────────────────────
  private async calcLevel(userId: string, totalXP: number): Promise<number> {
    try {
      const levels = await this.prisma.level.findMany({
        orderBy: { level: 'desc' },
      });
      if (levels.length === 0) return Math.floor(totalXP / 1000) + 1;
      const matched = levels.find((l) => totalXP >= l.xpNeeded);
      return matched?.level ?? 1;
    } catch {
      return Math.floor(totalXP / 1000) + 1;
    }
  }

  private async awardXP(
    userId: string,
    amount: number,
    source: any,
    reason: string,
  ) {
    if (amount <= 0) return;
    await this.prisma.$transaction(async (tx) => {
      const updated = await tx.userPoints.upsert({
        where: { userId },
        update: { totalXP: { increment: amount } },
        create: { userId, totalXP: amount, level: 1 },
      });
      const newLevel = await this.calcLevel(userId, updated.totalXP);
      if (newLevel !== updated.level) {
        await tx.userPoints.update({
          where: { userId },
          data: { level: newLevel },
        });
      }
      await tx.xPLog.create({ data: { userId, source, amount, reason } });
    });
  }

  private async awardPoints(userId: string, amount: number, reason: string) {
    if (amount <= 0) return;
    await this.prisma.$transaction([
      this.prisma.userPoints.upsert({
        where: { userId },
        update: { totalPoints: { increment: amount } },
        create: { userId, totalPoints: amount },
      }),
      this.prisma.pointsLog.create({ data: { userId, amount, reason } }),
    ]);
  }
}
