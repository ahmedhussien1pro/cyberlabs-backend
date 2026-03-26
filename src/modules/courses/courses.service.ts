// src/modules/courses/courses.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../core/database';
import { CourseFiltersDto } from './dto/course-filters.dto';
import { Prisma } from '@prisma/client';
import { readFileSync, existsSync, readdirSync } from 'fs';
import { join } from 'path';
import {
  courseCardSelect,
  courseDetailInclude,
} from '../../common/selects/course-card.select';
import { toCourseCard } from '../../common/transformers/course-card.transformer';
import { BadgesService } from '../badges/badges.service';
import { CertificatesService } from '../certificates/certificates.service';
import { NotificationsService } from '../notifications/services/notifications.service';
import { NotificationEvents } from '../notifications/notifications.events';

const COURSE_DATA_DIR = join(process.cwd(), 'prisma/seed-data/course-data');

function normalizeName(s: string): string {
  return s.toLowerCase().replace(/[-_\s&.,!()'"\+]/g, '');
}

function readCourseJson(slug: string, title: string): any | null {
  const exactPaths = [
    join(COURSE_DATA_DIR, `${slug}.json`),
    join(COURSE_DATA_DIR, `${title}.json`),
  ];
  for (const p of exactPaths) {
    if (existsSync(p)) {
      try {
        return JSON.parse(readFileSync(p, 'utf-8'));
      } catch {}
    }
  }

  let files: string[];
  try {
    files = readdirSync(COURSE_DATA_DIR).filter(
      (f) => f.endsWith('.json') && f !== 'seed-courses.ts',
    );
  } catch {
    return null;
  }

  const slugNorm = normalizeName(slug);
  const titleNorm = normalizeName(title);

  for (const file of files) {
    const fileNorm = normalizeName(file.replace('.json', ''));
    if (
      fileNorm === slugNorm ||
      fileNorm === titleNorm ||
      fileNorm.includes(slugNorm) ||
      slugNorm.includes(fileNorm) ||
      fileNorm.includes(titleNorm) ||
      titleNorm.includes(fileNorm)
    ) {
      try {
        return JSON.parse(readFileSync(join(COURSE_DATA_DIR, file), 'utf-8'));
      } catch {
        return null;
      }
    }
  }
  return null;
}

@Injectable()
export class CoursesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly badgesService: BadgesService,
    private readonly certificatesService: CertificatesService,
    private readonly notifications: NotificationsService,
  ) {}

  // ── Curriculum ────────────────────────────────────────────────────────
  async getCurriculum(courseSlug: string) {
    const course = await this.prisma.course.findUnique({
      where: { slug: courseSlug },
      include: {
        sections: {
          orderBy: { order: 'asc' },
          include: {
            lessons: {
              where: { order: { gt: 0 } },
              orderBy: { order: 'asc' },
            },
          },
        },
      },
    });

    if (!course) throw new NotFoundException('Course not found');

    const topics = course.sections.map((section) => ({
      id: section.id,
      title: { en: section.title ?? '', ar: section.ar_title ?? '' },
      order: section.order,
      elements: section.lessons.map((lesson) => ({
        id: lesson.id,
        title: { en: lesson.title ?? '', ar: lesson.ar_title ?? '' },
        type:
          (lesson.type ?? 'ARTICLE').toLowerCase() === 'video'
            ? 'video'
            : 'text',
        url: lesson.videoUrl ?? undefined,
        duration: lesson.duration ?? 0,
        isPreview: lesson.isPreview ?? false,
        order: lesson.order,
      })),
    }));

    return {
      success: true,
      data: {
        topics,
        totalTopics: topics.length,
        landingData: null,
      },
    };
  }

  // ── List courses ───────────────────────────────────────────────────
  async listCourses(userId: string | null, filters: CourseFiltersDto) {
    const {
      search,
      difficulty,
      access,
      category,
      contentType,
      status,
      onlyFavorites,
      onlyEnrolled,
      onlyCompleted,
      page = 1,
      limit = 12,
    } = filters;

    const safeLimit = Math.min(Number(limit), 50);
    const skip = (Math.max(Number(page), 1) - 1) * safeLimit;

    const where: Prisma.CourseWhereInput = { isPublished: true };

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { tags: { has: search } },
      ];
    }
    if (difficulty) where.difficulty = difficulty;
    if (access) where.access = access;
    if (contentType) where.contentType = contentType;
    if (status) where.state = status;
    if (category) where.category = category as any;

    if (userId) {
      if (onlyFavorites) where.favorites = { some: { userId } };
      if (onlyEnrolled) where.enrollments = { some: { userId } };
      if (onlyCompleted)
        where.enrollments = { some: { userId, isCompleted: true } };
    } else if (onlyFavorites || onlyEnrolled || onlyCompleted) {
      return {
        data: [],
        meta: { total: 0, page: Number(page), limit: safeLimit, totalPages: 0 },
      };
    }

    const [total, data] = await this.prisma.$transaction([
      this.prisma.course.count({ where }),
      this.prisma.course.findMany({
        where,
        skip,
        take: safeLimit,
        orderBy: { createdAt: 'desc' },
        select: {
          ...courseCardSelect(userId),
          instructor: { select: { id: true, name: true, avatarUrl: true } },
        },
      }),
    ]);

    const totalPages = Math.ceil(total / safeLimit) || 1;

    return {
      data: data.map(toCourseCard),
      meta: { total, page: Number(page), limit: safeLimit, totalPages },
    };
  }

  // ── Get single course by slug ────────────────────────────────────
  async getBySlug(slug: string, userId?: string | null) {
    const course = await this.prisma.course.findUnique({
      where: { slug },
      include: courseDetailInclude(userId),
    });

    if (!course || !course.isPublished)
      throw new NotFoundException('Course not found');

    return toCourseCard(course);
  }

  // ── Get topics (DB sections) ─────────────────────────────────────
  async getTopics(slug: string) {
    const course = await this.prisma.course.findUnique({
      where: { slug },
      select: {
        id: true,
        isPublished: true,
        sections: { include: { lessons: true } },
      },
    });

    if (!course || !course.isPublished)
      throw new NotFoundException('Course not found');

    return course.sections
      .flatMap((s) => s.lessons)
      .sort((a, b) => a.order - b.order);
  }

  // ── Get single topic/lesson ──────────────────────────────────────
  async getTopic(slug: string, lessonId: string) {
    const course = await this.prisma.course.findUnique({
      where: { slug },
      select: { id: true, isPublished: true },
    });

    if (!course || !course.isPublished)
      throw new NotFoundException('Course not found');

    const lesson = await this.prisma.lesson.findFirst({
      where: { id: lessonId, courseId: course.id },
    });

    if (!lesson) throw new NotFoundException('Topic not found');
    return lesson;
  }

  // ── Get rich content from JSON ────────────────────────────────────
  async getCourseContent(slug: string) {
    const course = await this.prisma.course.findUnique({
      where: { slug },
      select: { id: true, isPublished: true, title: true, slug: true },
    });

    if (!course || !course.isPublished)
      throw new NotFoundException('Course not found');

    const data = readCourseJson(course.slug, course.title);
    if (data) {
      return {
        courseId: course.id,
        topics: data.topics ?? [],
        metadata: data.landingData ?? {},
      };
    }

    console.warn(`[CoursesService] JSON not found for slug="${slug}"`);
    return { courseId: course.id, topics: [], metadata: {} };
  }

  // ── Enroll ───────────────────────────────────────────────────────
  async enroll(userId: string, courseId: string) {
    const course = await this.prisma.course.findFirst({
      where: { OR: [{ id: courseId }, { slug: courseId }], isPublished: true },
      select: { id: true, isPublished: true, title: true, slug: true },
    });

    if (!course) throw new NotFoundException('Course not found');

    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.enrollment.findUnique({
        where: { userId_courseId: { userId, courseId: course.id } },
      });

      if (existing) {
        return {
          success: true,
          alreadyEnrolled: true,
          enrolledAt: existing.enrolledAt.toISOString(),
          message: 'Already enrolled',
        };
      }

      const enrollment = await tx.enrollment.create({
        data: {
          userId,
          courseId: course.id,
          progress: 0,
          isCompleted: false,
          enrolledAt: new Date(),
          lastAccessedAt: new Date(),
        },
      });

      await tx.course.update({
        where: { id: course.id },
        data: { enrollmentCount: { increment: 1 } },
      });

      await tx.userStats.upsert({
        where: { userId },
        update: {},
        create: { userId },
      });

      this.notifications
        .notify(
          userId,
          NotificationEvents.courseEnrolled(course.title, course.slug),
        )
        .catch(() => {});

      return {
        success: true,
        alreadyEnrolled: false,
        courseId: course.id,
        enrolledAt: enrollment.enrolledAt.toISOString(),
      };
    });
  }

  // ── Mark topic complete ──────────────────────────────────────────
  async markComplete(userId: string, courseId: string, sectionId: string) {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { userId_courseId: { userId, courseId } },
    });
    if (!enrollment)
      throw new NotFoundException('User is not enrolled in this course');

    const section = await this.prisma.section.findFirst({
      where: { id: sectionId, courseId },
      include: { lessons: { select: { id: true } } },
    });
    if (!section)
      throw new NotFoundException('Section not found in this course');

    const result = await this.prisma.$transaction(async (tx) => {
      await Promise.all(
        section.lessons.map((lesson) =>
          tx.lessonCompletion.upsert({
            where: { userId_lessonId: { userId, lessonId: lesson.id } },
            update: {},
            create: { userId, lessonId: lesson.id },
          }),
        ),
      );

      const totalLessons = await tx.lesson.count({ where: { courseId } });
      const completedLessons = await tx.lessonCompletion.count({
        where: { userId, lesson: { courseId } },
      });

      const progress = totalLessons
        ? Math.round((completedLessons / totalLessons) * 100)
        : 0;
      const isNowCompleted = progress >= 100;
      const wasAlreadyCompleted = enrollment.isCompleted;

      await tx.enrollment.update({
        where: { userId_courseId: { userId, courseId } },
        data: {
          progress,
          isCompleted: wasAlreadyCompleted || isNowCompleted,
          completedAt:
            isNowCompleted && !wasAlreadyCompleted
              ? new Date()
              : enrollment.completedAt,
          lastAccessedAt: new Date(),
        },
      });

      const todayDate = new Date();
      todayDate.setUTCHours(0, 0, 0, 0);
      await tx.userActivity.upsert({
        where: { userId_date: { userId, date: todayDate } },
        update: { completedTasks: { increment: 1 } },
        create: { userId, date: todayDate, completedTasks: 1 },
      });

      if (isNowCompleted && !wasAlreadyCompleted) {
        await tx.userStats.upsert({
          where: { userId },
          update: { completedCourses: { increment: 1 } },
          create: { userId, completedCourses: 1 },
        });
      }

      return {
        progress,
        isCompleted: wasAlreadyCompleted || isNowCompleted,
        newlyCompleted: isNowCompleted && !wasAlreadyCompleted,
      };
    });

    if (result.newlyCompleted) {
      this.certificatesService
        .issueCertificate(userId, courseId)
        .catch((err) =>
          console.warn(
            `[Cert] issueCertificate failed userId=${userId}:`,
            err?.message,
          ),
        );

      this.prisma.enrollment
        .count({ where: { userId, isCompleted: true } })
        .then((count) =>
          this.badgesService.checkCourseMilestoneBadges(userId, count),
        )
        .catch((err) =>
          console.warn(
            `[Badge] checkCourseMilestone failed userId=${userId}:`,
            err?.message,
          ),
        );
    }

    return {
      success: true,
      progress: result.progress,
      isCompleted: result.isCompleted,
      completedSectionId: sectionId,
    };
  }

  // ── My progress ──────────────────────────────────────────────────
  async getMyProgress(userId: string) {
    const enrollments = await this.prisma.enrollment.findMany({
      where: { userId },
      select: {
        courseId: true,
        isCompleted: true,
        progress: true,
        enrolledAt: true,
      },
    });

    const favorites = await this.prisma.courseFavorite.findMany({
      where: { userId },
      select: { courseId: true },
    });

    const completedSections = await this.prisma.section.findMany({
      where: {
        courseId: { in: enrollments.map((e) => e.courseId) },
        lessons: { some: { completions: { some: { userId } } } },
      },
      select: { id: true, courseId: true },
    });

    const completed: Record<string, string[]> = {};
    for (const section of completedSections) {
      if (!completed[section.courseId]) completed[section.courseId] = [];
      completed[section.courseId].push(section.id);
    }

    return {
      enrolled: enrollments.map((e) => e.courseId),
      completed,
      favorites: favorites.map((f) => f.courseId),
      enrollments: enrollments.map((e) => ({
        courseId: e.courseId,
        progress: e.progress,
        isCompleted: e.isCompleted,
      })),
    };
  }

  // ── Sync favorites ───────────────────────────────────────────────
  async syncFavorite(
    userId: string,
    courseId: string,
    action: 'add' | 'remove',
  ) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      select: { id: true, isPublished: true },
    });
    if (!course || !course.isPublished)
      throw new NotFoundException('Course not found');

    if (action === 'add') {
      await this.prisma.courseFavorite.upsert({
        where: { userId_courseId: { userId, courseId } },
        update: {},
        create: { userId, courseId },
      });
    } else {
      await this.prisma.courseFavorite.deleteMany({
        where: { userId, courseId },
      });
    }
    return { success: true };
  }

  // ── Course Labs ──────────────────────────────────────────────────
  async getCourseLabs(slug: string) {
    const course = await this.prisma.course.findUnique({
      where: { slug },
      select: { id: true, isPublished: true },
    });
    if (!course || !course.isPublished)
      throw new NotFoundException('Course not found');

    const courseLabRecords = await (this.prisma as any).courseLab.findMany({
      where: { courseId: course.id },
      orderBy: { order: 'asc' },
      include: {
        lab: {
          select: {
            id: true,
            slug: true,
            title: true,
            ar_title: true,
            difficulty: true,
            duration: true,
            xpReward: true,
            category: true,
            imageUrl: true,
            isPublished: true,
          },
        },
      },
    });

    const labs = courseLabRecords
      .map((cl: any) => cl.lab)
      .filter((lab: any) => lab?.isPublished);

    return { courseId: course.id, labs };
  }
}
