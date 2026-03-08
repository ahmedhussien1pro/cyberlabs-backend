import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { Difficulty } from '@prisma/client';
import { PrismaService } from '../../core/database';
import { AdminLabQueryDto } from './dto/admin-lab-query.dto';
import { CreateLabDto } from './dto/create-lab.dto';
import { UpdateLabDto } from './dto/update-lab.dto';

/**
 * Admin list select — deliberately excludes flagAnswer and solution.
 * These sensitive fields are only returned in the admin detail endpoint.
 */
const LAB_LIST_SELECT = {
  id: true,
  slug: true,
  title: true,
  ar_title: true,
  description: true,
  imageUrl: true,
  difficulty: true,
  category: true,
  executionMode: true,
  isPublished: true,
  duration: true,
  xpReward: true,
  pointsReward: true,
  skills: true,
  courseId: true,
  createdAt: true,
  updatedAt: true,
  _count: {
    select: {
      submissions: true,
      usersProgress: true,
      hints: true,
    },
  },
} as const;

@Injectable()
export class AdminLabsService {
  constructor(private readonly prisma: PrismaService) {}

  // ────────────────────────────────────────────────────────────────────────
  // GET /admin/labs  — ALL labs, no isPublished filter
  // ────────────────────────────────────────────────────────────────────────
  async findAll(query: AdminLabQueryDto) {
    const {
      page = 1,
      limit = 20,
      search,
      difficulty,
      category,
      executionMode,
      isPublished,
    } = query;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { ar_title: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (difficulty) where.difficulty = difficulty;
    if (category) where.category = category;
    if (executionMode) where.executionMode = executionMode;
    if (isPublished !== undefined) where.isPublished = isPublished;

    const [labs, total] = await this.prisma.$transaction([
      this.prisma.lab.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: LAB_LIST_SELECT,
      }),
      this.prisma.lab.count({ where }),
    ]);

