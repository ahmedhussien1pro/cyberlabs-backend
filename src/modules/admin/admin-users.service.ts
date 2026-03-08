import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../../core/database';
import { AdminUserQueryDto } from './dto/admin-user-query.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { SuspendUserDto } from './dto/suspend-user.dto';

@Injectable()
export class AdminUsersService {
  constructor(private readonly prisma: PrismaService) {}

  // ─────────────────────────────────────────────────────────────────
  // GET /admin/users  — paginated, filterable user list
  // ─────────────────────────────────────────────────────────────────
  async findAll(query: AdminUserQueryDto) {
    const { page = 1, limit = 20, search, role, isActive } = query;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (role) where.role = role;
    if (isActive !== undefined) where.isActive = isActive;

    const [users, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          email: true,
          avatarUrl: true,
          role: true,
          internalRole: true,
          isActive: true,
          isEmailVerified: true,
          createdAt: true,
          lastLoginAt: true,
          security: {
            select: {
              isSuspended: true,
              suspensionReason: true,
              suspendedAt: true,
            },
          },
          points: {
            select: { totalPoints: true, totalXP: true, level: true },
          },
          _count: {
            select: {
              enrollments: true,
              labProgress: true,
              badges: true,
            },
          },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

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

  // ─────────────────────────────────────────────────────────────────
  // GET /admin/users/stats  — platform-wide user statistics
  // ─────────────────────────────────────────────────────────────────
  async getStats() {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [total, byRole, newThisMonth, suspended] =
      await this.prisma.$transaction([
        this.prisma.user.count(),
        this.prisma.user.groupBy({
          by: ['role'],
          _count: { id: true },
        }),
        this.prisma.user.count({
          where: { createdAt: { gte: firstDayOfMonth } },
        }),
        this.prisma.userSecurity.count({
          where: { isSuspended: true },
        }),
      ]);

    return {
      total,
      newThisMonth,
      suspended,
      byRole: byRole.reduce(
        (acc, entry) => ({ ...acc, [entry.role]: entry._count.id }),
        {} as Record<string, number>,
      ),
    };
  }

  // ─────────────────────────────────────────────────────────────────
  // GET /admin/users/:id  — full user detail (no passwords exposed)
  // ─────────────────────────────────────────────────────────────────
  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
        role: true,
        internalRole: true,
        isActive: true,
        isVerified: true,
        isEmailVerified: true,
        twoFactorEnabled: true,
        createdAt: true,
        updatedAt: true,
        lastLoginAt: true,
        failedLoginAttempts: true,
        lockedUntil: true,
        deletedAt: true,
        deletionReason: true,
        security: {
          select: {
            isSuspended: true,
            suspensionReason: true,
            suspendedAt: true,
            loginAttempts: true,
            lockedUntil: true,
          },
        },
        points: {
          select: { totalPoints: true, totalXP: true, level: true },
        },
        subscriptions: {
          where: { isActive: true },
          select: {
            id: true,
            status: true,
            billingCycle: true,
            currentPeriodEnd: true,
            plan: { select: { name: true, price: true } },
          },
          orderBy: { startDate: 'desc' },
          take: 1,
        },
        _count: {
          select: {
            enrollments: true,
            labProgress: true,
            badges: true,
            achievements: true,
          },
        },
      },
    });

    if (!user) throw new NotFoundException(`User with id "${id}" not found`);
    return user;
  }

  // ─────────────────────────────────────────────────────────────────
  // PATCH /admin/users/:id/role  — change a user's role
  // ─────────────────────────────────────────────────────────────────
  async updateRole(
    adminId: string,
    targetId: string,
    dto: UpdateUserRoleDto,
  ) {
    if (adminId === targetId) {
      throw new ForbiddenException('You cannot change your own role');
    }

    const target = await this.prisma.user.findUnique({
      where: { id: targetId },
      select: { id: true, name: true, role: true },
    });

    if (!target) {
      throw new NotFoundException(`User with id "${targetId}" not found`);
    }

    // Prevent demoting the last admin
    if (target.role === Role.ADMIN && dto.role !== Role.ADMIN) {
      const adminCount = await this.prisma.user.count({
        where: { role: Role.ADMIN },
      });
      if (adminCount <= 1) {
        throw new BadRequestException('Cannot demote the last administrator');
      }
    }

    return this.prisma.user.update({
      where: { id: targetId },
      data: { role: dto.role },
      select: { id: true, name: true, email: true, role: true },
    });
  }

  // ─────────────────────────────────────────────────────────────────
  // PATCH /admin/users/:id/suspend  — suspend + revoke sessions
  // ─────────────────────────────────────────────────────────────────
  async suspend(
    adminId: string,
    targetId: string,
    dto: SuspendUserDto,
  ) {
    if (adminId === targetId) {
      throw new ForbiddenException('You cannot suspend yourself');
    }

    const target = await this.prisma.user.findUnique({
      where: { id: targetId },
      select: { id: true, name: true, role: true },
    });

    if (!target) {
      throw new NotFoundException(`User with id "${targetId}" not found`);
    }

    if (target.role === Role.ADMIN) {
      throw new ForbiddenException('Cannot suspend another administrator');
    }

    // Upsert UserSecurity record with suspended state
    await this.prisma.userSecurity.upsert({
      where: { userId: targetId },
      create: {
        userId: targetId,
        isSuspended: true,
        suspensionReason: dto.reason ?? null,
        suspendedAt: new Date(),
      },
      update: {
        isSuspended: true,
        suspensionReason: dto.reason ?? null,
        suspendedAt: new Date(),
      },
    });

    // Revoke all active refresh tokens to force logout immediately
    await this.prisma.refreshToken.updateMany({
      where: { userId: targetId, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    return {
      success: true,
      message: `User "${target.name}" has been suspended`,
    };
  }

  // ─────────────────────────────────────────────────────────────────
  // PATCH /admin/users/:id/unsuspend  — lift suspension
  // ─────────────────────────────────────────────────────────────────
  async unsuspend(adminId: string, targetId: string) {
    // adminId param kept for future audit log injection
    void adminId;

    const target = await this.prisma.user.findUnique({
      where: { id: targetId },
      select: { id: true, name: true },
    });

    if (!target) {
      throw new NotFoundException(`User with id "${targetId}" not found`);
    }

    await this.prisma.userSecurity.upsert({
      where: { userId: targetId },
      create: { userId: targetId, isSuspended: false },
      update: {
        isSuspended: false,
        suspensionReason: null,
        suspendedAt: null,
      },
    });

    return {
      success: true,
      message: `User "${target.name}" has been unsuspended`,
    };
  }
}
