// src/modules/courses/courses.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
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
      // ممكن تغيرها حسب استخدامك لـ CATEGORY / tags
      where.category = category as any;
    }

    // فلاتر بناءً على اليوزر
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
    }

    const skip = (page - 1) * limit;

    const [total, data] = await this.prisma.$transaction([
      this.prisma.course.count({ where }),
      this.prisma.course.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          instructor: {
            select: { id: true, name: true, avatarUrl: true },
          },
        },
      }),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    return {
      data,
      meta: { total, page, limit, totalPages },
    };
  }

  async getBySlug(slug: string) {
    const course = await this.prisma.course.findUnique({
      where: { slug },
      include: {
        instructor: true,
        sections: {
          include: { lessons: { orderBy: { order: 'asc' } } },
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!course) throw new NotFoundException('Course not found');
    return course;
  }

  async getTopics(slug: string) {
    const course = await this.prisma.course.findUnique({
      where: { slug },
      select: { id: true, sections: { include: { lessons: true } } },
    });
    if (!course) throw new NotFoundException('Course not found');

    // تقدر ترجعها بالشكل اللي الفرونت متوقعه (Topic = Lesson)
    return course.sections
      .flatMap((s) => s.lessons)
      .sort((a, b) => a.order - b.order);
  }

  async getTopic(slug: string, lessonId: string) {
    const course = await this.prisma.course.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (!course) throw new NotFoundException('Course not found');

    const lesson = await this.prisma.lesson.findFirst({
      where: { id: lessonId, courseId: course.id },
    });
    if (!lesson) throw new NotFoundException('Topic not found');

    return lesson;
  }

  async enroll(userId: string, courseId: string) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
    });
    if (!course) throw new NotFoundException('Course not found');

    const enrollment = await this.prisma.enrollment.upsert({
      where: { userId_courseId: { userId, courseId } },
      update: {},
      create: { userId, courseId },
    });

    // تحديث counter بسيط
    await this.prisma.course.update({
      where: { id: courseId },
      data: { enrollmentCount: { increment: 1 } },
    });

    return {
      success: true,
      enrolledAt: enrollment.enrolledAt.toISOString(),
    };
  }

  async markComplete(userId: string, courseId: string, lessonId: string) {
    // تأكد أنه مسجل
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { userId_courseId: { userId, courseId } },
    });
    if (!enrollment) {
      throw new NotFoundException('User is not enrolled in this course');
    }

    // Complete lesson
    await this.prisma.lessonCompletion.upsert({
      where: { userId_lessonId: { userId, lessonId } },
      update: {},
      create: { userId, lessonId },
    });

    // احسب التقدم
    const totalLessons = await this.prisma.lesson.count({
      where: { courseId },
    });
    const completedLessons = await this.prisma.lessonCompletion.count({
      where: { userId, lesson: { courseId } },
    });

    const progress = totalLessons
      ? Math.round((completedLessons / totalLessons) * 100)
      : 0;

    const isCompleted = progress >= 100;

    const updatedEnrollment = await this.prisma.enrollment.update({
      where: { userId_courseId: { userId, courseId } },
      data: {
        progress,
        isCompleted,
        completedAt: isCompleted ? new Date() : undefined,
        lastAccessedAt: new Date(),
      },
    });

    return {
      success: true,
      completedAt: new Date().toISOString(),
      progress: updatedEnrollment.progress,
      isCompleted: updatedEnrollment.isCompleted,
    };
  }

  async getMyProgress(userId: string) {
    // enrolled courses
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
