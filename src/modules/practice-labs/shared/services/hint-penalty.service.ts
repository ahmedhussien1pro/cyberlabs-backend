// src/modules/practice-labs/shared/services/hint-penalty.service.ts
//
// Calculates the points/XP penalty to apply at submission time
// based on how many hints the user unlocked.
//
// Policy (PERCENTAGE mode — new standard):
//   hints used | penalty
//   -----------|--------
//        0     |   0%
//        1     |  10%
//        2     |  30%
//        3     |  60%
//       4+     |  90%  (solution / final hint)
//
// FIXED_XP mode (legacy): no deduction here — already deducted at unlock.

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../core/database';

/** Penalty map: hintsUsed → fraction to deduct from reward */
const PENALTY_MAP: Record<number, number> = {
  0: 0.0,
  1: 0.10,
  2: 0.30,
  3: 0.60,
};
const MAX_PENALTY = 0.90; // 4+ hints or solution used

export interface PenaltyResult {
  finalPoints: number;
  finalXP: number;
  penaltyPercent: number;
  hintsUsed: number;
}

@Injectable()
export class HintPenaltyService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Calculate the final points and XP to award after applying hint penalties.
   *
   * @param userId       - User who submitted
   * @param labId        - Lab being submitted
   * @param basePoints   - lab.pointsReward
   * @param baseXP       - lab.xpReward
   * @param penaltyMode  - 'PERCENTAGE' | 'FIXED_XP'
   */
  async calculate(
    userId: string,
    labId: string,
    basePoints: number,
    baseXP: number,
    penaltyMode: string,
  ): Promise<PenaltyResult> {
    // Legacy mode: no deduction at submission — already deducted per unlock
    if (penaltyMode === 'FIXED_XP') {
      return {
        finalPoints: basePoints,
        finalXP: baseXP,
        penaltyPercent: 0,
        hintsUsed: 0,
      };
    }

    // Count distinct hints used (audit log is source of truth)
    const hintsUsed = await this.prisma.labHintUsage.count({
      where: { userId, labId },
    });

    const penalty =
      hintsUsed >= 4 ? MAX_PENALTY : (PENALTY_MAP[hintsUsed] ?? MAX_PENALTY);

    const finalPoints = Math.max(0, Math.floor(basePoints * (1 - penalty)));
    const finalXP     = Math.max(0, Math.floor(baseXP     * (1 - penalty)));

    return {
      finalPoints,
      finalXP,
      penaltyPercent: Math.round(penalty * 100),
      hintsUsed,
    };
  }

  /**
   * Record a hint usage in the audit log.
   * Idempotent — does nothing if the same hint was already unlocked.
   *
   * @returns true if newly recorded, false if already existed
   */
  async recordHintUsage(
    userId: string,
    labId: string,
    hintId: string,
    hintOrder: number,
    xpCost: number,
  ): Promise<boolean> {
    const existing = await this.prisma.labHintUsage.findUnique({
      where: { userId_labId_hintOrder: { userId, labId, hintOrder } },
    });

    if (existing) return false; // already recorded — no double deduction

    await this.prisma.labHintUsage.create({
      data: { userId, labId, hintId, hintOrder, xpCost },
    });

    return true;
  }

  /**
   * Returns how many hints a user has used for a lab,
   * along with which hint orders were used.
   */
  async getHintSummary(
    userId: string,
    labId: string,
  ): Promise<{ count: number; orders: number[] }> {
    const usages = await this.prisma.labHintUsage.findMany({
      where: { userId, labId },
      select: { hintOrder: true },
      orderBy: { hintOrder: 'asc' },
    });

    return {
      count: usages.length,
      orders: usages.map((u) => u.hintOrder),
    };
  }
}
