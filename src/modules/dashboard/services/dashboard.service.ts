import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../core/database';
import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  subDays,
  eachDayOfInterval,
  format,
} from 'date-fns';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  // ── GET /dashboard/stats ──────────────────────────────────────────
  async getStats(userId: string) {
    const [stats, points] = await this.prisma.$transaction([
      this.prisma.userStats.findUnique({ where: { userId } }),
      this.prisma.userPoints.findUnique({ where: { userId } }),
    ]);
    return {
      completedLabs: stats?.completedLabs ?? 0,
      completedCourses: stats?.completedCourses ?? 0,
      totalHours: stats?.totalHours ?? 0,
      currentStreak: stats?.currentStreak ?? 0,
      longestStreak: stats?.longestStreak ?? 0,
      activeDays: stats?.activeDays ?? 0,
      totalXP: points?.totalXP ?? 0,
      totalPoints: points?.totalPoints ?? 0,
      level: points?.level ?? 1,
      badgesCount: stats?.badgesCount ?? 0,
    };
  }

  // ── GET /dashboard/activity ───────────────────────────────────────
  async getRecentActivity(userId: string) {
    const activities = await this.prisma.userActivity.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
      take: 10,
    });
    return activities;
  }

  // ── GET /dashboard/courses ────────────────────────────────────────
  async getEnrolledCourses(userId: string) {
    const enrollments = await this.prisma.enrollment.findMany({
      where: { userId, isCompleted: false },
      orderBy: { lastAccessedAt: 'desc' },
      take: 6,
      include: {
        course: {
          select: {
            id: true,
            title: true,
            ar_title: true,
            thumbnail: true,
            difficulty: true,
          },
        },
      },
    });
    return enrollments.map((e) => ({
      courseId: e.courseId,
      title: e.course.title,
      ar_title: e.course.ar_title,
      thumbnail: e.course.thumbnail,
      difficulty: e.course.difficulty,
      progress: e.progress,
      lastAccessedAt: e.lastAccessedAt,
    }));
  }

  // ── GET /dashboard/labs/active ────────────────────────────────────
  async getActiveLabs(userId: string) {
    const labs = await this.prisma.userLabProgress.findMany({
      where: { userId, completedAt: null },
      orderBy: { lastAccess: 'desc' },
      take: 6,
      include: {
        lab: {
          select: {
            id: true,
            title: true,
            ar_title: true,
            difficulty: true,
            xpReward: true,
          },
        },
      },
    });
    return labs.map((l) => ({
      labId: l.labId,
      title: l.lab.title,
      ar_title: l.lab.ar_title,
      difficulty: l.lab.difficulty,
      xpReward: l.lab.xpReward,
      progress: l.progress,
      attempts: l.attempts,
      lastAccess: l.lastAccess,
    }));
  }

  // ── GET /dashboard/progress/weekly ───────────────────────────────
  async getWeeklyProgress(userId: string) {
    const start = startOfWeek(new Date(), { weekStartsOn: 0 });
    const end = endOfWeek(new Date(), { weekStartsOn: 0 });
    return this._getActivityRange(userId, start, end);
  }

  // ── GET /dashboard/progress/monthly ──────────────────────────────
  async getMonthlyProgress(userId: string) {
    const start = startOfMonth(new Date());
    const end = endOfMonth(new Date());
    return this._getActivityRange(userId, start, end);
  }

  // ── GET /dashboard/progress/chart ────────────────────────────────
  async getProgressChart(userId: string) {
    // Last 30 days XP by day - limit query to avoid giant payload if someone manipulated dates
    const since = subDays(new Date(), 30);
    const xpLogs = await this.prisma.xPLog.findMany({
      where: { userId, createdAt: { gte: since } },
      select: { amount: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
      take: 1000, // Safety limit
    });

    // Group by day
    const byDay: Record<string, number> = {};
    for (const log of xpLogs) {
      const key = format(log.createdAt, 'yyyy-MM-dd');
      byDay[key] = (byDay[key] ?? 0) + log.amount;
    }

    const days = eachDayOfInterval({ start: since, end: new Date() });
    return days.map((d) => {
      const key = format(d, 'yyyy-MM-dd');
      return { date: key, xp: byDay[key] ?? 0 };
    });
  }

  // ── GET /dashboard/leaderboard ────────────────────────────────────
  async getLeaderboard(userId: string) {
    // Select specific user fields to prevent returning full user objects (password hashes, etc)
    const topUsers = await this.prisma.userPoints.findMany({
      orderBy: { totalXP: 'desc' },
      take: 10,
      include: {
        user: {
          select: { id: true, name: true, avatarUrl: true },
        },
      },
    });

    const entries = topUsers.map((up, index) => ({
      rank: index + 1,
      userId: up.userId,
      name: up.user.name,
      avatarUrl: up.user.avatarUrl,
      totalXP: up.totalXP,
      level: up.level,
      isCurrentUser: up.userId === userId,
    }));

    // If current user not in top 10, find their rank
    const myEntry = entries.find((e) => e.userId === userId);
    if (!myEntry) {
      const [myPoints, myUser] = await this.prisma.$transaction([
        this.prisma.userPoints.findUnique({ where: { userId } }),
        this.prisma.user.findUnique({ where: { id: userId }, select: { name: true, avatarUrl: true } }),
      ]);
      
      if (myPoints && myUser) {
        const myRank = await this.prisma.userPoints.count({
          where: { totalXP: { gt: myPoints.totalXP } },
        });
        entries.push({
          rank: myRank + 1,
          userId,
          name: myUser.name,
          avatarUrl: myUser.avatarUrl,
          totalXP: myPoints.totalXP,
          level: myPoints.level,
          isCurrentUser: true,
        });
      }
    }

    return entries;
  }

  // ── GET /dashboard/heatmap ────────────────────────────────────────
  async getHeatmap(userId: string) {
    const since = subDays(new Date(), 365);
    const activities = await this.prisma.userActivity.findMany({
      where: { userId, date: { gte: since } },
      select: {
        date: true,
        activeMinutes: true,
        completedTasks: true,
        labsSolved: true,
      },
      orderBy: { date: 'asc' },
      take: 366, // Safety limit (max 1 year + leap day)
    });
    return activities.map((a) => ({
      date: format(a.date, 'yyyy-MM-dd'),
      count: a.completedTasks + a.labsSolved,
      minutes: a.activeMinutes,
    }));
  }

  // ── Private helpers ───────────────────────────────────────────────
  private async _getActivityRange(userId: string, start: Date, end: Date) {
    const activities = await this.prisma.userActivity.findMany({
      where: { userId, date: { gte: start, lte: end } },
      orderBy: { date: 'asc' },
      take: 31, // Safety limit for a month
    });
    const totalMinutes = activities.reduce((s, a) => s + a.activeMinutes, 0);
    const totalTasks = activities.reduce((s, a) => s + a.completedTasks, 0);
    const totalLabs = activities.reduce((s, a) => s + a.labsSolved, 0);
    return { activities, totalMinutes, totalTasks, totalLabs };
  }
}
