// src/modules/practice-labs/services/lab-catalog.service.ts
// Responsible for: read-only lab catalog operations
// Extracted from PracticeLabsService (God Service refactor — PR #1)

import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../core/database';
import { HintPenaltyService } from '../shared/services/hint-penalty.service';
import {
  getCategoryNameEn,
  getCategoryNameAr,
} from '../shared/constants/categories.constants';

@Injectable()
export class LabCatalogService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly hintPenalty: HintPenaltyService,
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
        environmentType: true,
        canonicalConceptId: true,
        duration: true,
        xpReward: true,
        pointsReward: true,
        skills: true,
        isPublished: true,
        createdAt: true,
        hints: {
          select: { id: true, order: true, xpCost: true, penaltyPercent: true },
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
    return { success: true, categories, totalLabs: labs.length };
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
    if (labId) {
      const p = await this.prisma.userLabProgress.findFirst({
        where: { userId, labId },
        select: {
          attempts: true,
          hintsUsed: true,
          flagSubmitted: true,
          startedAt: true,
          completedAt: true,
          lastAccess: true,
          progress: true,
        },
      });
      return {
        success: true,
        step: p?.flagSubmitted ? 'COMPLETED' : p ? 'RUNNING' : 'NOT_STARTED',
        attempts: p?.attempts ?? 0,
        hintsUsed: p?.hintsUsed ?? 0,
        flagSubmitted: p?.flagSubmitted ?? false,
        startedAt: p?.startedAt ?? null,
        completedAt: p?.completedAt ?? null,
        lastAccess: p?.lastAccess ?? null,
        progress: p?.progress ?? 0,
      };
    }

    const progressList = await this.prisma.userLabProgress.findMany({
      where: { userId },
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

    return { success: true, progress: progressList };
  }

  // ─────────────────────────────────────────────
  // GET /practice-labs/:labId
  // ─────────────────────────────────────────────
  async getLabById(labId: string, userId?: string) {
    const lab = await this.prisma.lab.findUnique({
      where: { id: labId, isPublished: true },
      include: {
        hints: {
          select: { id: true, order: true, xpCost: true, penaltyPercent: true },
          orderBy: { order: 'asc' },
        },
        courseLabs: {
          take: 1,
          include: {
            course: { select: { id: true, title: true, ar_title: true } },
          },
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

    const { courseLabs, ...labRest } = lab;
    const course = courseLabs[0]?.course ?? null;

    let hintSummary: { count: number; orders: number[] } | null = null;
    if (userId) {
      hintSummary = await this.hintPenalty.getHintSummary(userId, labId);
    }

    return { success: true, lab: { ...labRest, course }, hintSummary };
  }

  // ─────────────────────────────────────────────
  // GET /practice-labs/:labId/admin/solution
  // Admin-only — protected by AdminGuard in controller
  // ─────────────────────────────────────────────
  async getAdminSolution(labId: string) {
    const lab = await this.prisma.lab.findUnique({
      where: { id: labId },
      select: {
        id: true,
        slug: true,
        title: true,
        solution: true,
        postSolve: true,
        scenarioAdmin: true,
        briefing: true,
        stepsOverview: true,
      },
    });

    if (!lab) throw new NotFoundException('Lab not found');

    return { success: true, solution: lab };
  }

  // ─────────────────────────────────────────────
  // Private helpers
  // ─────────────────────────────────────────────
  private groupLabsByCategory(labs: any[]) {
    const grouped = labs.reduce(
      (acc, lab) => {
        const category: string = lab.category ?? 'FUNDAMENTALS';
        if (!acc[category]) {
          acc[category] = {
            id: category,
            name: getCategoryNameEn(category),
            ar_name: getCategoryNameAr(category),
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
}
