import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../../core/database';
import { SubmitLabDto, SubmissionQueryDto } from '../dto';
import { SubmissionSerializer } from '../serializers';
import { plainToClass } from 'class-transformer';

@Injectable()
export class SubmissionsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Submit lab solution
   */
  async submitLab(
    userId: string,
    labId: string,
    submitDto: SubmitLabDto,
  ): Promise<any> {
    const { code, flagAnswer } = submitDto;

    // Get lab
    const lab = await this.prisma.lab.findUnique({
      where: { id: labId },
    });

    if (!lab) {
      throw new NotFoundException('Lab not found');
    }

    // Get or create progress
    let progress = await this.prisma.userLabProgress.findUnique({
      where: {
        userId_labId: {
          userId,
          labId,
        },
      },
    });

    if (!progress) {
      // Auto-create progress if not exists
      progress = await this.prisma.userLabProgress.create({
        data: {
          userId,
          labId,
          progress: 0,
          attempts: 0,
          hintsUsed: 0,
          flagSubmitted: false,
          startedAt: new Date(),
          lastAccess: new Date(),
        },
      });
    }

    // Check max attempts
    if (lab.maxAttempts && progress.attempts >= lab.maxAttempts) {
      throw new BadRequestException('Maximum attempts reached for this lab');
    }

    // Check if already completed
    if (progress.completedAt) {
      throw new BadRequestException('Lab already completed');
    }

    // Validate flag
    const isCorrect =
      flagAnswer.trim().toLowerCase() === lab.flagAnswer?.trim().toLowerCase();

    // Calculate time taken (in seconds)
    const timeTaken = Math.floor(
      (new Date().getTime() - progress.startedAt.getTime()) / 1000,
    );

    // Get current attempt number
    const attemptNumber = progress.attempts + 1;

    // Calculate points
    let pointsEarned = 0;
    let xpEarned = 0;

    if (isCorrect) {
      // Base points
      const basePoints = lab.pointsReward || 100;
      const baseXP = lab.xpReward || 50;

      // Time bonus (if completed within time limit)
      let timeBonus = 0;
      if (lab.timeLimit && timeTaken <= lab.timeLimit) {
        const timePercentage = (lab.timeLimit - timeTaken) / lab.timeLimit;
        timeBonus = Math.floor(basePoints * 0.3 * timePercentage); // 30% max bonus
      }

      // Attempt penalty (fewer attempts = more points)
      const attemptPenalty = (attemptNumber - 1) * 10;

      // Final calculation
      pointsEarned = Math.max(10, basePoints + timeBonus - attemptPenalty);
      xpEarned = Math.max(5, baseXP + Math.floor(timeBonus * 0.5));
    }

    // Create submission
    const submission = await this.prisma.labSubmission.create({
      data: {
        userId,
        labId,
        code,
        flagAnswer,
        isCorrect,
        timeTaken,
        attemptNumber,
        pointsEarned,
        xpEarned,
        submittedAt: new Date(),
      },
    });

    // Update progress
    await this.prisma.userLabProgress.update({
      where: {
        userId_labId: {
          userId,
          labId,
        },
      },
      data: {
        attempts: attemptNumber,
        flagSubmitted: true,
        completedAt: isCorrect ? new Date() : undefined,
        progress: isCorrect ? 100 : progress.progress,
        lastAccess: new Date(),
      },
    });

    // If correct, update user points
    if (isCorrect) {
      // Update or create UserPoints
      const userPoints = await this.prisma.userPoints.findUnique({
        where: { userId },
      });

      if (userPoints) {
        const newTotalPoints = userPoints.totalPoints + pointsEarned;
        const newTotalXP = userPoints.totalXP + xpEarned;

        // Calculate new level (simple formula: level = floor(XP / 1000) + 1)
        const newLevel = Math.floor(newTotalXP / 1000) + 1;

        await this.prisma.userPoints.update({
          where: { userId },
          data: {
            totalPoints: newTotalPoints,
            totalXP: newTotalXP,
            level: newLevel,
          },
        });
      } else {
        await this.prisma.userPoints.create({
          data: {
            userId,
            totalPoints: pointsEarned,
            totalXP: xpEarned,
            level: 1,
          },
        });
      }

      // Create points history
      await this.prisma.pointsHistory.create({
        data: {
          userId,
          points: pointsEarned,
          reason: `Completed lab: ${lab.title}`,
          ar_reason: `أكمل التجربة: ${lab.ar_title || lab.title}`,
        },
      });

      // Create XP log
      await this.prisma.xPLog.create({
        data: {
          userId,
          source: 'LAB',
          amount: xpEarned,
          reason: `Completed lab: ${lab.title}`,
          ar_reason: `أكمل التجربة: ${lab.ar_title || lab.title}`,
          context: labId,
        },
      });

      // Update user stats
      await this.prisma.userStats.upsert({
        where: { userId },
        create: {
          userId,
          completedLabs: 1,
          lastActivityDate: new Date(),
        },
        update: {
          completedLabs: {
            increment: 1,
          },
          lastActivityDate: new Date(),
        },
      });
    }

    return {
      submission: plainToClass(SubmissionSerializer, submission, {
        excludeExtraneousValues: true,
      }),
      result: {
        isCorrect,
        pointsEarned,
        xpEarned,
        timeTaken,
        attemptNumber,
        message: isCorrect
          ? 'Congratulations! Lab completed successfully!'
          : 'Incorrect flag. Try again!',
      },
    };
  }

  /**
   * Get user submissions for a lab
   */
  async getLabSubmissions(
    userId: string,
    labId: string,
    query: SubmissionQueryDto,
  ) {
    const { page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const submissions = await this.prisma.labSubmission.findMany({
      where: {
        userId,
        labId,
      },
      skip,
      take: limit,
      orderBy: { submittedAt: 'desc' },
    });

    const total = await this.prisma.labSubmission.count({
      where: { userId, labId },
    });

    const data = submissions.map((submission) =>
      plainToClass(SubmissionSerializer, submission, {
        excludeExtraneousValues: true,
      }),
    );

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get all user submissions
   */
  async getUserSubmissions(userId: string, query: SubmissionQueryDto) {
    const { page = 1, limit = 10, labId, isCorrect } = query;
    const skip = (page - 1) * limit;

    const where: any = { userId };

    if (labId) {
      where.labId = labId;
    }

    if (isCorrect !== undefined) {
      where.isCorrect = isCorrect;
    }

    const submissions = await this.prisma.labSubmission.findMany({
      where,
      skip,
      take: limit,
      orderBy: { submittedAt: 'desc' },
    });

    const total = await this.prisma.labSubmission.count({ where });

    const data = submissions.map((submission) =>
      plainToClass(SubmissionSerializer, submission, {
        excludeExtraneousValues: true,
      }),
    );

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
