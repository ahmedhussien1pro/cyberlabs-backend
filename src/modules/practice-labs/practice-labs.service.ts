import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../core/database';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

@Injectable()
export class PracticeLabsService {
  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {}

  // ─────────────────────────────────────────────
  // GET /practice-labs
  // ─────────────────────────────────────────────
  async getAllLabs(userId?: string) {
    const labs = await this.prisma.lab.findMany({
      where: { isPublished: true },
      select: {
        id: true,
        title: true,
        ar_title: true,
        description: true,
        ar_description: true,
        scenario: true,
        ar_scenario: true,
        difficulty: true,
        category: true,
        executionMode: true,
        duration: true,
        xpReward: true,
        pointsReward: true,
        skills: true,
        isPublished: true,
        createdAt: true,
        hints: {
          select: { id: true, order: true, xpCost: true },
          orderBy: { order: 'asc' },
        },
        _count: {
          select: { submissions: true, usersProgress: true },
        },
        ...(userId && {
          usersProgress: {
            where: { userId },
            select: {
              progress: true,
              attempts: true,
              hintsUsed: true,
              completedAt: true,
              flagSubmitted: true,
              startedAt: true,
              lastAccess: true,
            },
          },
        }),
      },
      orderBy: [{ difficulty: 'asc' }, { createdAt: 'asc' }],
    });

    const categories = this.groupLabsByCategory(labs);

    return {
      success: true,
      categories,
      totalLabs: labs.length,
    };
  }

  // ─────────────────────────────────────────────
  // GET /practice-labs/stats
  // ─────────────────────────────────────────────
  async getStats() {
    const [totalLabs, completedCount, avgAttempts] = await Promise.all([
      this.prisma.lab.count({ where: { isPublished: true } }),
      this.prisma.userLabProgress.count({
        where: { completedAt: { not: null } },
      }),
      this.prisma.userLabProgress.aggregate({ _avg: { attempts: true } }),
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
        avgAttempts: avgAttempts._avg.attempts ?? 0,
        byDifficulty: labsByDifficulty.reduce(
          (acc, curr) => {
            acc[curr.difficulty.toLowerCase()] = curr._count;
            return acc;
          },
          {} as Record<string, number>,
        ),
      },
    };
  }

