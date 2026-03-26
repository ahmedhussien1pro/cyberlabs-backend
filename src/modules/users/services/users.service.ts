import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../core/database';
import {
  UpdateProfileDto,
  UserQueryDto,
  ChangePasswordDto,
  UserActivityDto,
  UpdateNotificationPrefsDto,
  DeleteAccountDto,
  UpsertEducationDto,
} from '../dto';
import { UserStatsSerializer } from '../serializers';
import { R2Service } from '../../../core/storage';
import { ConfigService } from '@nestjs/config';
import { plainToClass } from 'class-transformer';

function calcLevel(totalXP: number): number {
  return Math.floor(totalXP / 1000) + 1;
}

function calcStreak(dates: Date[]): number {
  if (dates.length === 0) return 0;
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

  if (uniqueDates[0] !== todayStr && uniqueDates[0] !== yesterdayStr) return 0;

  let streak = 0;
  const cursor = new Date(uniqueDates[0]);
  for (const dateStr of uniqueDates) {
    if (dateStr === cursor.toISOString().slice(0, 10)) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    } else break;
  }
  return streak;
}

// ── Shared Prisma select for public profile fields ─────────────────────
const PUBLIC_PROFILE_SELECT = {
  id: true,
  name: true,
  avatarUrl: true,
  bio: true,
  ar_bio: true,
  role: true,
  createdAt: true,
  socialLinks: { select: { id: true, type: true, url: true } },
  skills: {
    select: {
      id: true, level: true, progress: true,
      skill: { select: { id: true, name: true, ar_name: true, category: true } },
    },
  },
  education: {
    select: {
      id: true, institution: true, ar_institution: true,
      degree: true, field: true, startYear: true, endYear: true, isCurrent: true,
    },
    orderBy: { startYear: 'desc' as const },
  },
  certifications: {
    select: {
      id: true, title: true, issuer: true, issueDate: true,
      expireDate: true, credentialId: true, credentialUrl: true,
    },
    orderBy: { issueDate: 'desc' as const },
  },
  badges: {
    select: {
      id: true, awardedAt: true, context: true,
      badge: {
        select: {
          slug: true, title: true, ar_title: true, description: true,
          iconUrl: true, type: true, xpReward: true,
        },
      },
    },
    orderBy: { awardedAt: 'desc' as const },
  },
  achievements: {
    select: {
      id: true, achievedAt: true, progress: true,
      achievement: {
        select: {
          title: true, ar_title: true, description: true, ar_description: true,
          iconUrl: true, category: true, xpReward: true,
        },
      },
    },
  },
  careerPaths: {
    select: {
      id: true, progress: true, startedAt: true, completedAt: true,
      careerPath: {
        select: {
          id: true, name: true, ar_name: true,
          description: true, ar_description: true, iconUrl: true,
        },
      },
    },
  },
} satisfies Prisma.UserSelect;

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private r2: R2Service,
    private config: ConfigService,
  ) {}

  // ── Private profile (owner only) ──────────────────────────────────────
  async getUserProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        ...PUBLIC_PROFILE_SELECT,
        email: true,
        address: true,
        birthday: true,
        phoneNumber: true,
        preferences: true,
        internalRole: true,
        isVerified: true,
        isEmailVerified: true,
        isActive: true,
        lastLoginAt: true,
        twoFactorSecret: false,
      },
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  // ── Public profile (no auth required) — profile + stats in ONE query ──
  async getPublicProfile(userId: string) {
    const [user, enrolledCourses, completedCourses, completedLabs, labTimes, activityDates] =
      await this.prisma.$transaction([
        this.prisma.user.findUnique({
          where: { id: userId },
          select: {
            ...PUBLIC_PROFILE_SELECT,
            points: { select: { totalPoints: true, totalXP: true, level: true } },
          },
        }),
        this.prisma.enrollment.count({ where: { userId } }),
        this.prisma.enrollment.count({ where: { userId, isCompleted: true } }),
        this.prisma.userLabProgress.count({ where: { userId, completedAt: { not: null } } }),
        this.prisma.userLabProgress.findMany({
          where: { userId, completedAt: { not: null } },
          select: { startedAt: true, completedAt: true },
        }),
        this.prisma.userActivity.findMany({
          where: { userId },
          select: { date: true },
          orderBy: { date: 'desc' },
        }),
      ]);

    if (!user) throw new NotFoundException('User not found');

    const totalMinutes = labTimes.reduce((sum, lab) => {
      if (!lab.completedAt) return sum;
      const diff = (lab.completedAt.getTime() - lab.startedAt.getTime()) / 60_000;
      return sum + Math.max(0, Math.min(diff, 300));
    }, 0);

    const currentStreak = calcStreak(activityDates.map((a) => a.date));

    const stats = {
      totalPoints: user.points?.totalPoints ?? 0,
      totalXP: user.points?.totalXP ?? 0,
      level: user.points?.level ?? 1,
      enrolledCourses,
      completedCourses,
      completedLabs,
      badgesCount: user.badges.length,
      certificationsCount: user.certifications.length,
      totalHours: Math.round((totalMinutes / 60) * 10) / 10,
      activeDays: activityDates.length,
      currentStreak,
    };

    const { points: _points, ...profile } = user;
    return { ...profile, stats };
  }

  // ── Update profile ─────────────────────────────────────────────────────
  async updateProfile(userId: string, updateData: UpdateProfileDto) {
    const existingUser = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!existingUser) throw new NotFoundException('User not found');

    if (updateData.name && updateData.name !== existingUser.name) {
      const nameExists = await this.prisma.user.findUnique({ where: { name: updateData.name } });
      if (nameExists) throw new BadRequestException('Username already taken');
    }

    const { socialLinks, preferences, ...profileFields } = updateData;

    let birthdayValue: Date | null | undefined;
    if (profileFields.birthday === null) birthdayValue = null;
    else if (profileFields.birthday) birthdayValue = new Date(profileFields.birthday);
    else birthdayValue = undefined;

    const { birthday: _bday, ...restFields } = profileFields;

    const [updatedUser] = await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: {
          ...restFields,
          ...(preferences !== undefined && { preferences: preferences as Prisma.InputJsonValue }),
          birthday: birthdayValue,
          updatedAt: new Date(),
        },
      }),
      ...(socialLinks !== undefined
        ? [
            this.prisma.socialLink.deleteMany({ where: { userId } }),
            ...(socialLinks.length > 0
              ? [this.prisma.socialLink.createMany({
                  data: socialLinks.map((l) => ({ userId, type: l.type, url: l.url })),
                })]
              : []),
          ]
        : []),
    ]);

    return this.getUserProfile(updatedUser.id);
  }

  // ── Upsert Education ───────────────────────────────────────────────────
  async upsertEducation(userId: string, dto: UpsertEducationDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    // Delete removed entries (those not present in dto)
    const incomingIds = dto.education.filter((e) => e.id).map((e) => e.id!);
    await this.prisma.education.deleteMany({
      where: { userId, id: { notIn: incomingIds } },
    });

    // Upsert each entry
    await Promise.all(
      dto.education.map((item) => {
        const data = {
          userId,
          institution: item.institution,
          ar_institution: item.ar_institution ?? null,
          degree: item.degree ?? null,
          field: item.field ?? null,
          startYear: item.startYear ?? null,
          endYear: item.endYear ?? null,
          isCurrent: item.isCurrent ?? false,
        };
        if (item.id) {
          return this.prisma.education.update({ where: { id: item.id }, data });
        }
        return this.prisma.education.create({ data });
      }),
    );

    return this.getUserProfile(userId);
  }

  // ── Stats ──────────────────────────────────────────────────────────────
  async getUserStats(userId: string): Promise<UserStatsSerializer> {
    const [user, enrolledCourses, completedCourses, completedLabs, labTimes, activityDates] =
      await this.prisma.$transaction([
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
        this.prisma.userLabProgress.count({ where: { userId, completedAt: { not: null } } }),
        this.prisma.userLabProgress.findMany({
          where: { userId, completedAt: { not: null } },
          select: { startedAt: true, completedAt: true },
        }),
        this.prisma.userActivity.findMany({
          where: { userId },
          select: { date: true },
          orderBy: { date: 'desc' },
        }),
      ]);

    if (!user) throw new NotFoundException('User not found');

    const totalMinutes = labTimes.reduce((sum, lab) => {
      if (!lab.completedAt) return sum;
      const diff = (lab.completedAt.getTime() - lab.startedAt.getTime()) / 60_000;
      return sum + Math.max(0, Math.min(diff, 300));
    }, 0);

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

    return plainToClass(UserStatsSerializer, stats, { excludeExtraneousValues: true });
  }

  async getAllUsers(query: UserQueryDto) {
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc', search } = query;
    const skip = (page - 1) * limit;
    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }
    const users = await this.prisma.user.findMany({
      where, skip, take: limit,
      orderBy: { [sortBy]: sortOrder },
      select: {
        id: true, name: true, email: true, avatarUrl: true,
        role: true, internalRole: true, isVerified: true, isActive: true, createdAt: true,
        points: { select: { totalPoints: true, totalXP: true, level: true } },
      },
    });
    const total = await this.prisma.user.count({ where });
    return { data: users, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async getUserEnrolledCourses(userId: string) {
    const enrollments = await this.prisma.enrollment.findMany({
      where: { userId },
      include: {
        course: { select: { id: true, title: true, ar_title: true, thumbnail: true, difficulty: true, duration: true } },
      },
      orderBy: { enrolledAt: 'desc' },
    });
    return enrollments.map((e) => ({
      id: e.id, course: e.course, progress: e.progress,
      isCompleted: e.isCompleted, enrolledAt: e.enrolledAt, lastAccessedAt: e.lastAccessedAt,
    }));
  }

  async getUserCompletedLabs(userId: string) {
    const labProgress = await this.prisma.userLabProgress.findMany({
      where: { userId, completedAt: { not: null } },
      include: {
        lab: { select: { id: true, title: true, ar_title: true, difficulty: true, pointsReward: true, xpReward: true } },
      },
      orderBy: { completedAt: 'desc' },
    });
    return labProgress.map((p) => ({
      id: p.id, lab: p.lab, attempts: p.attempts,
      hintsUsed: p.hintsUsed, startedAt: p.startedAt, completedAt: p.completedAt,
    }));
  }

  async changePassword(userId: string, changePasswordDto: ChangePasswordDto): Promise<void> {
    const { currentPassword, newPassword } = changePasswordDto;
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { id: true, password: true } });
    if (!user) throw new NotFoundException('User not found');
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) throw new BadRequestException('Current password is incorrect');
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.prisma.user.update({ where: { id: userId }, data: { password: hashedPassword, updatedAt: new Date() } });
  }

  async getUserPoints(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, include: { points: true } });
    if (!user) throw new NotFoundException('User not found');
    let points = user.points;
    if (!points) points = await this.prisma.userPoints.create({ data: { userId, totalPoints: 0, totalXP: 0, level: 1 } });
    const correctLevel = calcLevel(points.totalXP);
    if (correctLevel !== points.level) {
      points = await this.prisma.userPoints.update({ where: { userId }, data: { level: correctLevel } });
    }
    const xpForNextLevel = points.level * 1000;
    const xpIntoCurrentLevel = points.totalXP - (points.level - 1) * 1000;
    return {
      totalPoints: points.totalPoints, totalXP: points.totalXP, level: points.level,
      xpIntoCurrentLevel, xpNeededForLevel: 1000, xpForNextLevel,
      levelProgress: Math.min(Math.round((xpIntoCurrentLevel / 1000) * 100), 100),
      pointsToNextLevel: Math.max(0, xpForNextLevel - points.totalXP),
    };
  }

  async getUserActivity(userId: string): Promise<UserActivityDto[]> {
    const since = new Date();
    since.setFullYear(since.getFullYear() - 1);
    const activities = await this.prisma.userActivity.findMany({
      where: { userId, date: { gte: since } },
      select: { date: true, activeMinutes: true, completedTasks: true, labsSolved: true },
      orderBy: { date: 'asc' },
    });
    return activities.map((a) => ({
      date: a.date.toISOString(), activeMinutes: a.activeMinutes,
      completedTasks: a.completedTasks, labsSolved: a.labsSolved,
    }));
  }

  async requestAvatarUpload(userId: string, contentType: string) {
    return this.r2.getPresignedUploadUrl(userId, contentType);
  }

  async confirmAvatarUpload(userId: string, key: string): Promise<string> {
    const expectedPrefix = `users/${userId}/avatar/`;
    if (!key.startsWith(expectedPrefix)) throw new BadRequestException('Invalid upload key');
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { avatarUrl: true } });
    if (user?.avatarUrl) {
      const oldKey = this.r2.extractKey(user.avatarUrl);
      if (oldKey) await this.r2.deleteObject(oldKey).catch(() => null);
    }
    const avatarUrl = this.r2.getPublicUrl(key);
    await this.prisma.user.update({ where: { id: userId }, data: { avatarUrl, updatedAt: new Date() } });
    return avatarUrl;
  }

  async getUserSessions(userId: string) {
    return this.prisma.refreshToken.findMany({
      where: { userId, revokedAt: null, expiresAt: { gt: new Date() } },
      select: { id: true, userAgent: true, ip: true, createdAt: true, expiresAt: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async revokeSession(userId: string, sessionId: string) {
    const session = await this.prisma.refreshToken.findUnique({ where: { id: sessionId } });
    if (!session || session.userId !== userId) throw new ForbiddenException('Session not found');
    await this.prisma.refreshToken.update({ where: { id: sessionId }, data: { revokedAt: new Date() } });
  }

  async getNotificationPreferences(userId: string) {
    return this.prisma.notificationSettings.upsert({ where: { userId }, create: { userId }, update: {} });
  }

  async updateNotificationPreferences(userId: string, dto: UpdateNotificationPrefsDto) {
    return this.prisma.notificationSettings.upsert({ where: { userId }, create: { userId, ...dto }, update: dto });
  }

  async getUserByUsername(username: string) {
    const user = await this.prisma.user.findUnique({
      where: { name: username },
      select: {
        id: true, name: true, avatarUrl: true, bio: true, ar_bio: true, role: true, createdAt: true,
        _count: { select: { badges: true, achievements: true } },
      },
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async softDeleteAccount(userId: string, reason?: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        isActive: false, deletedAt: new Date(), deletionReason: reason ?? null,
        refreshTokens: { updateMany: { where: { revokedAt: null }, data: { revokedAt: new Date() } } },
      },
    });
  }

  async exportUserData(userId: string) {
    const [user, points, stats, achievements, badges, goals] = await this.prisma.$transaction([
      this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true, name: true, email: true, bio: true, createdAt: true, lastLoginAt: true,
          socialLinks: true, education: true, certifications: true,
        },
      }),
      this.prisma.userPoints.findUnique({ where: { userId } }),
      this.prisma.userStats.findUnique({ where: { userId } }),
      this.prisma.userAchievement.findMany({ where: { userId }, include: { achievement: { select: { title: true } } } }),
      this.prisma.userBadge.findMany({ where: { userId }, include: { badge: { select: { title: true } } } }),
      this.prisma.goal.findMany({ where: { userId } }),
    ]);
    return { user, points, stats, achievements, badges, goals };
  }
}
