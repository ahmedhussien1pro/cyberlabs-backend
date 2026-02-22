import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../../core/database';
import {
  UpdateProfileDto,
  UserQueryDto,
  ChangePasswordDto,
  UserActivityDto,
} from '../dto';
import { UserStatsSerializer } from '../serializers';
import { R2Service } from '../../../core/storage';
import { ConfigService } from '@nestjs/config';
import { plainToClass } from 'class-transformer';

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
                name: true,
                ar_name: true,
                description: true,
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
   */
  async getUserStats(userId: string): Promise<UserStatsSerializer> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        points: true,
        stats: true,
        badges: {
          select: { id: true },
        },
        certifications: {
          select: { id: true },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Count enrollments
    const enrolledCourses = await this.prisma.enrollment.count({
      where: { userId },
    });

    const completedCourses = await this.prisma.enrollment.count({
      where: { userId, isCompleted: true },
    });

    const completedLabs = await this.prisma.userLabProgress.count({
      where: { userId, completedAt: { not: null } },
    });

    const stats: UserStatsSerializer = {
      id: user.id,
      name: user.name,
      avatarUrl: user.avatarUrl || undefined,
      role: user.role,

      // Points & XP
      totalPoints: user.points?.totalPoints || 0,
      totalXP: user.points?.totalXP || 0,
      level: user.points?.level || 1,

      // Learning stats
      enrolledCourses,
      completedCourses,
      completedLabs,
      badgesCount: user.badges.length,
      certificationsCount: user.certifications.length,

      // Activity stats
      totalHours: user.stats?.totalHours || 0,
      activeDays: user.stats?.activeDays || 0,
      currentStreak: user.stats?.currentStreak || 0,
      longestStreak: user.stats?.longestStreak || 0,
      lastActivityDate: user.stats?.lastActivityDate || undefined,
    };

    return plainToClass(UserStatsSerializer, stats, {
      excludeExtraneousValues: true,
    });
  }

  /**
   * Get all users (with pagination and filters) - Admin only
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

    // Build where clause
    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Get users
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
          select: {
            totalPoints: true,
            totalXP: true,
            level: true,
          },
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
      where: {
        userId,
        completedAt: { not: null },
      },
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

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Verify current password
    const bcrypt = require('bcrypt');
    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password,
    );

    if (!isPasswordValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Get user points
   */
  async getUserPoints(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        points: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Get or create user points
    let points = user.points;
    if (!points) {
      points = await this.prisma.userPoints.create({
        data: {
          userId,
          totalPoints: 0,
          totalXP: 0,
          level: 1,
        },
      });
    }

    // Calculate XP for next level
    const xpForNextLevel = points.level * 1000;
    const pointsToNextLevel = xpForNextLevel - points.totalXP;

    return {
      totalPoints: points.totalPoints,
      totalXP: points.totalXP,
      level: points.level,
      pointsToNextLevel: Math.max(0, pointsToNextLevel),
      xpForNextLevel,
    };
  }

  async getUserActivity(userId: string): Promise<UserActivityDto[]> {
    const since = new Date();
    since.setFullYear(since.getFullYear() - 1);

    const activities = await this.prisma.userActivity.findMany({
      where: {
        userId,
        date: { gte: since },
      },
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

    // Delete old avatar from R2
    if (user?.avatarUrl) {
      const oldKey = this.r2.extractKey(user.avatarUrl);
      if (oldKey) {
        await this.r2.deleteObject(oldKey).catch(() => null); // ignore errors
      }
    }

    const publicUrl = this.config.get<string>('R2_PUBLIC_URL');
    const avatarUrl = `${publicUrl}/${key}`;

    await this.prisma.user.update({
      where: { id: userId },
      data: { avatarUrl, updatedAt: new Date() },
    });

    return avatarUrl;
  }
  // ── Sessions ──────────────────────────────────────────────────────
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

  // ── Notification Preferences ──────────────────────────────────────
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
      where: { name: username }, // `name` is @unique in schema
      select: {
        id: true,
        name: true,
        avatarUrl: true,
        bio: true,
        ar_bio: true,
        role: true,
        createdAt: true,
        _count: {
          select: {
            badges: true,
            achievements: true,
          },
        },
      },
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  // ── Soft delete ───────────────────────────────────────────────────
  async softDeleteAccount(userId: string, reason?: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        isActive: false,
        deletedAt: new Date(),
        deletionReason: reason ?? null,
        // Revoke all sessions
        refreshTokens: {
          updateMany: {
            where: { revokedAt: null },
            data: { revokedAt: new Date() },
          },
        },
      },
    });
  }

  // ── GDPR Export ───────────────────────────────────────────────────
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
