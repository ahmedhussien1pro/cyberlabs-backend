// src/modules/paths/paths.service.ts
import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../core/database';
import { Prisma } from '@prisma/client';
import { NotificationsService } from '../notifications/services/notifications.service';
import { NotificationEvents } from '../notifications/notifications.events';
import { CertificatesService } from '../certificates/certificates.service';
import { courseCardSelect } from '../../common/selects/course-card.select';
import { toCourseCard } from '../../common/transformers/course-card.transformer';

@Injectable()
export class PathsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    private readonly certificates: CertificatesService,
  ) {}

  // ── List Paths ────────────────────────────────────────────────────────
  async listPaths(
    userId: string | null,
    filters: {
      page?: number;
      limit?: number;
      difficulty?: string;
      search?: string;
    },
  ) {
    const { page = 1, limit = 10, difficulty, search } = filters;
    const safeLimit = Math.min(Number(limit), 50);
    const skip = (Math.max(Number(page), 1) - 1) * safeLimit;

    const where: Prisma.LearningPathWhereInput = { isPublished: true };

    if (difficulty && difficulty.toLowerCase() !== 'all')
      where.difficulty = difficulty.toUpperCase() as any;

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { ar_title: { contains: search, mode: 'insensitive' } },
        { tags: { has: search } },
      ];
    }

    const [total, paths] = await this.prisma.$transaction([
      this.prisma.learningPath.count({ where }),
      this.prisma.learningPath.findMany({
        where,
        skip,
        take: safeLimit,
        orderBy: { order: 'asc' },
        include: {
          _count: { select: { modules: true } },
          ...(userId
            ? {
                enrollments: {
                  where: { userId },
                  select: { progress: true, isCompleted: true },
                },
              }
            : {}),
        },
      }),
    ]);

    const formattedPaths = paths.map((path) => {
      const isEnrolled = userId && (path as any).enrollments?.length > 0;
      const progress = isEnrolled ? (path as any).enrollments[0].progress : 0;
      const { enrollments, ...rest } = path as any;
      return { ...rest, isEnrolled: !!isEnrolled, progress };
    });

    return {
      data: formattedPaths,
      meta: {
        total,
        page: Number(page),
        limit: safeLimit,
        totalPages: Math.ceil(total / safeLimit) || 1,
      },
    };
  }

  // ── GET /paths/me — user's enrolled paths ─────────────────────────────
  async getMyPaths(userId: string) {
    const enrollments = await this.prisma.pathEnrollment.findMany({
      where: { userId },
      orderBy: { enrolledAt: 'desc' },
      include: {
        path: {
          select: {
            id: true,
            title: true,
            ar_title: true,
            slug: true,
            description: true,
            ar_description: true,
            iconName: true,
            difficulty: true,
            estimatedHours: true,
            _count: { select: { modules: true } },
          },
        },
      },
    });

    return enrollments.map((e) => ({
      id: e.id,
      progress: e.progress,
      isCompleted: e.isCompleted,
      enrolledAt: e.enrolledAt,
      completedAt: e.completedAt ?? null,
      startedAt: e.enrolledAt,
      careerPath: {
        id: e.path.id,
        slug: e.path.slug,
        name: e.path.title,
        ar_name: e.path.ar_title ?? null,
        description: e.path.description ?? null,
        ar_description: e.path.ar_description ?? null,
        iconUrl: null,
        iconName: e.path.iconName,
        difficulty: e.path.difficulty,
        estimatedHours: e.path.estimatedHours ?? null,
        modulesCount: e.path._count.modules,
      },
    }));
  }

  // ── Get Path by slug ─────────────────────────────────────────────────
  async getBySlug(slug: string, userId: string | null) {
    const path = await this.prisma.learningPath.findUnique({
      where: { slug },
      include: {
        modules: {
          orderBy: { order: 'asc' },
          include: {
            course: {
              select: {
                ...courseCardSelect(userId),
                sections: {
                  select: { id: true, order: true },
                  orderBy: { order: 'asc' },
                },
              },
            },
            lab: {
              select: {
                id: true,
                title: true,
                ar_title: true,
                difficulty: true,
                duration: true,
                ...(userId
                  ? {
                      usersProgress: {
                        where: { userId },
                        select: { progress: true, completedAt: true },
                      },
                    }
                  : {}),
              },
            },
          },
        },
        ...(userId
          ? {
              enrollments: {
                where: { userId },
                select: { progress: true, isCompleted: true, enrolledAt: true },
              },
            }
          : {}),
      },
    });

    if (!path || !path.isPublished)
      throw new NotFoundException('Learning path not found');

    const isEnrolled = userId ? (path as any).enrollments?.length > 0 : false;
    const progress = isEnrolled ? (path as any).enrollments[0].progress : 0;

    const formattedModules = path.modules.map((module) => {
      const rawCourse = (module as any).course;
      const rawLab = (module as any).lab;

      let moduleProgress = 0;
      let isCompleted = false;

      if (rawCourse) {
        const courseCard = toCourseCard(rawCourse);
        const up = courseCard.userProgress;
        if (up) {
          moduleProgress = up.progress;
          isCompleted = up.isCompleted;
        }
        return {
          ...module,
          course: courseCard,
          lab: null,
          userProgress: { progress: moduleProgress, isCompleted },
        };
      }

      if (rawLab) {
        if (userId && rawLab.usersProgress?.length > 0) {
          moduleProgress = rawLab.usersProgress[0].progress;
          isCompleted = !!rawLab.usersProgress[0].completedAt;
        }
        const { usersProgress, ...labRest } = rawLab;
        return {
          ...module,
          course: null,
          lab: labRest,
          userProgress: { progress: moduleProgress, isCompleted },
        };
      }

      return { ...module, userProgress: { progress: 0, isCompleted: false } };
    });

    const { enrollments, ...rest } = path as any;

    return {
      ...rest,
      modules: formattedModules,
      isEnrolled,
      progress,
      enrolledAt: isEnrolled ? (path as any).enrollments[0].enrolledAt : null,
    };
  }

  // ── Enroll ────────────────────────────────────────────────────────────
  async enroll(userId: string, slug: string) {
    const path = await this.prisma.learningPath.findUnique({
      where: { slug },
      select: { id: true, isPublished: true, title: true, slug: true },
    });
    if (!path || !path.isPublished)
      throw new NotFoundException('Learning path not found');

    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.pathEnrollment.findUnique({
        where: { userId_pathId: { userId, pathId: path.id } },
      });
      if (existing)
        return {
          success: true,
          enrolledAt: existing.enrolledAt,
          message: 'Already enrolled',
        };

      const enrollment = await tx.pathEnrollment.create({
        data: { userId, pathId: path.id },
      });
      this.notifications
        .notify(userId, NotificationEvents.pathEnrolled(path.title, path.slug))
        .catch(() => {});
      return { success: true, enrolledAt: enrollment.enrolledAt };
    });
  }

  // ── Sync Path Progress ────────────────────────────────────────────────
  /**
   * Recalculates path progress from completed modules and persists it.
   * If the path reaches 100% for the first time:
   *  - Sends a pathCompleted notification.
   *  - Issues a path certificate via CertificatesService.issuePathCertificate.
   */
  async syncPathProgress(userId: string, pathId: string) {
    const path = await this.prisma.learningPath.findUnique({
      where: { id: pathId },
      include: { modules: { select: { courseId: true, labId: true } } },
    });
    if (!path || path.modules.length === 0) return;

    let completedCount = 0;
    for (const mod of path.modules) {
      if (mod.courseId) {
        const enrollment = await this.prisma.enrollment.findUnique({
          where: { userId_courseId: { userId, courseId: mod.courseId } },
        });
        if (enrollment?.isCompleted) completedCount++;
      } else if (mod.labId) {
        const labProgress = await this.prisma.userLabProgress.findUnique({
          where: { userId_labId: { userId, labId: mod.labId } },
        });
        if (labProgress?.completedAt) completedCount++;
      }
    }

    const progress = Math.round((completedCount / path.modules.length) * 100);
    const isCompleted = progress >= 100;

    // Fetch existing enrollment to detect first-time completion
    const existingEnrollment = await this.prisma.pathEnrollment.findUnique({
      where: { userId_pathId: { userId, pathId } },
      select: { isCompleted: true },
    });

    await this.prisma.pathEnrollment.update({
      where: { userId_pathId: { userId, pathId } },
      data: {
        progress,
        isCompleted,
        completedAt: isCompleted ? new Date() : null,
      },
    });

    // Fire side-effects only on first-time completion
    if (isCompleted && !existingEnrollment?.isCompleted) {
      // 1. Notification
      this.notifications
        .notify(userId, NotificationEvents.pathCompleted(path.title, path.slug))
        .catch(() => {});

      // 2. Certificate — issued only when the full path is complete
      this.certificates
        .issuePathCertificate(userId, pathId)
        .catch(() => {});
    }
  }
}
