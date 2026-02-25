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

    // Use transaction to prevent race conditions on points and submissions
    return this.prisma.$transaction(async (tx) => {
      // 1. Get lab
      const lab = await tx.lab.findUnique({
        where: { id: labId },
      });

      if (!lab) {
        throw new NotFoundException('Lab not found');
      }

      // 2. Get or create progress, with locking if needed
      let progress = await tx.userLabProgress.findUnique({
        where: { userId_labId: { userId, labId } },
      });

      if (!progress) {
        progress = await tx.userLabProgress.create({
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

      // 3. Check attempts and completion
      if (lab.maxAttempts && progress.attempts >= lab.maxAttempts) {
        throw new BadRequestException('Maximum attempts reached for this lab');
      }

      if (progress.completedAt) {
        throw new BadRequestException('Lab already completed');
      }

      // 4. Validate flag securely
      // Default fail if flagAnswer is empty or null, to avoid unintended match
      const providedFlag = flagAnswer?.trim() || '';
      const correctFlag = lab.flagAnswer?.trim() || '';
      
      const isCorrect = 
        providedFlag.length > 0 && 
        correctFlag.length > 0 && 
        providedFlag.toLowerCase() === correctFlag.toLowerCase();

      // 5. Calculate time and attempts
      const timeTaken = Math.max(0, Math.floor((Date.now() - progress.startedAt.getTime()) / 1000));
      const attemptNumber = progress.attempts + 1;

      let pointsEarned = 0;
      let xpEarned = 0;

      // 6. Calculate points
      if (isCorrect) {
        const basePoints = lab.pointsReward || 100;
        const baseXP = lab.xpReward || 50;

        let timeBonus = 0;
        if (lab.timeLimit && timeTaken <= lab.timeLimit) {
          const timePercentage = (lab.timeLimit - timeTaken) / lab.timeLimit;
          timeBonus = Math.floor(basePoints * 0.3 * timePercentage);
        }

        const attemptPenalty = (attemptNumber - 1) * 10;
        
        pointsEarned = Math.max(10, basePoints + timeBonus - attemptPenalty);
        xpEarned = Math.max(5, baseXP + Math.floor(timeBonus * 0.5));
      }

      // 7. Record Submission
      const submission = await tx.labSubmission.create({
        data: {
          userId,
          labId,
          code,
          flagAnswer: providedFlag,
          isCorrect,
          timeTaken,
          attemptNumber,
          pointsEarned,
          xpEarned,
          submittedAt: new Date(),
        },
      });

      // 8. Update Progress
      await tx.userLabProgress.update({
        where: { userId_labId: { userId, labId } },
        data: {
          attempts: attemptNumber,
          flagSubmitted: true,
          completedAt: isCorrect ? new Date() : undefined,
          progress: isCorrect ? 100 : progress.progress,
          lastAccess: new Date(),
        },
      });

      // 9. Grant Rewards if correct
      if (isCorrect) {
        // Atomic Upsert for UserPoints
        const userPoints = await tx.userPoints.upsert({
          where: { userId },
          create: {
            userId,
            totalPoints: pointsEarned,
            totalXP: xpEarned,
            level: 1,
          },
          update: {
            totalPoints: { increment: pointsEarned },
            totalXP: { increment: xpEarned },
          },
        });

        // Recalculate level after atomic update
        const newLevel = Math.floor(userPoints.totalXP / 1000) + 1;
        if (userPoints.level !== newLevel) {
          await tx.userPoints.update({
            where: { userId },
            data: { level: newLevel },
          });
        }

        await tx.pointsHistory.create({
          data: {
            userId,
            points: pointsEarned,
            reason: `Completed lab: ${lab.title}`,
            ar_reason: `أكمل التجربة: ${lab.ar_title || lab.title}`,
          },
        });

        await tx.xPLog.create({
          data: {
            userId,
            source: 'LAB',
            amount: xpEarned,
            reason: `Completed lab: ${lab.title}`,
            ar_reason: `أكمل التجربة: ${lab.ar_title || lab.title}`,
            context: labId,
          },
        });

        await tx.userStats.upsert({
          where: { userId },
          create: {
            userId,
            completedLabs: 1,
            lastActivityDate: new Date(),
          },
          update: {
            completedLabs: { increment: 1 },
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
    });
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
    const safeLimit = Math.min(Number(limit), 50);
    const skip = (Math.max(Number(page), 1) - 1) * safeLimit;

    const [submissions, total] = await this.prisma.$transaction([
      this.prisma.labSubmission.findMany({
        where: { userId, labId },
        skip,
        take: safeLimit,
        orderBy: { submittedAt: 'desc' },
      }),
      this.prisma.labSubmission.count({
        where: { userId, labId },
      }),
    ]);

    const data = submissions.map((submission) =>
      plainToClass(SubmissionSerializer, submission, {
        excludeExtraneousValues: true,
      }),
    );

    return {
      data,
      meta: {
        total,
        page: Number(page),
        limit: safeLimit,
        totalPages: Math.ceil(total / safeLimit) || 1,
      },
    };
  }

  /**
   * Get all user submissions
   */
  async getUserSubmissions(userId: string, query: SubmissionQueryDto) {
    const { page = 1, limit = 10, labId, isCorrect } = query;
    const safeLimit = Math.min(Number(limit), 50);
    const skip = (Math.max(Number(page), 1) - 1) * safeLimit;

    const where: any = { userId };
    if (labId) where.labId = labId;
    if (isCorrect !== undefined) where.isCorrect = isCorrect;

    const [submissions, total] = await this.prisma.$transaction([
      this.prisma.labSubmission.findMany({
        where,
        skip,
        take: safeLimit,
        orderBy: { submittedAt: 'desc' },
      }),
      this.prisma.labSubmission.count({ where }),
    ]);

    const data = submissions.map((submission) =>
      plainToClass(SubmissionSerializer, submission, {
        excludeExtraneousValues: true,
      }),
    );

    return {
      data,
      meta: {
        total,
        page: Number(page),
        limit: safeLimit,
        totalPages: Math.ceil(total / safeLimit) || 1,
      },
    };
  }
}