  // ─────────────────────────────────────────────
  // GET /practice-labs/progress
  // ─────────────────────────────────────────────
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
            category: true,
            xpReward: true,
            pointsReward: true,
          },
        },
      },
      orderBy: { lastAccess: 'desc' },
    });

    return { success: true, progress };
  }

  // ─────────────────────────────────────────────
  // GET /practice-labs/:labId
  // ─────────────────────────────────────────────
  async getLabById(labId: string, userId?: string) {
    const lab = await this.prisma.lab.findUnique({
      where: { id: labId, isPublished: true },
      include: {
        hints: {
          select: { id: true, order: true, xpCost: true },
          orderBy: { order: 'asc' },
        },
        course: {
          select: { id: true, title: true, ar_title: true },
        },
        ...(userId && {
          usersProgress: {
            where: { userId },
            select: {
              progress: true,
              attempts: true,
              hintsUsed: true,
              flagSubmitted: true,
              completedAt: true,
              startedAt: true,
              lastAccess: true,
            },
          },
          submissions: {
            where: { userId },
            orderBy: { submittedAt: 'desc' },
            take: 10,
            select: {
              id: true,
              isCorrect: true,
              attemptNumber: true,
              pointsEarned: true,
              xpEarned: true,
              submittedAt: true,
            },
          },
        }),
      },
    });

    if (!lab) throw new NotFoundException('Lab not found');

    return { success: true, lab };
  }

  // ─────────────────────────────────────────────
  // POST /practice-labs/:labId/launch
  // ─────────────────────────────────────────────
  async launchLab(labId: string, userId: string) {
    const lab = await this.prisma.lab.findUnique({
      where: { id: labId, isPublished: true },
    });

    if (!lab) throw new NotFoundException('Lab not found');

    await this.prisma.labLaunchToken.updateMany({
      where: {
        userId,
        labId,
        usedAt: null,
      },
      data: {
        expiresAt: new Date(0),
      },
    });

    // 2. Upsert LabInstance
    const instance = await this.prisma.labInstance.upsert({
      where: { userId_labId: { userId, labId } },
      update: { isActive: true, startedAt: new Date() },
      create: { userId, labId, isActive: true },
    });

    // 3. Upsert UserLabProgress
    await this.prisma.userLabProgress.upsert({
      where: { userId_labId: { userId, labId } },
      update: { lastAccess: new Date() },
      create: {
        userId,
        labId,
        attempts: 0,
        startedAt: new Date(),
        lastAccess: new Date(),
      },
    });

    // 4. New Token after 10M
    const tokenStr = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await this.prisma.labLaunchToken.create({
      data: {
        token: tokenStr,
        userId,
        labId,
        instanceId: instance.id,
        expiresAt,
      },
    });

    const labsSubdomain =
      this.configService.get<string>('LABS_URL') ??
      'https://cyberlabs-frontend-labs-wszx.vercel.app';

    return {
      success: true,
      launchUrl: `${labsSubdomain}/launch/${tokenStr}`,
      instanceId: instance.id,
      executionMode: lab.executionMode,
    };
  }

  // ─────────────────────────────────────────────
  // POST /practice-labs/launch/consume
  // ─────────────────────────────────────────────
  async consumeToken(token: string, userId: string) {
    const launchToken = await this.prisma.labLaunchToken.findFirst({
      where: {
        token,
        usedAt: null,
        expiresAt: { gt: new Date() },
        userId,
      },
      include: {
        lab: {
          select: {
            id: true,
            title: true,
            ar_title: true,
            description: true,
            ar_description: true,
            scenario: true,
            ar_scenario: true,
            executionMode: true,
            engineConfig: true,
            initialState: true,
            difficulty: true,
            category: true,
            skills: true,
            xpReward: true,
            pointsReward: true,
            duration: true,
          },
        },
      },
    });

    if (!launchToken) {
      throw new BadRequestException('Token invalid, expired, or already used');
    }

    // Atomic burn
    await this.prisma.labLaunchToken.update({
      where: { id: launchToken.id },
      data: { usedAt: new Date() },
    });

    return {
      success: true,
      labId: launchToken.labId,
      instanceId: launchToken.instanceId,
      lab: launchToken.lab,
    };
  }

  // ─────────────────────────────────────────────
  // POST /practice-labs/:labId/submit
  //
  // ✅ Points & Badges logic:
  // ─────────────────────────────────────────────
  async submitFlag(labId: string, userId: string, flagAnswer: string) {
    const lab = await this.prisma.lab.findUnique({
      where: { id: labId },
      include: { usersProgress: { where: { userId } } },
    });

    if (!lab) throw new NotFoundException('Lab not found');

    const isCorrect = lab.flagAnswer?.trim() === flagAnswer.trim();

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
    } else {
      progress = await this.prisma.userLabProgress.update({
        where: { id: progress.id },
        data: {
          attempts: { increment: 1 },
          lastAccess: new Date(),
        },
      });
    }

    const isFirstSolve = isCorrect && !progress.flagSubmitted;

    const submission = await this.prisma.labSubmission.create({
      data: {
        userId,
        labId,
        flagAnswer,
        isCorrect,
        attemptNumber: progress.attempts,
        pointsEarned: isFirstSolve ? lab.pointsReward : 0,
        xpEarned: isFirstSolve ? lab.xpReward : 0,
        timeTaken: Math.floor(
          (Date.now() - progress.startedAt.getTime()) / 1000,
        ),
      },
    });

    if (isFirstSolve) {
      await this.prisma.userLabProgress.update({
        where: { id: progress.id },
        data: {
          flagSubmitted: true,
          completedAt: new Date(),
          progress: 100,
        },
      });

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
      isFirstSolve,
      isCompleted: isCorrect,
      totalAttempts: progress.attempts,
      message: isCorrect
        ? isFirstSolve
          ? '🎉 Congratulations! Lab completed!'
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
  // POST /practice-labs/:labId/hint
  // ─────────────────────────────────────────────
  async getHint(labId: string, userId: string, hintOrder: number) {
    const hint = await this.prisma.labHint.findFirst({
      where: { labId, order: hintOrder },
    });

    if (!hint) throw new NotFoundException('Hint not found');

    const userPoints = await this.prisma.userPoints.findUnique({
      where: { userId },
    });

    if (!userPoints || userPoints.totalXP < hint.xpCost) {
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

    return {
      success: true,
      hint: {
        content: hint.content,
        ar_content: hint.ar_content,
        xpCost: hint.xpCost,
      },
    };
  }

  // ─────────────────────────────────────────────
  // Helpers
  // ─────────────────────────────────────────────
  private groupLabsByCategory(labs: any[]) {
    const grouped = labs.reduce(
      (acc, lab) => {
        const category: string = lab.category ?? 'FUNDAMENTALS';
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
      },
      {} as Record<string, any>,
    );
    return Object.values(grouped);
  }

  private getCategoryName(category: string): string {
    const names: Record<string, string> = {
      WEB_SECURITY: 'Web Security',
      PENETRATION_TESTING: 'Penetration Testing',
      MALWARE_ANALYSIS: 'Malware Analysis',
      CLOUD_SECURITY: 'Cloud Security',
      FUNDAMENTALS: 'Fundamentals',
      CRYPTOGRAPHY: 'Cryptography',
      NETWORK_SECURITY: 'Network Security',
      TOOLS_AND_TECHNIQUES: 'Tools & Techniques',
      CAREER_AND_INDUSTRY: 'Career & Industry',
    };
    return names[category] ?? category;
  }

  private getCategoryNameAr(category: string): string {
    const names: Record<string, string> = {
      WEB_SECURITY: 'أمن الويب',
      PENETRATION_TESTING: 'اختبار الاختراق',
      MALWARE_ANALYSIS: 'تحليل البرمجيات الخبيثة',
      CLOUD_SECURITY: 'أمن السحابة',
      FUNDAMENTALS: 'الأساسيات',
      CRYPTOGRAPHY: 'التشفير',
      NETWORK_SECURITY: 'أمن الشبكات',
      TOOLS_AND_TECHNIQUES: 'الأدوات والتقنيات',
      CAREER_AND_INDUSTRY: 'المسار المهني',
    };
    return names[category] ?? category;
  }

  private async awardXP(
    userId: string,
    amount: number,
    source: any,
    reason: string,
  ) {
    if (amount <= 0) return;
    await this.prisma.$transaction([
      this.prisma.userPoints.upsert({
        where: { userId },
        update: { totalXP: { increment: amount } },
        create: { userId, totalXP: amount },
      }),
      this.prisma.xPLog.create({
        data: { userId, source, amount, reason },
      }),
    ]);
  }

  private async awardPoints(userId: string, amount: number, reason: string) {
    if (amount <= 0) return;
    await this.prisma.$transaction([
      this.prisma.userPoints.upsert({
        where: { userId },
        update: { totalPoints: { increment: amount } },
        create: { userId, totalPoints: amount },
      }),
      this.prisma.pointsLog.create({
        data: { userId, amount, reason },
      }),
    ]);
  }
}
