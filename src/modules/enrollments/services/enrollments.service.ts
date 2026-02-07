import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../../core/database';
import { EnrollCourseDto, UpdateProgressDto, EnrollmentQueryDto } from '../dto';
import {
  EnrollmentSerializer,
  EnrollmentDetailsSerializer,
} from '../serializers';
import { plainToClass } from 'class-transformer';

@Injectable()
export class EnrollmentsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Enroll user in a course
   */
  async enrollInCourse(
    userId: string,
    enrollDto: EnrollCourseDto,
  ): Promise<EnrollmentSerializer> {
    const { courseId } = enrollDto;

    // Check if course exists
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      select: {
        id: true,
        title: true,
        ar_title: true,
        thumbnail: true,
        difficulty: true,
        duration: true,
        estimatedHours: true,
        isPublished: true,
      },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    if (!course.isPublished) {
      throw new BadRequestException('Course is not published yet');
    }

    // Check if already enrolled
    const existingEnrollment = await this.prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId,
        },
      },
    });

    if (existingEnrollment) {
      throw new ConflictException('Already enrolled in this course');
    }

    // Create enrollment
    const enrollment = await this.prisma.enrollment.create({
      data: {
        userId,
        courseId,
        progress: 0,
        isCompleted: false,
        enrolledAt: new Date(),
        lastAccessedAt: new Date(),
      },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            ar_title: true,
            thumbnail: true,
            difficulty: true,
            duration: true,
            estimatedHours: true,
          },
        },
      },
    });

    // Update course enrollment count
    await this.prisma.course.update({
      where: { id: courseId },
      data: {
        enrollmentCount: {
          increment: 1,
        },
      },
    });

    return plainToClass(EnrollmentSerializer, enrollment, {
      excludeExtraneousValues: true,
    });
  }

  /**
   * Unenroll user from a course
   */
  async unenrollFromCourse(userId: string, courseId: string): Promise<void> {
    // Check if enrolled
    const enrollment = await this.prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId,
        },
      },
    });

    if (!enrollment) {
      throw new NotFoundException('Not enrolled in this course');
    }

    // Delete enrollment
    await this.prisma.enrollment.delete({
      where: {
        userId_courseId: {
          userId,
          courseId,
        },
      },
    });

    // Update course enrollment count
    await this.prisma.course.update({
      where: { id: courseId },
      data: {
        enrollmentCount: {
          decrement: 1,
        },
      },
    });
  }

  /**
   * Get all user enrollments
   */
  async getAllEnrollments(userId: string, query: EnrollmentQueryDto) {
    const { page = 1, limit = 10, isCompleted } = query;

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {
      userId,
    };

    // Add filters
    if (isCompleted !== undefined) {
      where.isCompleted = isCompleted === true;
    }

    // Get enrollments with course details
    const enrollments = await this.prisma.enrollment.findMany({
      where,
      skip,
      take: limit,
      orderBy: { enrolledAt: 'desc' },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            ar_title: true,
            description: true,
            ar_description: true,
            thumbnail: true,
            difficulty: true,
            duration: true,
            estimatedHours: true,
          },
        },
      },
    });

    // Get total count
    const total = await this.prisma.enrollment.count({ where });

    // Calculate total pages
    const totalPages = Math.ceil(total / limit);

    return {
      data: enrollments,
      meta: {
        total,
        page,
        limit,
        totalPages,
      },
    };
  }

  /**
   * Get user enrollments with pagination
   */
   async getUserEnrollments(userId: string, query: EnrollmentQueryDto) {
    const {
      page = 1,
      limit = 10,
      sortBy = 'enrolledAt',
      sortOrder = 'desc',
      isCompleted,
    } = query;

    const skip = (page - 1) * limit;

    const where: any = { userId };

    if (isCompleted !== undefined) {
      where.isCompleted = isCompleted;
    }

    // Get enrollments
    const enrollments = await this.prisma.enrollment.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            ar_title: true,
            thumbnail: true,
            difficulty: true,
            duration: true,
            estimatedHours: true,
          },
        },
      },
    });

    const total = await this.prisma.enrollment.count({ where });

    // ✅ Return data directly without serializer
    return {
      data: enrollments,  // ← بدون plainToClass
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }


  /**
   * Get enrollment details with progress breakdown
   */
  async getEnrollmentDetails(
    userId: string,
    courseId: string,
  ): Promise<EnrollmentDetailsSerializer> {
    // Get enrollment
    const enrollment = await this.prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId,
        },
      },
      include: {
        course: {
          include: {
            sections: {
              include: {
                lessons: {
                  select: {
                    id: true,
                  },
                },
              },
              orderBy: { order: 'asc' },
            },
          },
        },
      },
    });

    if (!enrollment) {
      throw new NotFoundException('Enrollment not found');
    }

    // Get completed lessons
    const completedLessons = await this.prisma.lessonCompletion.count({
      where: {
        userId,
        lesson: {
          courseId,
        },
      },
    });

    // Calculate total lessons
    const totalLessons = enrollment.course.sections.reduce(
      (total, section) => total + section.lessons.length,
      0,
    );

    // Map sections with progress
    const sectionsWithProgress = enrollment.course.sections.map((section) => {
      const sectionLessons = section.lessons;
      const completedInSection = sectionLessons.filter((lesson) =>
        this.prisma.lessonCompletion.findFirst({
          where: {
            userId,
            lessonId: lesson.id,
          },
        }),
      ).length;

      return {
        id: section.id,
        title: section.title,
        ar_title: section.ar_title,
        order: section.order,
        lessonsCount: sectionLessons.length,
        completedLessons: completedInSection,
      };
    });

    const result: EnrollmentDetailsSerializer = {
      id: enrollment.id,
      userId: enrollment.userId,
      courseId: enrollment.courseId,
      course: {
        id: enrollment.course.id,
        title: enrollment.course.title,
        ar_title: enrollment.course.ar_title,
        description: enrollment.course.description,
        ar_description: enrollment.course.ar_description,
        thumbnail: enrollment.course.thumbnail,
        difficulty: enrollment.course.difficulty,
        duration: enrollment.course.duration,
        estimatedHours: enrollment.course.estimatedHours,
        sections: sectionsWithProgress,
      },
      progress: enrollment.progress,
      isCompleted: enrollment.isCompleted,
      enrolledAt: enrollment.enrolledAt,
      completedAt: enrollment.completedAt,
      lastAccessedAt: enrollment.lastAccessedAt,
      totalLessons,
      completedLessons,
      totalSections: enrollment.course.sections.length,
    };

    return plainToClass(EnrollmentDetailsSerializer, result, {
      excludeExtraneousValues: true,
    });
  }

  /**
   * Update enrollment progress
   */
  async updateProgress(
    userId: string,
    courseId: string,
    updateData: UpdateProgressDto,
  ): Promise<EnrollmentSerializer> {
    // Check if enrolled
    const enrollment = await this.prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId,
        },
      },
    });

    if (!enrollment) {
      throw new NotFoundException('Not enrolled in this course');
    }

    // Update enrollment
    const updatedEnrollment = await this.prisma.enrollment.update({
      where: {
        userId_courseId: {
          userId,
          courseId,
        },
      },
      data: {
        progress: updateData.progress,
        isCompleted:
          updateData.isCompleted ??
          (updateData.progress === 100 ? true : undefined),
        completedAt:
          updateData.isCompleted || updateData.progress === 100
            ? new Date()
            : undefined,
        lastAccessedAt: new Date(),
        updatedAt: new Date(),
      },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            ar_title: true,
            thumbnail: true,
            difficulty: true,
            duration: true,
            estimatedHours: true,
          },
        },
      },
    });

    return plainToClass(EnrollmentSerializer, updatedEnrollment, {
      excludeExtraneousValues: true,
    });
  }

  /**
   * Calculate and update enrollment progress automatically
   */
  async recalculateProgress(userId: string, courseId: string): Promise<number> {
    // Get total lessons in course
    const totalLessons = await this.prisma.lesson.count({
      where: { courseId },
    });

    if (totalLessons === 0) {
      return 0;
    }

    // Get completed lessons
    const completedLessons = await this.prisma.lessonCompletion.count({
      where: {
        userId,
        lesson: {
          courseId,
        },
      },
    });

    // Calculate progress percentage
    const progress = Math.round((completedLessons / totalLessons) * 100);

    // Update enrollment
    await this.prisma.enrollment.update({
      where: {
        userId_courseId: {
          userId,
          courseId,
        },
      },
      data: {
        progress,
        isCompleted: progress === 100,
        completedAt: progress === 100 ? new Date() : null,
        lastAccessedAt: new Date(),
      },
    });

    return progress;
  }

  /**
   * Check if user is enrolled in course
   */
  async isEnrolled(userId: string, courseId: string): Promise<boolean> {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId,
        },
      },
    });

    return !!enrollment;
  }
}
