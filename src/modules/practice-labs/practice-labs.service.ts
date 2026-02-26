<<<<<<< HEAD
import {
  Injectable,
  NotFoundException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { PrismaService } from '../../core/database';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class PracticeLabsService {
  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {}

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
   * Launch Lab
   * Creates or retrieves a LabInstance and generates a short-lived launch token
   */
  async launchLab(labId: string, userId: string) {
    // 1. Verify lab exists
    const lab = await this.prisma.lab.findUnique({
      where: { id: labId, isPublished: true },
    });

    if (!lab) {
      throw new NotFoundException('Lab not found');
    }

    // 2. Create or update LabInstance for this user
    const instance = await this.prisma.labInstance.upsert({
      where: {
        userId_labId: { userId, labId },
      },
      update: {
        isActive: true,
        startedAt: new Date(), // Assuming we might add lastAccess to LabInstance later, or just update startedAt. Wait, let's just update isActive
      },
      create: {
        userId,
        labId,
        isActive: true,
      },
    });

    // Also initialize UserLabProgress if it doesn't exist
    await this.prisma.userLabProgress.upsert({
      where: {
        userId_labId: { userId, labId },
      },
      update: {
        lastAccess: new Date(),
      },
      create: {
        userId,
        labId,
        attempts: 0,
        startedAt: new Date(),
      },
    });

    // 3. Generate a short-lived launch token (valid for 1 minute)
    // We use standard jsonwebtoken here to create a specific launch token signed with the JWT_SECRET
    const jwtSecret =
      this.configService.get<string>('JWT_SECRET') ||
      'default-secret-change-me';
    const labsSubdomain =
      this.configService.get<string>('LABS_URL') || 'https://labs.cyberlabs.io';

    const launchToken = jwt.sign(
      {
        sub: userId,
        labId: lab.id,
        instanceId: instance.id,
        type: 'lab_launch',
      },
      jwtSecret,
      { expiresIn: '1m' },
    );

    // 4. Return the launch URL
    const launchUrl = `${labsSubdomain}/launch?token=${launchToken}`;

    return {
      success: true,
      launchUrl,
      instanceId: instance.id,
      executionMode: lab.executionMode,
    };
  }

  /**
   * Submit flag
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
=======
import { Injectable, NotFoundException, HttpException, HttpStatus } from '@nestjs/common';\nimport { PrismaService } from '../../core/database';\nimport { ConfigService } from '@nestjs/config';\nimport * as crypto from 'crypto';\n\n@Injectable()\nexport class PracticeLabsService {\n  constructor(\n    private prisma: PrismaService,\n    private configService: ConfigService,\n  ) {}\n\n  /**\n   * Get all labs organized by category\n   */\n  async getAllLabs(userId?: string) {\n    const labs = await this.prisma.lab.findMany({\n      where: { isPublished: true },\n      include: {\n        hints: {\n          select: {\n            id: true,\n            order: true,\n            xpCost: true,\n            // Don't include content until user requests hint\n          },\n          orderBy: { order: 'asc' },\n        },\n        _count: {\n          select: {\n            submissions: true,\n            usersProgress: true,\n          },\n        },\n        // Include user progress if userId provided\n        ...(userId && {\n          usersProgress: {\n            where: { userId },\n            select: {\n              progress: true,\n              attempts: true,\n              hintsUsed: true,\n              completedAt: true,\n              flagSubmitted: true,\n            },\n          },\n        }),\n      },\n      orderBy: [{ difficulty: 'asc' }, { createdAt: 'asc' }],\n    });\n\n    // Group by category (extract from lab title or use tags)\n    const categories = this.groupLabsByCategory(labs);\n\n    return {\n      success: true,\n      categories,\n      totalLabs: labs.length,\n    };\n  }\n\n  /**\n   * Get single lab details\n   */\n  async getLabById(labId: string, userId?: string) {\n    const lab = await this.prisma.lab.findUnique({\n      where: { id: labId, isPublished: true },\n      include: {\n        hints: {\n          select: {\n            id: true,\n            order: true,\n            xpCost: true,\n          },\n          orderBy: { order: 'asc' },\n        },\n        course: {\n          select: {\n            id: true,\n            title: true,\n            ar_title: true,\n          },\n        },\n        ...(userId && {\n          usersProgress: {\n            where: { userId },\n          },\n          submissions: {\n            where: { userId },\n            orderBy: { submittedAt: 'desc' },\n            take: 10,\n          },\n        }),\n      },\n    });\n\n    if (!lab) {\n      throw new NotFoundException('Lab not found');\n    }\n\n    return {\n      success: true,\n      lab,\n    };\n  }\n\n  /**\n   * Launch Lab\n   * Creates or retrieves a LabInstance and generates a short-lived secure opaque launch token\n   */\n  async launchLab(labId: string, userId: string) {\n    // 1. Verify lab exists\n    const lab = await this.prisma.lab.findUnique({\n      where: { id: labId, isPublished: true },\n    });\n\n    if (!lab) {\n      throw new NotFoundException('Lab not found');\n    }\n\n    // 2. Create or update LabInstance for this user\n    const instance = await this.prisma.labInstance.upsert({\n      where: {\n        userId_labId: { userId, labId },\n      },\n      update: {\n        isActive: true,\n        startedAt: new Date(),\n      },\n      create: {\n        userId,\n        labId,\n        isActive: true,\n      },\n    });\n\n    // Also initialize UserLabProgress if it doesn't exist\n    await this.prisma.userLabProgress.upsert({\n      where: {\n        userId_labId: { userId, labId },\n      },\n      update: {\n        lastAccess: new Date(),\n      },\n      create: {\n        userId,\n        labId,\n        attempts: 0,\n        startedAt: new Date(),\n        lastAccess: new Date(),\n      },\n    });\n\n    // 3. Generate a short-lived opaque launch token (valid for 2 minutes)\n    const tokenStr = crypto.randomBytes(32).toString('hex');\n    const expiresAt = new Date(Date.now() + 2 * 60 * 1000);\n\n    await this.prisma.labLaunchToken.create({\n      data: {\n        token: tokenStr,\n        userId,\n        labId,\n        instanceId: instance.id,\n        expiresAt,\n      }\n    });\n\n    // 4. Return the launch URL\n    const labsSubdomain = this.configService.get<string>('LABS_URL') || 'https://labs.cyberlabs.io';\n    const launchUrl = `${labsSubdomain}/launch/${tokenStr}`;\n\n    return {\n      success: true,\n      launchUrl,\n      instanceId: instance.id,\n      executionMode: lab.executionMode,\n    };\n  }\n\n\n  /**\n   * Submit flag\n   */\n  async submitFlag(labId: string, userId: string, flagAnswer: string) {\n    const lab = await this.prisma.lab.findUnique({\n      where: { id: labId },\n      include: {\n        usersProgress: {\n          where: { userId },\n        },\n      },\n    });\n\n    if (!lab) {\n      throw new NotFoundException('Lab not found');\n    }\n\n    const isCorrect = lab.flagAnswer === flagAnswer.trim();\n\n    // Get or create progress\n    let progress = lab.usersProgress[0];\n    if (!progress) {\n      progress = await this.prisma.userLabProgress.create({\n        data: {\n          userId,\n          labId,\n          attempts: 1,\n          startedAt: new Date(),\n          lastAccess: new Date(),\n        },\n      });\n    } else {\n      progress = await this.prisma.userLabProgress.update({\n        where: { id: progress.id },\n        data: {\n          attempts: { increment: 1 },\n          lastAccess: new Date(),\n        },\n      });\n    }\n\n    // Create submission record\n    const submission = await this.prisma.labSubmission.create({\n      data: {\n        userId,\n        labId,\n        flagAnswer,\n        isCorrect,\n        attemptNumber: progress.attempts,\n        pointsEarned: isCorrect ? lab.pointsReward : 0,\n        xpEarned: isCorrect ? lab.xpReward : 0,\n        timeTaken: Math.floor(\n          (new Date().getTime() - progress.startedAt.getTime()) / 1000,\n        ),\n      },\n    });\n\n    // If correct, update progress and award points\n    if (isCorrect) {\n      await this.prisma.userLabProgress.update({\n        where: { id: progress.id },\n        data: {\n          flagSubmitted: true,\n          completedAt: new Date(),\n          progress: 100,\n        },\n      });\n\n      // Award XP and Points\n      await this.awardXP(\n        userId,\n        lab.xpReward,\n        'LAB',\n        `Completed lab: ${lab.title}`,\n      );\n      await this.awardPoints(\n        userId,\n        lab.pointsReward,\n        `Completed lab: ${lab.title}`,\n      );\n    }\n\n    return {\n      success: true,\n      isCorrect,\n      message: isCorrect\n        ? '🎉 Congratulations! Flag is correct!'\n        : '❌ Wrong flag. Try again!',\n      submission,\n    };\n  }\n\n  /**\n   * Get hint for lab\n   */\n  async getHint(labId: string, userId: string, hintOrder: number) {\n    const hint = await this.prisma.labHint.findFirst({\n      where: {\n        labId,\n        order: hintOrder,\n      },\n    });\n\n    if (!hint) {\n      throw new NotFoundException('Hint not found');\n    }\n\n    // Check if user has enough XP\n    const userPoints = await this.prisma.userPoints.findUnique({\n      where: { userId },\n    });\n\n    if (!userPoints || userPoints.totalXP < hint.xpCost) {\n      return {\n        success: false,\n        message: 'Not enough XP to unlock this hint',\n        required: hint.xpCost,\n        available: userPoints?.totalXP || 0,\n      };\n    }\n\n    // Deduct XP and update progress\n    await this.prisma.userPoints.update({\n      where: { userId },\n      data: {\n        totalXP: { decrement: hint.xpCost },\n      },\n    });\n\n    await this.prisma.userLabProgress.upsert({\n      where: {\n        userId_labId: { userId, labId },\n      },\n      update: {\n        hintsUsed: { increment: 1 },\n      },\n      create: {\n        userId,\n        labId,\n        hintsUsed: 1,\n        startedAt: new Date(),\n        lastAccess: new Date(),\n      },\n    });\n\n    return {\n      success: true,\n      hint: {\n        content: hint.content,\n        ar_content: hint.ar_content,\n        xpCost: hint.xpCost,\n      },\n    };\n  }\n\n  /**\n   * Get user lab progress\n   */\n  async getUserProgress(userId: string, labId?: string) {\n    const where = labId ? { userId, labId } : { userId };\n\n    const progress = await this.prisma.userLabProgress.findMany({\n      where,\n      include: {\n        lab: {\n          select: {\n            id: true,\n            title: true,\n            ar_title: true,\n            difficulty: true,\n            xpReward: true,\n            pointsReward: true,\n          },\n        },\n      },\n      orderBy: { lastAccess: 'desc' },\n    });\n\n    return {\n      success: true,\n      progress,\n    };\n  }\n\n  /**\n   * Get lab statistics\n   */\n  async getStats() {\n    const [totalLabs, completedCount, avgAttempts] = await Promise.all([\n      this.prisma.lab.count({ where: { isPublished: true } }),\n      this.prisma.userLabProgress.count({\n        where: { completedAt: { not: null } },\n      }),\n      this.prisma.userLabProgress.aggregate({\n        _avg: { attempts: true },\n      }),\n    ]);\n\n    const labsByDifficulty = await this.prisma.lab.groupBy({\n      by: ['difficulty'],\n      where: { isPublished: true },\n      _count: true,\n    });\n\n    return {\n      success: true,\n      stats: {\n        totalLabs,\n        completedCount,\n        avgAttempts: avgAttempts._avg.attempts || 0,\n        byDifficulty: labsByDifficulty.reduce((acc, curr) => {\n          acc[curr.difficulty.toLowerCase()] = curr._count;\n          return acc;\n        }, {}),\n      },\n    });\n  }\n\n  // ============ Helper Methods ============\n\n  private groupLabsByCategory(labs: any[]) {\n    // Extract category from lab title (e.g., \"Command Injection - Lab 1\")\n    const grouped = labs.reduce((acc, lab) => {\n      // Simple categorization based on title\n      let category = 'miscellaneous';\n\n      if (lab.title.toLowerCase().includes('command injection')) {\n        category = 'command-injection';\n      } else if (lab.title.toLowerCase().includes('sql injection')) {\n        category = 'sql-injection';\n      } else if (lab.title.toLowerCase().includes('xss')) {\n        category = 'xss';\n      }\n      // Add more categories...\n\n      if (!acc[category]) {\n        acc[category] = {\n          id: category,\n          name: this.getCategoryName(category),\n          ar_name: this.getCategoryNameAr(category),\n          labs: [],\n        };\n      }\n\n      acc[category].labs.push(lab);\n      return acc;\n    }, {});\n\n    return Object.values(grouped);\n  }\n\n  private getCategoryName(category: string): string {\n    const names = {\n      'command-injection': 'Command Injection',\n      'sql-injection': 'SQL Injection',\n      xss: 'Cross-Site Scripting (XSS)',\n      // Add more...\n    };\n    return names[category] || category;\n  }\n\n  private getCategoryNameAr(category: string): string {\n    const names = {\n      'command-injection': 'حقن الأوامر',\n      'sql-injection': 'حقن SQL',\n      xss: 'البرمجة النصية عبر المواقع',\n      // Add more...\n    };\n    return names[category] || category;\n  }\n\n  private async awardXP(\n    userId: string,\n    amount: number,\n    source: any,\n    reason: string,\n  ) {\n    await this.prisma.$transaction([\n      this.prisma.userPoints.upsert({\n        where: { userId },\n        update: { totalXP: { increment: amount } },\n        create: { userId, totalXP: amount },\n      }),\n      this.prisma.xPLog.create({\n        data: {\n          userId,\n          source,\n          amount,\n          reason,\n        },\n      }),\n    ]);\n  }\n\n  private async awardPoints(userId: string, amount: number, reason: string) {\n    await this.prisma.$transaction([\n      this.prisma.userPoints.upsert({\n        where: { userId },\n        update: { totalPoints: { increment: amount } },\n        create: { userId, totalPoints: amount },\n      }),\n      this.prisma.pointsLog.create({\n        data: {\n          userId,\n          amount,\n          reason,\n        },\n      }),\n    ]);\n  }\n}\n
>>>>>>> 50a6592468356947c3b246ab16f2cc58533e38b8
