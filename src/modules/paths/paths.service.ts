import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../core/database';
import { Prisma } from '@prisma/client';

@Injectable()
export class PathsService {
  constructor(private readonly prisma: PrismaService) {}

  async listPaths(userId: string | null, filters: { page?: number; limit?: number }) {
    const { page = 1, limit = 10 } = filters;
    const safeLimit = Math.min(Number(limit), 50);
    const skip = (Math.max(Number(page), 1) - 1) * safeLimit;

    const where: Prisma.LearningPathWhereInput = {
      isPublished: true,
    };

    const [total, paths] = await this.prisma.$transaction([
      this.prisma.learningPath.count({ where }),
      this.prisma.learningPath.findMany({
        where,
        skip,
        take: safeLimit,
        orderBy: { order: 'asc' },
        include: {
          _count: {
            select: { modules: true },
          },
          ...(userId && {
            enrollments: {
              where: { userId },
              select: { progress: true, isCompleted: true },
            },
          }),
        },
      }),
    ]);

    // Format output
    const formattedPaths = paths.map((path) => {
      const isEnrolled = userId && path.enrollments?.length > 0;
      const progress = isEnrolled ? path.enrollments[0].progress : 0;
      
      const { enrollments, ...rest } = path;
      return {
        ...rest,
        isEnrolled: !!isEnrolled,
        progress,
      };
    });

    const totalPages = Math.ceil(total / safeLimit) || 1;

    return {
      data: formattedPaths,
      meta: { total, page: Number(page), limit: safeLimit, totalPages },
    };
  }

  async getBySlug(slug: string, userId: string | null) {
    const path = await this.prisma.learningPath.findUnique({
      where: { slug },
      include: {
        modules: {
          orderBy: { order: 'asc' },
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
                slug: true,
                ...(userId && {
                  enrollments: {
                    where: { userId },
                    select: { progress: true, isCompleted: true },
                  }
                })
              }
            },
            lab: {
              select: {
                id: true,
                title: true,
                ar_title: true,
                difficulty: true,
                duration: true,
                ...(userId && {
                  usersProgress: {
                    where: { userId },
                    select: { progress: true, completedAt: true }
                  }
                })
              }
            }
          }
        },
        ...(userId && {
          enrollments: {
            where: { userId },
            select: { progress: true, isCompleted: true, enrolledAt: true },
          },
        }),
      },
    });

    if (!path || !path.isPublished) {
      throw new NotFoundException('Learning path not found');
    }

    const isEnrolled = userId ? path.enrollments?.length > 0 : false;
    const progress = isEnrolled ? path.enrollments[0].progress : 0;

    // Clean up nested data
    const formattedModules = path.modules.map(module => {
      let isCompleted = false;
      let moduleProgress = 0;

      if (userId && module.course && module.course.enrollments?.length > 0) {
        moduleProgress = module.course.enrollments[0].progress;
        isCompleted = module.course.enrollments[0].isCompleted;
      } else if (userId && module.lab && module.lab.usersProgress?.length > 0) {
        moduleProgress = module.lab.usersProgress[0].progress;
        isCompleted = !!module.lab.usersProgress[0].completedAt;
      }

      // Remove sensitive/internal data before sending to frontend
      if (module.course) delete (module.course as any).enrollments;
      if (module.lab) delete (module.lab as any).usersProgress;

      return {
        ...module,
        userProgress: {
          progress: moduleProgress,
          isCompleted
        }
      };
    });

    const { enrollments, ...rest } = path;

    return {
      ...rest,
      modules: formattedModules,
      isEnrolled,
      progress,
      enrolledAt: isEnrolled ? path.enrollments[0].enrolledAt : null,
    };
  }

  async enroll(userId: string, slug: string) {
    const path = await this.prisma.learningPath.findUnique({
      where: { slug },
      select: { id: true, isPublished: true },
    });

    if (!path || !path.isPublished) {
      throw new NotFoundException('Learning path not found');
    }

    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.pathEnrollment.findUnique({
        where: { userId_pathId: { userId, pathId: path.id } },
      });

      if (existing) {
        return {
          success: true,
          enrolledAt: existing.enrolledAt,
          message: 'Already enrolled'
        };
      }

      const enrollment = await tx.pathEnrollment.create({
        data: { userId, pathId: path.id },
      });

      return {
        success: true,
        enrolledAt: enrollment.enrolledAt,
      };
    });
  }

  // Called via cron job or webhook when user finishes a course/lab to recalculate Path Progress
  async syncPathProgress(userId: string, pathId: string) {
    const path = await this.prisma.learningPath.findUnique({
      where: { id: pathId },
      include: {
        modules: {
          select: { courseId: true, labId: true }
        }
      }
    });

    if (!path || path.modules.length === 0) return;

    let completedModulesCount = 0;

    for (const mod of path.modules) {
      if (mod.courseId) {
        const courseEnrollment = await this.prisma.enrollment.findUnique({
          where: { userId_courseId: { userId, courseId: mod.courseId } }
        });
        if (courseEnrollment?.isCompleted) completedModulesCount++;
      } else if (mod.labId) {
        const labProgress = await this.prisma.userLabProgress.findUnique({
          where: { userId_labId: { userId, labId: mod.labId } }
        });
        if (labProgress?.completedAt) completedModulesCount++;
      }
    }

    const progress = Math.round((completedModulesCount / path.modules.length) * 100);
    const isCompleted = progress >= 100;

    await this.prisma.pathEnrollment.update({
      where: { userId_pathId: { userId, pathId } },
      data: {
        progress,
        isCompleted,
        completedAt: isCompleted ? new Date() : null,
      }
    });
  }
}
