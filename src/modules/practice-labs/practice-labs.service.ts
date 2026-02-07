import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../core/database';
import { Difficulty } from '@prisma/client';

@Injectable()
export class PracticeLabsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get all labs organized by category
   */
  async getAllLabs(userId?: string) {
    const labs = await this.prisma.lab.findMany({
      where: { isPublished: true },
      include: {
        hints: {
          select: {
            id: true,
            order: true,
            xpCost: true,
            // Don't include content until user requests hint
          },
          orderBy: { order: 'asc' },
        },
        _count: {
          select: {
            submissions: true,
            usersProgress: true,
          },
        },
        // Include user progress if userId provided
        ...(userId && {
          usersProgress: {
            where: { userId },
            select: {
              progress: true,
              attempts: true,
              hintsUsed: true,
              completedAt: true,
              flagSubmitted: true,
            },
          },
        }),
      },
      orderBy: [{ difficulty: 'asc' }, { createdAt: 'asc' }],
    });

    // Group by category (extract from lab title or use tags)
    const categories = this.groupLabsByCategory(labs);

    return {
      success: true,
      categories,
      totalLabs: labs.length,
    };
  }

  /**
   * Get single lab details
   */
  async getLabById(labId: string, userId?: string) {
    const lab = await this.prisma.lab.findUnique({
      where: { id: labId, isPublished: true },
      include: {
        hints: {
          select: {
            id: true,
            order: true,
            xpCost: true,
          },
          orderBy: { order: 'asc' },
        },
        course: {
          select: {
            id: true,
            title: true,
            ar_title: true,
          },
        },
        ...(userId && {
          usersProgress: {
            where: { userId },
          },
          submissions: {
            where: { userId },
            orderBy: { submittedAt: 'desc' },
            take: 10,
          },
        }),
      },
    });

    if (!lab) {
      throw new NotFoundException('Lab not found');
    }

    return {
      success: true,
      lab,
    };
  }

  /**
   * Submit lab flag
   */
  async submitFlag(labId: string, userId: string, flagAnswer: string) {
    const lab = await this.prisma.lab.findUnique({
      where: { id: labId },
      include: {
        usersProgress: {
          where: { userId },
        },
      },
    });

    if (!lab) {
      throw new NotFoundException('Lab not found');
    }

    const isCorrect = lab.flagAnswer === flagAnswer.trim();

    // Get or create progress
    let progress = lab.usersProgress[0];
    if (!progress) {
      progress = await this.prisma.userLabProgress.create({
        data: {
          userId,
          labId,
          attempts: 1,
          startedAt: new Date(),
        },
      });
    } else {
      progress = await this.prisma.userLabProgress.update({
        where: { id: progress.id },
        data: {
          attempts: { increment: 1 },
          lastAccess: new Date(),
        },
      });
    }

    // Create submission record
    const submission = await this.prisma.labSubmission.create({
      data: {
        userId,
        labId,
        flagAnswer,
        isCorrect,
        attemptNumber: progress.attempts,
        pointsEarned: isCorrect ? lab.pointsReward : 0,
        xpEarned: isCorrect ? lab.xpReward : 0,
        timeTaken: Math.floor(
          (new Date().getTime() - progress.startedAt.getTime()) / 1000,
        ),
      },
    });

    // If correct, update progress and award points
    if (isCorrect) {
      await this.prisma.userLabProgress.update({
        where: { id: progress.id },
        data: {
          flagSubmitted: true,
          completedAt: new Date(),
          progress: 100,
        },
      });

      // Award XP and Points
      await this.awardXP(
        userId,
        lab.xpReward,
        'LAB',
        `Completed lab: ${lab.title}`,
      );
      await this.awardPoints(
        userId,
        lab.pointsReward,
        `Completed lab: ${lab.title}`,
      );
    }

    return {
      success: true,
      isCorrect,
      message: isCorrect
        ? '🎉 Congratulations! Flag is correct!'
        : '❌ Wrong flag. Try again!',
      submission,
    };
  }

  /**
   * Get hint for lab
   */
  async getHint(labId: string, userId: string, hintOrder: number) {
    const hint = await this.prisma.labHint.findFirst({
      where: {
        labId,
        order: hintOrder,
      },
    });

    if (!hint) {
      throw new NotFoundException('Hint not found');
    }

    // Check if user has enough XP
    const userPoints = await this.prisma.userPoints.findUnique({
      where: { userId },
    });

    if (!userPoints || userPoints.totalXP < hint.xpCost) {
      return {
        success: false,
        message: 'Not enough XP to unlock this hint',
        required: hint.xpCost,
        available: userPoints?.totalXP || 0,
      };
    }

    // Deduct XP and update progress
    await this.prisma.userPoints.update({
      where: { userId },
      data: {
        totalXP: { decrement: hint.xpCost },
      },
    });

    await this.prisma.userLabProgress.upsert({
      where: {
        userId_labId: { userId, labId },
      },
      update: {
        hintsUsed: { increment: 1 },
      },
      create: {
        userId,
        labId,
        hintsUsed: 1,
        startedAt: new Date(),
      },
    });

    return {
      success: true,
      hint: {
        content: hint.content,
        ar_content: hint.ar_content,
        xpCost: hint.xpCost,
      },
    };
  }

  /**
   * Get user lab progress
   */
  async getUserProgress(userId: string, labId?: string) {
    const where = labId ? { userId, labId } : { userId };

    const progress = await this.prisma.userLabProgress.findMany({
      where,
      include: {
        lab: {
          select: {
            id: true,
            title: true,
            ar_title: true,
            difficulty: true,
            xpReward: true,
            pointsReward: true,
          },
        },
      },
      orderBy: { lastAccess: 'desc' },
    });

    return {
      success: true,
      progress,
    };
  }

  /**
   * Get lab statistics
   */
  async getStats() {
    const [totalLabs, completedCount, avgAttempts] = await Promise.all([
      this.prisma.lab.count({ where: { isPublished: true } }),
      this.prisma.userLabProgress.count({
        where: { completedAt: { not: null } },
      }),
      this.prisma.userLabProgress.aggregate({
        _avg: { attempts: true },
      }),
    ]);

    const labsByDifficulty = await this.prisma.lab.groupBy({
      by: ['difficulty'],
      where: { isPublished: true },
      _count: true,
    });

    return {
      success: true,
      stats: {
        totalLabs,
        completedCount,
        avgAttempts: avgAttempts._avg.attempts || 0,
        byDifficulty: labsByDifficulty.reduce((acc, curr) => {
          acc[curr.difficulty.toLowerCase()] = curr._count;
          return acc;
        }, {}),
      },
    };
  }

  // ============ Helper Methods ============

  private groupLabsByCategory(labs: any[]) {
    // Extract category from lab title (e.g., "Command Injection - Lab 1")
    const grouped = labs.reduce((acc, lab) => {
      // Simple categorization based on title
      let category = 'miscellaneous';

      if (lab.title.toLowerCase().includes('command injection')) {
        category = 'command-injection';
      } else if (lab.title.toLowerCase().includes('sql injection')) {
        category = 'sql-injection';
      } else if (lab.title.toLowerCase().includes('xss')) {
        category = 'xss';
      }
      // Add more categories...

      if (!acc[category]) {
        acc[category] = {
          id: category,
          name: this.getCategoryName(category),
          ar_name: this.getCategoryNameAr(category),
          labs: [],
        };
      }

      acc[category].labs.push(lab);
      return acc;
    }, {});

    return Object.values(grouped);
  }

  private getCategoryName(category: string): string {
    const names = {
      'command-injection': 'Command Injection',
      'sql-injection': 'SQL Injection',
      xss: 'Cross-Site Scripting (XSS)',
      // Add more...
    };
    return names[category] || category;
  }

  private getCategoryNameAr(category: string): string {
    const names = {
      'command-injection': 'حقن الأوامر',
      'sql-injection': 'حقن SQL',
      xss: 'البرمجة النصية عبر المواقع',
      // Add more...
    };
    return names[category] || category;
  }

  private async awardXP(
    userId: string,
    amount: number,
    source: any,
    reason: string,
  ) {
    await this.prisma.$transaction([
      this.prisma.userPoints.upsert({
        where: { userId },
        update: { totalXP: { increment: amount } },
        create: { userId, totalXP: amount },
      }),
      this.prisma.xPLog.create({
        data: {
          userId,
          source,
          amount,
          reason,
        },
      }),
    ]);
  }

  private async awardPoints(userId: string, amount: number, reason: string) {
    await this.prisma.$transaction([
      this.prisma.userPoints.upsert({
        where: { userId },
        update: { totalPoints: { increment: amount } },
        create: { userId, totalPoints: amount },
      }),
      this.prisma.pointsLog.create({
        data: {
          userId,
          amount,
          reason,
        },
      }),
    ]);
  }
}
