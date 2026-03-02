// src/modules/courses/courses.service.ts
import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../core/database';
import { CourseFiltersDto } from './dto/course-filters.dto';
import { Prisma } from '@prisma/client';
import { readFileSync, existsSync, readdirSync } from 'fs';
import { join } from 'path';

@Injectable()
export class CoursesService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Curriculum — reads from JSON seed files ─────────────────────────
  async getCurriculum(courseSlug: string) {
    const course = await this.prisma.course.findUnique({
      where: { slug: courseSlug },
      select: { title: true, slug: true },
    });

    if (!course) throw new NotFoundException('Course not found');

    const baseDir = join(process.cwd(), 'prisma/seed-data/course-data');

    const normalize = (s: string) =>
      s.toLowerCase().replace(/[-_\s&.,!()'"+]/g, '');

    const slugNorm = normalize(courseSlug);
    const titleNorm = normalize(course.title);

    const exactCandidates = [
      join(baseDir, `${courseSlug}.json`),
      join(baseDir, `${course.title}.json`),
    ];
    for (const filePath of exactCandidates) {
      if (existsSync(filePath)) {
        return this.parseCurriculumFile(filePath);
      }
    }

    const files = readdirSync(baseDir).filter(
      (f) => f.endsWith('.json') && f !== 'seed-courses.ts',
    );

    for (const file of files) {
      const fileNorm = normalize(file.replace('.json', ''));
      const isMatch =
        fileNorm === slugNorm ||
        fileNorm === titleNorm ||
        fileNorm.includes(slugNorm) ||
        slugNorm.includes(fileNorm) ||
        fileNorm.includes(titleNorm) ||
        titleNorm.includes(fileNorm);

      if (isMatch) {
        return this.parseCurriculumFile(join(baseDir, file));
      }
    }

    return {
      success: true,
      data: { topics: [], totalTopics: 0, landingData: null },
    };
  }

  private parseCurriculumFile(filePath: string) {
    const raw = JSON.parse(readFileSync(filePath, 'utf-8'));
    const topics = raw.topics ?? [];
    return {
      success: true,
      data: {
        topics,
        totalTopics: topics.length,
        landingData: raw.landingData ?? null,
      },
    };
  }

  // ── List courses ─────────────────────────────────────────────────────
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

    const where: Prisma.CourseWhereInput = {
      isPublished: true,
    };

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
        include: {
          instructor: {
            select: { id: true, name: true, avatarUrl: true },
          },
        },
      }),
    ]);

    const totalPages = Math.ceil(total / safeLimit) || 1;

    return {
      data,
      meta: { total, page: Number(page), limit: safeLimit, totalPages },
    };
  }

  // ── Get single course by slug ────────────────────────────────────────
  async getBySlug(slug: string) {
    const course = await this.prisma.course.findUnique({
      where: { slug },
      include: {
        instructor: {
          select: { id: true, name: true, avatarUrl: true, bio: true },
        },
        sections: {
          include: { lessons: { orderBy: { order: 'asc' } } },
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!course || !course.isPublished)
      throw new NotFoundException('Course not found');

    return course;
  }

  // ── Get topics (DB sections) ─────────────────────────────────────────
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

  // ── Get single topic/lesson ──────────────────────────────────────────
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

  // ── Get rich content from JSON (topics + elements) ───────────────────
  async getCourseContent(slug: string) {
    const course = await this.prisma.course.findUnique({
      where: { slug },
      select: { id: true, isPublished: true, title: true },
    });

    if (!course || !course.isPublished) {
      throw new NotFoundException('Course not found');
    }

    const jsonFileName = `${course.title}.json`;
    const filePath = join(
      process.cwd(),
      'prisma/seed-data/course-data',
      jsonFileName,
    );

    try {
      const fileContent = readFileSync(filePath, 'utf-8');
      const data = JSON.parse(fileContent);

      return {
        courseId: course.id,
        topics: data.topics ?? [],
        metadata: data.landingData ?? {},
      };
    } catch {
      console.warn(`JSON file not found for ${slug}: ${jsonFileName}`);
      return {
        courseId: course.id,
        topics: [],
        metadata: {},
      };
    }
  }

  // ── Enroll ────────────────────────────────────────────────────────────
  async enroll(userId: string, courseId: string) {
    // Support both UUID and slug
    const course = await this.prisma.course.findFirst({
      where: {
        OR: [{ id: courseId }, { slug: courseId }],
        isPublished: true,
      },
      select: { id: true, isPublished: true, title: true, slug: true },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

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

      // Init UserStats if not exists
      await tx.userStats.upsert({
        where: { userId },
        update: {},
        create: { userId },
      });

      return {
        success: true,
        alreadyEnrolled: false,
        courseId: course.id,
        enrolledAt: enrollment.enrolledAt.toISOString(),
      };
    });
  }

  // ── Mark topic (section) complete ────────────────────────────────────
  // sectionId = the Section.id from DB (what frontend calls "topicId")
  // Marks ALL lessons within the section as complete, then recalculates progress
  async markComplete(userId: string, courseId: string, sectionId: string) {
    // 1. Verify enrollment
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { userId_courseId: { userId, courseId } },
    });

    if (!enrollment) {
      throw new NotFoundException('User is not enrolled in this course');
    }

    // 2. Find section + its lessons
    const section = await this.prisma.section.findFirst({
      where: { id: sectionId, courseId },
      include: { lessons: { select: { id: true } } },
    });

    if (!section) {
      throw new NotFoundException('Section not found in this course');
    }

    return this.prisma.$transaction(async (tx) => {
      // 3. Upsert LessonCompletion for every lesson in section
      await Promise.all(
        section.lessons.map((lesson) =>
          tx.lessonCompletion.upsert({
            where: { userId_lessonId: { userId, lessonId: lesson.id } },
            update: {},
            create: { userId, lessonId: lesson.id },
          }),
        ),
      );

      // 4. Recalculate progress
      const totalLessons = await tx.lesson.count({ where: { courseId } });
      const completedLessons = await tx.lessonCompletion.count({
        where: { userId, lesson: { courseId } },
      });

      const progress = totalLessons
        ? Math.round((completedLessons / totalLessons) * 100)
        : 0;

      const isNowCompleted = progress >= 100;
      const wasAlreadyCompleted = enrollment.isCompleted;

      // 5. Update enrollment
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

      // 6. Upsert UserActivity for heatmap (one record per day)
      const todayDate = new Date();
      todayDate.setUTCHours(0, 0, 0, 0);

      await tx.userActivity.upsert({
        where: { userId_date: { userId, date: todayDate } },
        update: { completedTasks: { increment: 1 } },
        create: { userId, date: todayDate, completedTasks: 1 },
      });

      // 7. If course just completed → update UserStats
      if (isNowCompleted && !wasAlreadyCompleted) {
        await tx.userStats.upsert({
          where: { userId },
          update: { completedCourses: { increment: 1 } },
          create: { userId, completedCourses: 1 },
        });
      }

      return {
        success: true,
        progress,
        isCompleted: wasAlreadyCompleted || isNowCompleted,
        completedSectionId: sectionId,
      };
    });
  }

  // ── My progress ──────────────────────────────────────────────────────
  // Returns section-level completion (not lesson-level) so frontend store
  // can hydrate completedTopics: Record<courseId, sectionId[]> correctly
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

    // Get sections that have at least one completed lesson
    const completedSections = await this.prisma.section.findMany({
      where: {
        courseId: { in: enrollments.map((e) => e.courseId) },
        lessons: {
          some: {
            completions: { some: { userId } },
          },
        },
      },
      select: { id: true, courseId: true },
    });

    // Build: courseId → sectionId[]
    const completed: Record<string, string[]> = {};
    for (const section of completedSections) {
      if (!completed[section.courseId]) completed[section.courseId] = [];
      completed[section.courseId].push(section.id);
    }

    return {
      enrolled: enrollments.map((e) => e.courseId),
      completed, // ← sectionId[] per courseId (matches Zustand store shape)
      favorites: favorites.map((f) => f.courseId),
      enrollments: enrollments.map((e) => ({
        courseId: e.courseId,
        progress: e.progress,
        isCompleted: e.isCompleted,
      })),
    };
  }

  // ── Sync favorites ───────────────────────────────────────────────────
  async syncFavorite(
    userId: string,
    courseId: string,
    action: 'add' | 'remove',
  ) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      select: { id: true, isPublished: true },
    });

    if (!course || !course.isPublished) {
      throw new NotFoundException('Course not found');
    }

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
}
