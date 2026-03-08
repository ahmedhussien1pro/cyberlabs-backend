import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/database';

/**
 * AdminAnalyticsService
 *
 * Aggregates platform-wide metrics for the admin dashboard.
 * All queries use explicit count() calls to avoid Prisma groupBy type issues.
 * Returns data ready for charting and KPI cards.
 */
@Injectable()
export class AdminAnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  // ──────────────────────────────────────────────────────────────────
  // GET /admin/analytics/overview
  // High-level platform metrics — total counts across all entities
  // ──────────────────────────────────────────────────────────────────
  async getOverview() {
    const [
      totalUsers,
      totalCourses,
      totalLabs,
      totalEnrollments,
      totalLabCompletions,
      totalXPAwarded,
      totalPointsAwarded,
    ] = await this.prisma.$transaction([
      this.prisma.user.count(),
      this.prisma.course.count({ where: { isPublished: true } }),
      this.prisma.lab.count({ where: { isPublished: true } }),
      this.prisma.enrollment.count(),
      this.prisma.userLabProgress.count({ where: { completedAt: { not: null } } }),
      this.prisma.userPoints.aggregate({ _sum: { totalXP: true } }),
      this.prisma.userPoints.aggregate({ _sum: { totalPoints: true } }),
    ]);

    return {
      users: totalUsers,
      courses: totalCourses,
      labs: totalLabs,
      enrollments: totalEnrollments,
      labCompletions: totalLabCompletions,
      totalXP: totalXPAwarded._sum.totalXP ?? 0,
      totalPoints: totalPointsAwarded._sum.totalPoints ?? 0,
    };
  }

  // ──────────────────────────────────────────────────────────────────
  // GET /admin/analytics/growth
  // Monthly user and enrollment growth trends (last 12 months)
  // ──────────────────────────────────────────────────────────────────
  async getGrowthTrends() {
    const now = new Date();
    const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), 1);

    // Users created per month
    const usersByMonth = await this.prisma.user.groupBy({
      by: ['createdAt'],
      where: { createdAt: { gte: oneYearAgo } },
      _count: { id: true },
      orderBy: { createdAt: 'asc' },
    });

    // Enrollments per month
    const enrollmentsByMonth = await this.prisma.enrollment.groupBy({
      by: ['enrolledAt'],
      where: { enrolledAt: { gte: oneYearAgo } },
      _count: { id: true },
      orderBy: { enrolledAt: 'asc' },
    });

    // Aggregate by month manually (Prisma doesn't have native month grouping)
    const userMonthly = this.aggregateByMonth(usersByMonth, 'createdAt');
    const enrollmentMonthly = this.aggregateByMonth(enrollmentsByMonth, 'enrolledAt');

    return {
      users: userMonthly,
      enrollments: enrollmentMonthly,
    };
  }

  // ──────────────────────────────────────────────────────────────────
  // GET /admin/analytics/engagement
  // Activity metrics: logins, lab launches, submissions (last 30 days)
  // ──────────────────────────────────────────────────────────────────
  async getEngagementMetrics() {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      activeUsers,
      labLaunches,
      submissions,
      avgSessionDuration,
    ] = await this.prisma.$transaction([
      // Users who logged in within last 30 days
      this.prisma.user.count({
        where: { lastLoginAt: { gte: thirtyDaysAgo } },
      }),
      // Lab launches (instances created)
      this.prisma.labInstance.count({
        where: { startedAt: { gte: thirtyDaysAgo } },
      }),
      // Flag submissions
      this.prisma.labSubmission.count({
        where: { submittedAt: { gte: thirtyDaysAgo } },
      }),
      // Average lab session duration (in seconds)
      this.prisma.labSubmission.aggregate({
        where: { submittedAt: { gte: thirtyDaysAgo } },
        _avg: { timeTaken: true },
      }),
    ]);

    return {
      activeUsers,
      labLaunches,
      submissions,
      avgSessionDuration: Math.round(avgSessionDuration._avg.timeTaken ?? 0),
    };
  }

  // ──────────────────────────────────────────────────────────────────
  // GET /admin/analytics/top-content
  // Most popular courses and labs by enrollment/completion
  // ──────────────────────────────────────────────────────────────────
  async getTopContent() {
    // Top 10 courses by enrollment count
    const topCourses = await this.prisma.course.findMany({
      where: { isPublished: true },
      orderBy: { enrollmentCount: 'desc' },
      take: 10,
      select: {
        id: true,
        title: true,
        slug: true,
        enrollmentCount: true,
        averageRating: true,
        difficulty: true,
      },
    });

    // Top 10 labs by completion count
    const labCompletions = await this.prisma.userLabProgress.groupBy({
      by: ['labId'],
      where: { completedAt: { not: null } },
      _count: { labId: true },
      orderBy: { _count: { labId: 'desc' } },
      take: 10,
    });

    const labIds = labCompletions.map((l) => l.labId);
    const labs = await this.prisma.lab.findMany({
      where: { id: { in: labIds } },
      select: {
        id: true,
        title: true,
        slug: true,
        difficulty: true,
        category: true,
      },
    });

    const topLabs = labCompletions.map((lc) => {
      const lab = labs.find((l) => l.id === lc.labId);
      return {
        ...lab,
        completions: lc._count.labId,
      };
    });

    return {
      courses: topCourses,
      labs: topLabs,
    };
  }

  // ──────────────────────────────────────────────────────────────────
  // GET /admin/analytics/recent-activity
  // Last 20 platform events: enrollments, completions, new users
  // ──────────────────────────────────────────────────────────────────
  async getRecentActivity() {
    const [recentUsers, recentEnrollments, recentCompletions] = await Promise.all([
      // Last 10 users
      this.prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
          role: true,
        },
      }),
      // Last 10 enrollments
      this.prisma.enrollment.findMany({
        orderBy: { enrolledAt: 'desc' },
        take: 10,
        select: {
          id: true,
          enrolledAt: true,
          user: { select: { id: true, name: true } },
          course: { select: { id: true, title: true, slug: true } },
        },
      }),
      // Last 10 lab completions
      this.prisma.userLabProgress.findMany({
        where: { completedAt: { not: null } },
        orderBy: { completedAt: 'desc' },
        take: 10,
        select: {
          completedAt: true,
          user: { select: { id: true, name: true } },
          lab: { select: { id: true, title: true, slug: true } },
        },
      }),
    ]);

    // Merge and sort by timestamp
    const activity: any[] = [
      ...recentUsers.map((u) => ({
        type: 'user_registered',
        timestamp: u.createdAt,
        user: { id: u.id, name: u.name },
      })),
      ...recentEnrollments.map((e) => ({
        type: 'course_enrolled',
        timestamp: e.enrolledAt,
        user: e.user,
        course: e.course,
      })),
      ...recentCompletions.map((c) => ({
        type: 'lab_completed',
        timestamp: c.completedAt,
        user: c.user,
        lab: c.lab,
      })),
    ];

    return activity
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 20);
  }

  // ──────────────────────────────────────────────────────────────────
  // Helper: Aggregate groupBy results by month
  // ──────────────────────────────────────────────────────────────────
  private aggregateByMonth(records: any[], dateField: string) {
    const byMonth: Record<string, number> = {};

    for (const record of records) {
      const date = new Date(record[dateField]);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      byMonth[key] = (byMonth[key] ?? 0) + (record._count?.id ?? record._count?.[dateField] ?? 1);
    }

    return Object.entries(byMonth)
      .map(([month, count]) => ({ month, count }))
      .sort((a, b) => a.month.localeCompare(b.month));
  }
}