    return {
      data: labs,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  // ────────────────────────────────────────────────────────────────────────
  // GET /admin/labs/stats
  // Individual count() calls per difficulty — avoids Prisma groupBy type issue
  // ────────────────────────────────────────────────────────────────────────
  async getStats() {
    const [
      total,
      published,
      unpublished,
      totalCompletions,
      totalSubmissions,
      beginner,
      intermediate,
      advanced,
    ] = await this.prisma.$transaction([
      this.prisma.lab.count(),
      this.prisma.lab.count({ where: { isPublished: true } }),
      this.prisma.lab.count({ where: { isPublished: false } }),
      this.prisma.userLabProgress.count({ where: { completedAt: { not: null } } }),
      this.prisma.labSubmission.count(),
      this.prisma.lab.count({ where: { difficulty: Difficulty.BEGINNER } }),
      this.prisma.lab.count({ where: { difficulty: Difficulty.INTERMEDIATE } }),
      this.prisma.lab.count({ where: { difficulty: Difficulty.ADVANCED } }),
    ]);

    return {
      total,
      published,
      unpublished,
      totalCompletions,
      totalSubmissions,
      byDifficulty: {
        [Difficulty.BEGINNER]: beginner,
        [Difficulty.INTERMEDIATE]: intermediate,
        [Difficulty.ADVANCED]: advanced,
      },
    };
  }

  // ────────────────────────────────────────────────────────────────────────
  // GET /admin/labs/:id  — full detail INCLUDING flagAnswer + solution
  //
  // SECURITY: This endpoint is protected by AdminGuard.
  // flagAnswer and solution are INTENTIONALLY included here for admin editing.
  // They are NEVER returned by the user-facing practice-labs endpoints.
  // ────────────────────────────────────────────────────────────────────────
  async findOne(id: string) {
    const lab = await this.prisma.lab.findUnique({
      where: { id },
      include: {
        hints: {
          orderBy: { order: 'asc' },
          select: {
            id: true,
            order: true,
            content: true,
            ar_content: true,
            xpCost: true,
          },
        },
        courseLabs: {
          select: {
            course: { select: { id: true, title: true, slug: true } },
          },
        },
        _count: {
          select: {
            submissions: true,
            usersProgress: true,
            instances: true,
          },
        },
      },
    });

    if (!lab) throw new NotFoundException(`Lab with id "${id}" not found`);
    return lab;
  }

  // ────────────────────────────────────────────────────────────────────────
  // POST /admin/labs  — create new lab
  // ────────────────────────────────────────────────────────────────────────
  async create(dto: CreateLabDto) {
    const existing = await this.prisma.lab.findUnique({
      where: { slug: dto.slug },
      select: { id: true },
    });
    if (existing) {
      throw new ConflictException(`Slug "${dto.slug}" is already in use`);
    }

    const {
      title,
      slug,
      ar_title,
      description,
      ar_description,
      scenario,
      ar_scenario,
      goal,
      ar_goal,
      difficulty,
      category,
      executionMode,
      xpReward,
      pointsReward,
      pointsPerHint,
      pointsPerFail,
      duration,
      maxAttempts,
      timeLimit,
      imageUrl,
      labUrl,
      courseId,
      isolationMode,
      skills,
      engineConfig,
      briefing,
      stepsOverview,
      steps,
      postSolve,
      initialState,
      flagAnswer,
      solution,
      isPublished,
    } = dto;

    return this.prisma.lab.create({
      data: {
        title,
        slug,
        ar_title,
        description,
        ar_description,
        scenario,
        ar_scenario,
        goal,
        ar_goal,
        difficulty,
        category,
        executionMode,
        xpReward,
        pointsReward,
        pointsPerHint,
        pointsPerFail,
        duration,
        maxAttempts,
        timeLimit,
        imageUrl,
        labUrl,
        courseId,
        isolationMode: isolationMode ?? 'database',
        skills: skills ?? [],
        // Cast JSON fields to 'any' to satisfy Prisma InputJsonValue union type
        engineConfig: (engineConfig ?? undefined) as any,
        briefing: (briefing ?? undefined) as any,
        stepsOverview: (stepsOverview ?? undefined) as any,
        steps: (steps ?? undefined) as any,
        postSolve: (postSolve ?? undefined) as any,
        initialState: (initialState ?? {}) as any,
        flagAnswer,
        solution: (solution ?? undefined) as any,
        isPublished: isPublished ?? false,
      },
      select: LAB_LIST_SELECT,
    });
  }

  // ────────────────────────────────────────────────────────────────────────
  // PATCH /admin/labs/:id  — update lab fields
  // ────────────────────────────────────────────────────────────────────────
  async update(id: string, dto: UpdateLabDto) {
    await this.assertExists(id);

    if (dto.slug) {
      const conflict = await this.prisma.lab.findFirst({
        where: { slug: dto.slug, NOT: { id } },
        select: { id: true },
      });
      if (conflict) {
        throw new ConflictException(`Slug "${dto.slug}" is already in use`);
      }
    }

    return this.prisma.lab.update({
      where: { id },
      data: dto as any,
      select: LAB_LIST_SELECT,
    });
  }

  // ────────────────────────────────────────────────────────────────────────
  // PATCH /admin/labs/:id/publish
  // ────────────────────────────────────────────────────────────────────────
  async publish(id: string) {
    const lab = await this.assertExists(id);

    if (lab.isPublished) {
      throw new BadRequestException('Lab is already published');
    }

    return this.prisma.lab.update({
      where: { id },
      data: { isPublished: true },
      select: { id: true, slug: true, title: true, isPublished: true },
    });
  }

  // ────────────────────────────────────────────────────────────────────────
  // PATCH /admin/labs/:id/unpublish
  // ────────────────────────────────────────────────────────────────────────
  async unpublish(id: string) {
    const lab = await this.assertExists(id);

    if (!lab.isPublished) {
      throw new BadRequestException('Lab is already unpublished');
    }

    return this.prisma.lab.update({
      where: { id },
      data: { isPublished: false },
      select: { id: true, slug: true, title: true, isPublished: true },
    });
  }

  // ────────────────────────────────────────────────────────────────────────
  // DELETE /admin/labs/:id
  // Blocks deletion if active progress records exist (users who started the lab)
  // ────────────────────────────────────────────────────────────────────────
  async remove(id: string) {
    await this.assertExists(id);

    const progressCount = await this.prisma.userLabProgress.count({
      where: { labId: id },
    });

    if (progressCount > 0) {
      throw new BadRequestException(
        `Cannot delete lab with ${progressCount} user progress record(s). Unpublish it instead.`,
      );
    }

    await this.prisma.lab.delete({ where: { id } });
    return { success: true, message: 'Lab deleted successfully' };
  }

  // ────────────────────────────────────────────────────────────────────────
  // Private helpers
  // ────────────────────────────────────────────────────────────────────────
  private async assertExists(id: string) {
    const lab = await this.prisma.lab.findUnique({
      where: { id },
      select: { id: true, title: true, isPublished: true },
    });
    if (!lab) throw new NotFoundException(`Lab with id "${id}" not found`);
    return lab;
  }
}
