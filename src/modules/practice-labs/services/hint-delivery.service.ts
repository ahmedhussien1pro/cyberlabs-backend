// src/modules/practice-labs/services/hint-delivery.service.ts
// Responsible for: hint request validation, delivery, XP deduction
// Extracted from PracticeLabsService (God Service refactor — PR #1)

import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../../core/database';
import { HintPenaltyService } from '../shared/services/hint-penalty.service';
import { HintPenaltyMode } from '../types/lab.types';

@Injectable()
export class HintDeliveryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly hintPenalty: HintPenaltyService,
  ) {}

  // ─────────────────────────────────────────────
  // POST /practice-labs/:labId/hint
  // ─────────────────────────────────────────────
  async getHint(labId: string, userId: string, hintOrder: number) {
    if (hintOrder < 1 || hintOrder > 3) {
      throw new BadRequestException(
        'Invalid hint order. Must be between 1 and 3.',
      );
    }

    const hint = await this.prisma.labHint.findFirst({
      where: { labId, order: hintOrder },
    });
    if (!hint) throw new NotFoundException('Hint not found');

    const alreadyRecorded = !(await this.hintPenalty.recordHintUsage(
      userId,
      labId,
      hint.id,
      hint.order,
      hint.xpCost,
    ));

    if (alreadyRecorded) {
      return {
        success: true,
        alreadyUnlocked: true,
        isLastHint: hint.order >= 3,
        hint: {
          content: hint.content,
          ar_content: hint.ar_content,
          xpCost: 0,
          penaltyPercent: hint.penaltyPercent,
        },
      };
    }

    const labForPenalty = await this.prisma.lab.findUnique({
      where: { id: labId },
      select: { hintPenaltyMode: true },
    });
    const penaltyMode: HintPenaltyMode =
      (labForPenalty?.hintPenaltyMode as HintPenaltyMode) ?? 'PERCENTAGE';

    if (penaltyMode === 'FIXED_XP' && hint.xpCost > 0) {
      const userPoints = await this.prisma.userPoints.findUnique({
        where: { userId },
      });
      if (!userPoints || userPoints.totalXP < hint.xpCost) {
        await this.prisma.labHintUsage.delete({
          where: { userId_labId_hintOrder: { userId, labId, hintOrder } },
        });
        return {
          success: false,
          message: 'Not enough XP to unlock this hint',
          required: hint.xpCost,
          available: userPoints?.totalXP ?? 0,
        };
      }
      await this.prisma.userPoints.update({
        where: { userId },
        data: { totalXP: { decrement: hint.xpCost } },
      });
    }

    await this.prisma.userLabProgress.upsert({
      where: { userId_labId: { userId, labId } },
      update: { hintsUsed: { increment: 1 } },
      create: {
        userId,
        labId,
        hintsUsed: 1,
        startedAt: new Date(),
        lastAccess: new Date(),
      },
    });

    const isLastHint = hint.order >= 3;
    const hintSummary = await this.hintPenalty.getHintSummary(userId, labId);

    return {
      success: true,
      alreadyUnlocked: false,
      isLastHint,
      hint: {
        content: hint.content,
        ar_content: hint.ar_content,
        xpCost: penaltyMode === 'FIXED_XP' ? hint.xpCost : 0,
        penaltyPercent: hint.penaltyPercent,
      },
      hintSummary: {
        hintsUsed: hintSummary.count,
        submissionPenaltyPreview: `${hint.penaltyPercent}%`,
      },
    };
  }
}
