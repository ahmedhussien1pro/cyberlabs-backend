import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../../core/database';
import { UpdateProfileDto, UserQueryDto, ChangePasswordDto } from '../dto';
import { UserProfileSerializer, UserStatsSerializer } from '../serializers';
import { plainToClass } from 'class-transformer';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get user profile by ID
   */
  async getUserProfile(userId: string): Promise<UserProfileSerializer> {
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
        // Exclude sensitive fields
        password: false,
        refreshToken: false,
        twoFactorSecret: false,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return plainToClass(UserProfileSerializer, user, {
      excludeExtraneousValues: true,
    });
  }

  /**
   * Update user profile
   */
  async updateProfile(
    userId: string,
    updateData: UpdateProfileDto,
  ): Promise<UserProfileSerializer> {
    // Check if user exists
    const existingUser = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      throw new NotFoundException('User not found');
    }

    // If updating name, check uniqueness
    if (updateData.name && updateData.name !== existingUser.name) {
      const nameExists = await this.prisma.user.findUnique({
        where: { name: updateData.name },
      });

      if (nameExists) {
        throw new BadRequestException('Username already taken');
      }
    }

    // Update user
    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...updateData,
        birthday: updateData.birthday
          ? new Date(updateData.birthday)
          : undefined,
        updatedAt: new Date(),
      },
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
      },
    });

    return plainToClass(UserProfileSerializer, updatedUser, {
      excludeExtraneousValues: true,
    });
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
}
