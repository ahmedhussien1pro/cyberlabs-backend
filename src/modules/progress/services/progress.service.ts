import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../core/database';
import { Difficulty } from '@prisma/client';
import { ProgressQueryDto } from '../dto';
import {
  CourseProgressSerializer,
  LabProgressSummarySerializer,
  OverallProgressSerializer,
} from '../serializers';
import { plainToClass } from 'class-transformer';

@Injectable()
export class ProgressService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get overall user progress
   */
  async getOverallProgress(
    userId: string,
    query?: ProgressQueryDto,
  ): Promise<OverallProgressSerializer> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Date range filtering
    let dateFilter: any = {};
    if (query?.startDate || query?.endDate) {
      dateFilter = {
        ...(query.startDate && { gte: new Date(query.startDate) }),
        ...(query.endDate && { lte: new Date(query.endDate) }),
      };
    }

    // Learning Stats
    const totalCoursesEnrolled = await this.prisma.enrollment.count({
      where: { userId },
    });

    const coursesCompleted = await this.prisma.enrollment.count({
      where: { userId, isCompleted: true },
    });

    const coursesInProgress = totalCoursesEnrolled - coursesCompleted;

    const totalLabsStarted = await this.prisma.userLabProgress.count({
      where: { userId },
    });

    const labsCompleted = await this.prisma.userLabProgress.count({
      where: { userId, completedAt: { not: null } },
    });

    const labsInProgress = totalLabsStarted - labsCompleted;

    const totalLessonsCompleted = await this.prisma.lessonCompletion.count({
      where: { userId },
    });

    // Calculate average progress
    const enrollments = await this.prisma.enrollment.findMany({
      where: { userId },
      select: { progress: true },
    });

    const averageCourseProgress =
      enrollments.length > 0
        ? enrollments.reduce((sum, e) => sum + e.progress, 0) /
          enrollments.length
        : 0;

    const labsProgress = await this.prisma.userLabProgress.findMany({
      where: { userId },
      select: { progress: true },
    });

    const averageLabProgress =
      labsProgress.length > 0
        ? labsProgress.reduce((sum, l) => sum + l.progress, 0) /
          labsProgress.length
        : 0;

    // Gamification Stats
    const userPoints = await this.prisma.userPoints.findUnique({
      where: { userId },
    });

    const badgesCount = await this.prisma.userBadge.count({
      where: { userId },
    });

    const achievementsCount = await this.prisma.userAchievement.count({
      where: { userId, achievedAt: { not: null } },
    });

    // Calculate rank
    const usersWithMorePoints = await this.prisma.userPoints.count({
      where: {
        totalPoints: {
          gt: userPoints?.totalPoints || 0,
        },
      },
    });
    const rank = usersWithMorePoints + 1;

    // Time Stats
    const userStats = await this.prisma.userStats.findUnique({
      where: { userId },
    });

    const averageDailyTime =
      userStats?.activeDays && userStats.activeDays > 0
        ? (userStats.totalHours * 60) / userStats.activeDays
        : 0;

    // Recent Activities
    const recentEnrollments = await this.prisma.enrollment.findMany({
      where: { userId },
      orderBy: { enrolledAt: 'desc' },
      take: 5,
      include: {
        course: {
          select: { title: true },
        },
      },
    });

    const recentLabProgress = await this.prisma.userLabProgress.findMany({
      where: { userId },
      orderBy: { startedAt: 'desc' },
      take: 5,
      include: {
        lab: {
          select: { title: true },
        },
      },
    });

    const recentActivities: any[] = [
      ...recentEnrollments.map((e) => ({
        type: 'course',
        title: e.course.title,
        action: e.isCompleted ? 'completed' : 'started',
        timestamp:
          e.isCompleted && e.completedAt ? e.completedAt : e.enrolledAt,
      })),
      ...recentLabProgress.map((l) => ({
        type: 'lab',
        title: l.lab.title,
        action: l.completedAt ? 'completed' : 'in_progress',
        timestamp: l.completedAt || l.startedAt,
      })),
    ]
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 10);

    const result: OverallProgressSerializer = {
      userId: user.id,
      userName: user.name,
      learning: {
        totalCoursesEnrolled,
        coursesInProgress,
        coursesCompleted,
        totalLabsStarted,
        labsInProgress,
        labsCompleted,
        totalLessonsCompleted,
        averageCourseProgress: Math.round(averageCourseProgress),
        averageLabProgress: Math.round(averageLabProgress),
      },
      gamification: {
        totalPoints: userPoints?.totalPoints || 0,
        totalXP: userPoints?.totalXP || 0,
        level: userPoints?.level || 1,
        badgesEarned: badgesCount,
        achievementsUnlocked: achievementsCount,
        rank,
      },
      time: {
        totalHoursSpent: userStats?.totalHours || 0,
        activeDays: userStats?.activeDays || 0,
        currentStreak: userStats?.currentStreak || 0,
        longestStreak: userStats?.longestStreak || 0,
        averageDailyTime: Math.round(averageDailyTime),
        lastActivityDate: userStats?.lastActivityDate,
      },
      recentActivities,
    };

    return plainToClass(OverallProgressSerializer, result, {
      excludeExtraneousValues: true,
    });
  }

  /**
   * Get detailed course progress
   */
  async getCourseProgress(userId: string): Promise<CourseProgressSerializer[]> {
    const enrollments = await this.prisma.enrollment.findMany({
      where: { userId },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            ar_title: true,
            thumbnail: true,
            difficulty: true,
            estimatedHours: true,
            sections: {
              select: {
                id: true,
                lessons: {
                  select: {
                    id: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { enrolledAt: 'desc' },
    });

    const progressList = await Promise.all(
      enrollments.map(async (enrollment) => {
        // Calculate total and completed lessons
        const totalLessons = enrollment.course.sections.reduce(
          (sum, section) => sum + section.lessons.length,
          0,
        );

        const completedLessons = await this.prisma.lessonCompletion.count({
          where: {
            userId,
            lesson: {
              courseId: enrollment.courseId,
            },
          },
        });

        const totalSections = enrollment.course.sections.length;

        // Calculate estimated time remaining
        const estimatedHours = enrollment.course.estimatedHours || 0;
        const progressPercent = enrollment.progress / 100;
        const estimatedTimeRemaining = Math.max(
          0,
          estimatedHours * (1 - progressPercent),
        );

        return {
          courseId: enrollment.courseId,
          courseTitle: enrollment.course.title,
          courseArTitle: enrollment.course.ar_title,
          courseThumbnail: enrollment.course.thumbnail,
          difficulty: enrollment.course.difficulty,
          progress: enrollment.progress,
          isCompleted: enrollment.isCompleted,
          totalLessons,
          completedLessons,
          totalSections,
          enrolledAt: enrollment.enrolledAt,
          lastAccessedAt: enrollment.lastAccessedAt,
          completedAt: enrollment.completedAt,
          estimatedTimeRemaining: Math.round(estimatedTimeRemaining * 10) / 10,
        };
      }),
    );

    return progressList.map((progress) =>
      plainToClass(CourseProgressSerializer, progress, {
        excludeExtraneousValues: true,
      }),
    );
  }

  /**
   * Get detailed lab progress
   */
  async getLabProgress(
    userId: string,
  ): Promise<LabProgressSummarySerializer[]> {
    const labProgress = await this.prisma.userLabProgress.findMany({
      where: { userId },
      include: {
        lab: {
          select: {
            id: true,
            title: true,
            ar_title: true,
            difficulty: true,
          },
        },
      },
      orderBy: { startedAt: 'desc' },
    });

    const progressList = await Promise.all(
      labProgress.map(async (progress) => {
        // Get best submission for this lab
        const bestSubmission = await this.prisma.labSubmission.findFirst({
          where: {
            userId,
            labId: progress.labId,
            isCorrect: true,
          },
          orderBy: {
            pointsEarned: 'desc',
          },
        });

        const timeTaken = progress.completedAt
          ? Math.floor(
              (progress.completedAt.getTime() - progress.startedAt.getTime()) /
                1000,
            )
          : undefined;

        return {
          labId: progress.labId,
          labTitle: progress.lab.title,
          labArTitle: progress.lab.ar_title,
          difficulty: progress.lab.difficulty,
          progress: progress.progress,
          attempts: progress.attempts,
          hintsUsed: progress.hintsUsed,
          isCompleted: !!progress.completedAt,
          startedAt: progress.startedAt,
          completedAt: progress.completedAt,
          timeTaken,
          pointsEarned: bestSubmission?.pointsEarned || 0,
          xpEarned: bestSubmission?.xpEarned || 0,
        };
      }),
    );

    return progressList.map((progress) =>
      plainToClass(LabProgressSummarySerializer, progress, {
        excludeExtraneousValues: true,
      }),
    );
  }

  /**
   * Get progress by difficulty
   */
  async getProgressByDifficulty(userId: string) {
    const difficulties: Difficulty[] = [
      Difficulty.BEGINNER,
      Difficulty.INTERMEDIATE,
      Difficulty.ADVANCED,
    ]; // ← Use enum values

    const stats = await Promise.all(
      difficulties.map(async (difficulty) => {
        const totalCourses = await this.prisma.enrollment.count({
          where: {
            userId,
            course: { difficulty }, // ← Now TypeScript knows it's Difficulty type
          },
        });

        const completedCourses = await this.prisma.enrollment.count({
          where: {
            userId,
            isCompleted: true,
            course: { difficulty },
          },
        });

        const totalLabs = await this.prisma.userLabProgress.count({
          where: {
            userId,
            lab: { difficulty },
          },
        });

        const completedLabs = await this.prisma.userLabProgress.count({
          where: {
            userId,
            completedAt: { not: null },
            lab: { difficulty },
          },
        });

        return {
          difficulty: difficulty as string, // Convert back to string for response
          courses: {
            total: totalCourses,
            completed: completedCourses,
            inProgress: totalCourses - completedCourses,
          },
          labs: {
            total: totalLabs,
            completed: completedLabs,
            inProgress: totalLabs - completedLabs,
          },
        };
      }),
    );

    return stats;
  }

  /**
   * Get learning streaks
   */
  async getLearningStreaks(userId: string) {
    // Get user stats
    let stats = await this.prisma.userStats.findUnique({
      where: { userId },
    });

    // Create stats if not exists
    if (!stats) {
      stats = await this.prisma.userStats.create({
        data: {
          userId,
          completedLabs: 0,
          activeDays: 0,
          totalHours: 0,
          currentStreak: 0,
          longestStreak: 0,
        },
      });
    }

    // ✅ Fixed: use labSubmission instead of submission
    const submissions = await this.prisma.labSubmission.findMany({
      where: {
        userId,
        isCorrect: true,
      },
      select: {
        submittedAt: true,
      },
      orderBy: { submittedAt: 'desc' },
    });

    // Calculate actual streak from submissions
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (submissions.length > 0) {
      // Group submissions by day
      const daySet = new Set<string>();
      submissions.forEach((sub) => {
        const date = new Date(sub.submittedAt);
        date.setHours(0, 0, 0, 0);
        daySet.add(date.toISOString());
      });

      const uniqueDays = Array.from(daySet)
        .map((d) => new Date(d))
        .sort((a, b) => b.getTime() - a.getTime());

      // Calculate current streak
      let checkDate = new Date(today);
      for (const day of uniqueDays) {
        const diffDays = Math.floor(
          (checkDate.getTime() - day.getTime()) / (1000 * 60 * 60 * 24),
        );

        if (diffDays === 0 || diffDays === 1) {
          currentStreak++;
          checkDate = day;
        } else {
          break;
        }
      }

      // Calculate longest streak
      tempStreak = 1;
      for (let i = 0; i < uniqueDays.length - 1; i++) {
        const diffDays = Math.floor(
          (uniqueDays[i].getTime() - uniqueDays[i + 1].getTime()) /
            (1000 * 60 * 60 * 24),
        );

        if (diffDays === 1) {
          tempStreak++;
          longestStreak = Math.max(longestStreak, tempStreak);
        } else {
          tempStreak = 1;
        }
      }
      longestStreak = Math.max(longestStreak, tempStreak);

      // Update stats
      await this.prisma.userStats.update({
        where: { userId },
        data: {
          currentStreak,
          longestStreak,
          activeDays: uniqueDays.length,
          lastActivityDate: uniqueDays[0],
        },
      });
    }

    // Get streak history (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // ✅ Fixed: use labSubmission
    const recentSubmissions = await this.prisma.labSubmission.findMany({
      where: {
        userId,
        isCorrect: true,
        submittedAt: {
          gte: thirtyDaysAgo,
        },
      },
      select: {
        submittedAt: true,
      },
    });

    // Group by date
    const streakHistory: { date: string; count: number }[] = [];
    const dateMap = new Map<string, number>();

    recentSubmissions.forEach((sub) => {
      const date = new Date(sub.submittedAt);
      date.setHours(0, 0, 0, 0);
      const dateStr = date.toISOString().split('T')[0];
      dateMap.set(dateStr, (dateMap.get(dateStr) || 0) + 1);
    });

    // Fill last 30 days
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      streakHistory.push({
        date: dateStr,
        count: dateMap.get(dateStr) || 0,
      });
    }

    return {
      currentStreak,
      longestStreak,
      totalActiveDays: stats.activeDays,
      streakHistory,
    };
  }
}
