import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../core/database';
import { CourseFiltersDto } from './dto/course-filters.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class CoursesService {
  constructor(private readonly prisma: PrismaService) {}

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

    // Default maximum limit enforcement (handled by DTO but double checked here)
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
    if (category) {
      where.category = category as any;
    }

    // User-specific filters (requires authentication)
    if (userId) {
      if (onlyFavorites) {
        where.favorites = { some: { userId } };
      }
      if (onlyEnrolled) {
        where.enrollments = { some: { userId } };
      }
      if (onlyCompleted) {
        where.enrollments = { some: { userId, isCompleted: true } };
      }
    } else if (onlyFavorites || onlyEnrolled || onlyCompleted) {
      // If user is not authenticated but requests user-specific filters, return empty result
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

  async getBySlug(slug: string) {
    const course = await this.prisma.course.findUnique({
      where: { slug },
      include: {
        instructor: {
          select: { id: true, name: true, avatarUrl: true, bio: true } // Avoid leaking sensitive instructor data
        },
        sections: {
          include: { lessons: { orderBy: { order: 'asc' } } },
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!course || !course.isPublished) throw new NotFoundException('Course not found');
    return course;
  }

  async getTopics(slug: string) {
    const course = await this.prisma.course.findUnique({
      where: { slug },
      select: { 
        id: true, 
        isPublished: true,
        sections: { include: { lessons: true } } 
      },
    });
    if (!course || !course.isPublished) throw new NotFoundException('Course not found');

    return course.sections
      .flatMap((s) => s.lessons)
      .sort((a, b) => a.order - b.order);
  }

  async getTopic(slug: string, lessonId: string) {
    const course = await this.prisma.course.findUnique({
      where: { slug },
      select: { id: true, isPublished: true },
    });
    if (!course || !course.isPublished) throw new NotFoundException('Course not found');

    const lesson = await this.prisma.lesson.findFirst({
      where: { id: lessonId, courseId: course.id },
    });
    if (!lesson) throw new NotFoundException('Topic not found');

    return lesson;
  }

  async enroll(userId: string, courseId: string) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      select: { id: true, isPublished: true }
    });
    
    if (!course || !course.isPublished) {
      throw new NotFoundException('Course not found');
    }

    // Use transaction to ensure data consistency and prevent double-incrementing enrollmentCount
    return this.prisma.$transaction(async (tx) => {
      const existingEnrollment = await tx.enrollment.findUnique({
        where: { userId_courseId: { userId, courseId } }
      });

      if (existingEnrollment) {
        return {
          success: true,
          enrolledAt: existingEnrollment.enrolledAt.toISOString(),
          message: 'Already enrolled'
        };
      }

      const enrollment = await tx.enrollment.create({
        data: { userId, courseId }
      });

      await tx.course.update({
        where: { id: courseId },
        data: { enrollmentCount: { increment: 1 } },
      });

      return {
        success: true,
        enrolledAt: enrollment.enrolledAt.toISOString(),
      };
    });
  }

  async markComplete(userId: string, courseId: string, lessonId: string) {
    // 1. Check enrollment
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { userId_courseId: { userId, courseId } },
    });
    
    if (!enrollment) {
      throw new NotFoundException('User is not enrolled in this course');
    }

    // 2. Verify lesson belongs to course
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId }
    });

    if (!lesson || lesson.courseId !== courseId) {
      throw new NotFoundException('Lesson not found in this course');
    }

    return this.prisma.$transaction(async (tx) => {
      // 3. Mark lesson as complete (Idempotent)
      const existingCompletion = await tx.lessonCompletion.findUnique({
        where: { userId_lessonId: { userId, lessonId } }
      });

      if (!existingCompletion) {
        await tx.lessonCompletion.create({
          data: { userId, lessonId },
        });
      }

      // 4. Calculate progress
      const totalLessons = await tx.lesson.count({
        where: { courseId },
      });
      
      const completedLessons = await tx.lessonCompletion.count({
        where: { userId, lesson: { courseId } },
      });

      const progress = totalLessons
        ? Math.round((completedLessons / totalLessons) * 100)
        : 0;

      // 5. Update enrollment safely
      // Never un-complete a course if progress drops (e.g. if new lessons are added later)
      const isNowCompleted = progress >= 100;
      const shouldUpdateCompletionDate = isNowCompleted && !enrollment.isCompleted;

      const updatedEnrollment = await tx.enrollment.update({
        where: { userId_courseId: { userId, courseId } },
        data: {
          progress,
          isCompleted: enrollment.isCompleted || isNowCompleted,
          completedAt: shouldUpdateCompletionDate ? new Date() : enrollment.completedAt,
          lastAccessedAt: new Date(),
        },
      });

      return {
        success: true,
        completedAt: updatedEnrollment.completedAt?.toISOString() || new Date().toISOString(),
        progress: updatedEnrollment.progress,
        isCompleted: updatedEnrollment.isCompleted,
      };
    });
  }

  async getMyProgress(userId: string) {
    const enrollments = await this.prisma.enrollment.findMany({
      where: { userId },
      select: { courseId: true, isCompleted: true },
    });

    const favorites = await this.prisma.courseFavorite.findMany({
      where: { userId },
      select: { courseId: true },
    });

    const completions = await this.prisma.lessonCompletion.findMany({
      where: { userId },
      select: {
        lessonId: true,
        lesson: { select: { courseId: true } },
      },
    });

    const enrolled = enrollments.map((e) => e.courseId);

    const completed: Record<string, string[]> = {};
    for (const c of completions) {
      const cid = c.lesson.courseId;
      if (!completed[cid]) completed[cid] = [];
      completed[cid].push(c.lessonId);
    }

    return {
      enrolled,
      completed,
      favorites: favorites.map((f) => f.courseId),
    };
  }

  async syncFavorite(
    userId: string,
    courseId: string,
    action: 'add' | 'remove',
  ) {
    // Verify course exists and is published
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      select: { id: true, isPublished: true }
    });

    if (!course || !course.isPublished) {
      throw new NotFoundException('Course not found');
    }

    if (action === 'add') {
      // Upsert prevents unique constraint errors if clicked rapidly
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
