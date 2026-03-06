import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../../core/database';
import {
  UpdateProfileDto,
  UserQueryDto,
  ChangePasswordDto,
  UserActivityDto,
  UpdateNotificationPrefsDto,
  DeleteAccountDto,
} from '../dto';
import { UserStatsSerializer } from '../serializers';
import { R2Service } from '../../../core/storage';
import { ConfigService } from '@nestjs/config';
import { plainToClass } from 'class-transformer';

/** XP formula: Level N requires N×1000 cumulative XP — mirrors practice-labs.service */
function calcLevel(totalXP: number): number {
  return Math.floor(totalXP / 1000) + 1;
}

/**
 * Calculate current streak from an array of activity Date objects.
 * A streak is consecutive days of activity ending today or yesterday.
 * Dates are expected in any order — function sorts them internally.
 */
function calcStreak(dates: Date[]): number {
  if (dates.length === 0) return 0;

  // Deduplicate & normalize to YYYY-MM-DD, sort DESC
  const uniqueDates = [
    ...new Set(dates.map((d) => d.toISOString().slice(0, 10))),
  ]
    .sort()
    .reverse();

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().slice(0, 10);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().slice(0, 10);

  // Streak must touch today or yesterday to be "current"
  if (uniqueDates[0] !== todayStr && uniqueDates[0] !== yesterdayStr) return 0;

  let streak = 0;
  const cursor = new Date(uniqueDates[0]);

  for (const dateStr of uniqueDates) {
    if (dateStr === cursor.toISOString().slice(0, 10)) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private r2: R2Service,
    private config: ConfigService,
  ) {}

  /**
   * Get user profile by ID
   */
  async getUserProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        bio: true,
        ar_bio: true,
        avatarUrl: true,
        address: true,
        birthday: true,
        phoneNumber: true,
        role: true,
        internalRole: true,
        isVerified: true,
        isEmailVerified: true,
        isActive: true,
        createdAt: true,
        lastLoginAt: true,
        socialLinks: {
          select: { id: true, type: true, url: true },
        },
        skills: {
          select: {
            id: true,
            level: true,
            progress: true,
            skill: {
              select: { id: true, name: true, ar_name: true, category: true },
            },
          },
        },
        education: {
          select: {
            id: true,
            institution: true,
            ar_institution: true,
            degree: true,
            field: true,
            startYear: true,
            endYear: true,
            isCurrent: true,
          },
          orderBy: { startYear: 'desc' },
        },
        certifications: {
          select: {
            id: true,
            title: true,
            issuer: true,
            issueDate: true,
            expireDate: true,
            credentialId: true,
            credentialUrl: true,
          },
          orderBy: { issueDate: 'desc' },
        },
        badges: {
          select: {
            id: true,
            awardedAt: true,
            context: true,
            badge: {
              select: {
                title: true,
                ar_title: true,
                description: true,
                iconUrl: true,
                type: true,
                xpReward: true,
              },
            },
          },
          orderBy: { awardedAt: 'desc' },
        },
        achievements: {
          select: {
            id: true,
            achievedAt: true,
            progress: true,
            achievement: {
              select: {
                title: true,
                description: true,
                iconUrl: true,
                category: true,
                xpReward: true,
              },
            },
          },
        },
        careerPaths: {
          select: {
            id: true,
            progress: true,
            startedAt: true,
            completedAt: true,
            careerPath: {
              select: {
                id: true,
                name: true,
                ar_name: true,
                description: true,
                ar_description: true,
                iconUrl: true,
              },
            },
          },
        },
        password: false,
        refreshToken: false,
        twoFactorSecret: false,
      },
    });

    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  /**
   * Update user profile
   */
  async updateProfile(userId: string, updateData: UpdateProfileDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) throw new NotFoundException('User not found');

    if (updateData.name && updateData.name !== existingUser.name) {
      const nameExists = await this.prisma.user.findUnique({
        where: { name: updateData.name },
      });
      if (nameExists) throw new BadRequestException('Username already taken');
    }

    const { socialLinks, ...profileData } = updateData;

    const [updatedUser] = await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: {
          ...profileData,
          birthday: profileData.birthday
            ? new Date(profileData.birthday)
            : undefined,
          updatedAt: new Date(),
        },
      }),
      ...(socialLinks !== undefined
        ? [
            this.prisma.socialLink.deleteMany({ where: { userId } }),
            ...(socialLinks.length > 0
              ? [
                  this.prisma.socialLink.createMany({
                    data: socialLinks.map((l) => ({
                      userId,
                      type: l.type,
                      url: l.url,
                    })),
                  }),
                ]
              : []),
          ]
        : []),
    ]);

    return this.getUserProfile(updatedUser.id);
  }

  /**
   * Get user statistics
   *
   * ✅ Fix: totalHours calculated from UserLabProgress completion times.
   *         startedAt is non-nullable DateTime in schema — no null filter needed.
   *         Only completedAt is nullable (null = lab not yet finished).
   */
  async getUserStats(userId: string): Promise<UserStatsSerializer> {
    const [
      user,
      enrolledCourses,
      completedCourses,
      completedLabs,
      labTimes,
      activityDates,
    ] = await this.prisma.$transaction([
      this.prisma.user.findUnique({
        where: { id: userId },
        include: {
          points: true,
          badges: { select: { id: true } },
          certifications: { select: { id: true } },
        },
      }),
      this.prisma.enrollment.count({ where: { userId } }),
      this.prisma.enrollment.count({ where: { userId, isCompleted: true } }),
      this.prisma.userLabProgress.count({
        where: { userId, completedAt: { not: null } },
      }),
      // ✅ Fix: derive hours from actual lab time-on-task
      // startedAt is non-nullable DateTime — safe to use directly
      // completedAt is DateTime? — filter for completed labs only
      this.prisma.userLabProgress.findMany({
        where: {
          userId,
          completedAt: { not: null },
        },
        select: { startedAt: true, completedAt: true },
      }),
      // streak: reads UserActivity dates (returns 0 safely if table is empty)
      this.prisma.userActivity.findMany({
        where: { userId },
        select: { date: true },
        orderBy: { date: 'desc' },
      }),
    ]);

    if (!user) throw new NotFoundException('User not found');

    // Sum actual lab durations; cap each lab at 300 min (5 h) to filter bad data.
    // startedAt is always a Date (non-nullable), completedAt guarded by the where filter.
    const totalMinutes = labTimes.reduce((sum, lab) => {
      if (!lab.completedAt) return sum;
      const diff =
        (lab.completedAt.getTime() - lab.startedAt.getTime()) / 60_000;
      return sum + Math.max(0, Math.min(diff, 300));
    }, 0);

    // 1-decimal precision: 30 min → 0.5 h, 45 min → 0.8 h
    const totalHours = Math.round((totalMinutes / 60) * 10) / 10;

    const currentStreak = calcStreak(activityDates.map((a) => a.date));

    const stats: UserStatsSerializer = {
      id: user.id,
      name: user.name,
      avatarUrl: user.avatarUrl || undefined,
      role: user.role,

      totalPoints: user.points?.totalPoints || 0,
      totalXP: user.points?.totalXP || 0,
      level: user.points?.level || 1,

      enrolledCourses,
      completedCourses,
      completedLabs,
      badgesCount: user.badges.length,
      certificationsCount: user.certifications.length,

      totalHours,
      activeDays: activityDates.length,
      currentStreak,
      longestStreak: 0,
      lastActivityDate: activityDates[0]?.date ?? undefined,
    };

    return plainToClass(UserStatsSerializer, stats, {
      excludeExtraneousValues: true,
    });
  }

  /**
   * Get all users (admin only)
   */
  async getAllUsers(query: UserQueryDto) {
    const {
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      search,
    } = query;

    const skip = (page - 1) * limit;
    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const users = await this.prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
        role: true,
        internalRole: true,
        isVerified: true,
        isActive: true,
        createdAt: true,
        points: {
          select: { totalPoints: true, totalXP: true, level: true },
        },
      },
    });

    const total = await this.prisma.user.count({ where });

    return {
      data: users,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get user's enrolled courses
   */
  async getUserEnrolledCourses(userId: string) {
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
            duration: true,
          },
        },
      },
      orderBy: { enrolledAt: 'desc' },
    });

    return enrollments.map((enrollment) => ({
      id: enrollment.id,
      course: enrollment.course,
      progress: enrollment.progress,
      isCompleted: enrollment.isCompleted,
      enrolledAt: enrollment.enrolledAt,
      lastAccessedAt: enrollment.lastAccessedAt,
    }));
  }

  /**
   * Get user's completed labs
   */
  async getUserCompletedLabs(userId: string) {
    const labProgress = await this.prisma.userLabProgress.findMany({
      where: { userId, completedAt: { not: null } },
      include: {
        lab: {
          select: {
            id: true,
            title: true,
            ar_title: true,
            difficulty: true,
            pointsReward: true,
            xpReward: true,
          },
        },
      },
      orderBy: { completedAt: 'desc' },
    });

    return labProgress.map((progress) => ({
      id: progress.id,
      lab: progress.lab,
      attempts: progress.attempts,
      hintsUsed: progress.hintsUsed,
      startedAt: progress.startedAt,
      completedAt: progress.completedAt,
    }));
  }

  /**
   * Change user password
   */
  async changePassword(
    userId: string,
    changePasswordDto: ChangePasswordDto,
  ): Promise<void> {
    const { currentPassword, newPassword } = changePasswordDto;

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, password: true },
    });

    if (!user) throw new NotFoundException('User not found');

    const bcrypt = require('bcrypt');
    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password,
    );
    if (!isPasswordValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword, updatedAt: new Date() },
    });
  }

  /**
   * Get user points — with auto level-correction
   */
  async getUserPoints(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { points: true },
    });

    if (!user) throw new NotFoundException('User not found');

    let points = user.points;
    if (!points) {
      points = await this.prisma.userPoints.create({
        data: { userId, totalPoints: 0, totalXP: 0, level: 1 },
      });
    }

    const correctLevel = calcLevel(points.totalXP);
    if (correctLevel !== points.level) {
      points = await this.prisma.userPoints.update({
        where: { userId },
        data: { level: correctLevel },
      });
    }

    const xpForNextLevel = points.level * 1000;
    const xpIntoCurrentLevel = points.totalXP - (points.level - 1) * 1000;
    const xpNeededForLevel = 1000;

    return {
      totalPoints: points.totalPoints,
      totalXP: points.totalXP,
      level: points.level,
      xpIntoCurrentLevel,
      xpNeededForLevel,
      xpForNextLevel,
      levelProgress: Math.min(
        Math.round((xpIntoCurrentLevel / xpNeededForLevel) * 100),
        100,
      ),
      pointsToNextLevel: Math.max(0, xpForNextLevel - points.totalXP),
    };
  }

  async getUserActivity(userId: string): Promise<UserActivityDto[]> {
    const since = new Date();
    since.setFullYear(since.getFullYear() - 1);

    const activities = await this.prisma.userActivity.findMany({
      where: { userId, date: { gte: since } },
      select: {
        date: true,
        activeMinutes: true,
        completedTasks: true,
        labsSolved: true,
      },
      orderBy: { date: 'asc' },
    });

    return activities.map((a) => ({
      date: a.date.toISOString(),
      activeMinutes: a.activeMinutes,
      completedTasks: a.completedTasks,
      labsSolved: a.labsSolved,
    }));
  }

  async requestAvatarUpload(userId: string, contentType: string) {
    return this.r2.getPresignedUploadUrl(userId, contentType);
  }

  async confirmAvatarUpload(userId: string, key: string): Promise<string> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { avatarUrl: true },
    });

    if (user?.avatarUrl) {
      const oldKey = this.r2.extractKey(user.avatarUrl);
      if (oldKey) await this.r2.deleteObject(oldKey).catch(() => null);
    }

    const publicUrl = this.config.get<string>('R2_PUBLIC_URL');
    const avatarUrl = `${publicUrl}/${key}`;

    await this.prisma.user.update({
      where: { id: userId },
      data: { avatarUrl, updatedAt: new Date() },
    });

    return avatarUrl;
  }

  // ── Sessions ──────────────────────────────────────────────
  async getUserSessions(userId: string) {
    return this.prisma.refreshToken.findMany({
      where: { userId, revokedAt: null, expiresAt: { gt: new Date() } },
      select: {
        id: true,
        userAgent: true,
        ip: true,
        createdAt: true,
        expiresAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async revokeSession(userId: string, sessionId: string) {
    const session = await this.prisma.refreshToken.findUnique({
      where: { id: sessionId },
    });
    if (!session || session.userId !== userId)
      throw new ForbiddenException('Session not found');
    await this.prisma.refreshToken.update({
      where: { id: sessionId },
      data: { revokedAt: new Date() },
    });
  }

  // ── Notification Preferences ──────────────────────────────────────────
  async getNotificationPreferences(userId: string) {
    return this.prisma.notificationSettings.upsert({
      where: { userId },
      create: { userId },
      update: {},
    });
  }

  async updateNotificationPreferences(
    userId: string,
    dto: UpdateNotificationPrefsDto,
  ) {
    return this.prisma.notificationSettings.upsert({
      where: { userId },
      create: { userId, ...dto },
      update: dto,
    });
  }

  // ── Username lookup ───────────────────────────────────────────────
  async getUserByUsername(username: string) {
    const user = await this.prisma.user.findUnique({
      where: { name: username },
      select: {
        id: true,
        name: true,
        avatarUrl: true,
        bio: true,
        ar_bio: true,
        role: true,
        createdAt: true,
        _count: { select: { badges: true, achievements: true } },
      },
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  // ── Soft delete ────────────────────────────────────────────────
  async softDeleteAccount(userId: string, reason?: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        isActive: false,
        deletedAt: new Date(),
        deletionReason: reason ?? null,
        refreshTokens: {
          updateMany: {
            where: { revokedAt: null },
            data: { revokedAt: new Date() },
          },
        },
      },
    });
  }

  // ── GDPR Export ──────────────────────────────────────────────
  async exportUserData(userId: string) {
    const [user, points, stats, achievements, badges, goals] =
      await this.prisma.$transaction([
        this.prisma.user.findUnique({
          where: { id: userId },
          select: {
            id: true,
            name: true,
            email: true,
            bio: true,
            createdAt: true,
            lastLoginAt: true,
            socialLinks: true,
            education: true,
            certifications: true,
          },
        }),
        this.prisma.userPoints.findUnique({ where: { userId } }),
        this.prisma.userStats.findUnique({ where: { userId } }),
        this.prisma.userAchievement.findMany({
          where: { userId },
          include: { achievement: { select: { title: true } } },
        }),
        this.prisma.userBadge.findMany({
          where: { userId },
          include: { badge: { select: { title: true } } },
        }),
        this.prisma.goal.findMany({ where: { userId } }),
      ]);

    return { user, points, stats, achievements, badges, goals };
  }
}
