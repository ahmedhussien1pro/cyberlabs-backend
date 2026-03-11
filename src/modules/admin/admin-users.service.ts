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
import { UserActivityQueryDto } from './dto/user-activity-query.dto';

@Injectable()
export class AdminUsersService {
  constructor(private readonly prisma: PrismaService) {}

  // ── GET /admin/users ─────────────────────────────────────────────────────
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
    if (role)                    where.role     = role;
    if (isActive !== undefined)  where.isActive = isActive;

    const [users, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where, skip, take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true, name: true, email: true, avatarUrl: true,
          role: true, internalRole: true, isActive: true,
          isEmailVerified: true, createdAt: true, lastLoginAt: true,
          security: { select: { isSuspended: true, suspensionReason: true, suspendedAt: true } },
          points:   { select: { totalPoints: true, totalXP: true, level: true } },
          _count:   { select: { enrollments: true, labProgress: true, badges: true } },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return { data: users, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  // ── GET /admin/users/stats ────────────────────────────────────────────────
  async getStats() {
    const now             = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      total, newThisMonth, suspended,
      roleAdmin, roleUser, roleStudent, roleInstructor, roleContentCreator,
    ] = await this.prisma.$transaction([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { createdAt: { gte: firstDayOfMonth } } }),
      this.prisma.userSecurity.count({ where: { isSuspended: true } }),
      this.prisma.user.count({ where: { role: Role.ADMIN } }),
      this.prisma.user.count({ where: { role: Role.USER } }),
      this.prisma.user.count({ where: { role: Role.STUDENT } }),
      this.prisma.user.count({ where: { role: Role.INSTRUCTOR } }),
      this.prisma.user.count({ where: { role: Role.CONTENT_CREATOR } }),
    ]);

    return {
      total, newThisMonth, suspended,
      byRole: {
        [Role.ADMIN]:           roleAdmin,
        [Role.USER]:            roleUser,
        [Role.STUDENT]:         roleStudent,
        [Role.INSTRUCTOR]:      roleInstructor,
        [Role.CONTENT_CREATOR]: roleContentCreator,
      },
    };
  }

  // ── GET /admin/users/:id ──────────────────────────────────────────────────
  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true, name: true, email: true, avatarUrl: true,
        role: true, internalRole: true, isActive: true,
        isVerified: true, isEmailVerified: true, twoFactorEnabled: true,
        createdAt: true, updatedAt: true, lastLoginAt: true,
        failedLoginAttempts: true, lockedUntil: true,
        deletedAt: true, deletionReason: true,
        security: {
          select: {
            isSuspended: true, suspensionReason: true, suspendedAt: true,
            loginAttempts: true, lockedUntil: true,
          },
        },
        points: { select: { totalPoints: true, totalXP: true, level: true } },
        subscriptions: {
          where: { isActive: true },
          select: {
            id: true, status: true, billingCycle: true, currentPeriodEnd: true,
            plan: { select: { name: true, price: true } },
          },
          orderBy: { startDate: 'desc' },
          take: 1,
        },
        _count: { select: { enrollments: true, labProgress: true, badges: true, achievements: true } },
      },
    });

    if (!user) throw new NotFoundException(`User with id "${id}" not found`);
    return user;
  }

  // ── GET /admin/users/:id/activity ─────────────────────────────────────────
  async getActivity(id: string, query: UserActivityQueryDto) {
    const { page = 1, limit = 20, type } = query;
    const skip = (page - 1) * limit;

    const user = await this.prisma.user.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!user) throw new NotFoundException(`User with id "${id}" not found`);

    const [enrollments, labProgress, badges, notifications] = await this.prisma.$transaction([
      (!type || type === 'enrollment')
        ? this.prisma.enrollment.findMany({
            where: { userId: id },
            select: {
              id: true, createdAt: true,
              // 'status' does not exist on Enrollment model — using isCompleted instead
              isCompleted: true,
              course: { select: { id: true, title: true, thumbnail: true } },
            },
            orderBy: { createdAt: 'desc' },
            take: limit * 3,
          })
        : Promise.resolve([]),

      (!type || type === 'lab')
        ? this.prisma.userLabProgress.findMany({
            where: { userId: id },
            select: {
              id: true, lastAccess: true, flagSubmitted: true, completedAt: true,
              lab: { select: { id: true, title: true } },
            },
            orderBy: { lastAccess: 'desc' },
            take: limit * 3,
          })
        : Promise.resolve([]),

      (!type || type === 'badge')
        ? this.prisma.userBadge.findMany({
            where: { userId: id },
            select: {
              id: true, awardedAt: true,
              badge: { select: { id: true, title: true, iconUrl: true } },
            },
            orderBy: { awardedAt: 'desc' },
            take: limit * 3,
          })
        : Promise.resolve([]),

      (!type || type === 'notification')
        ? this.prisma.notification.findMany({
            where: { userId: id },
            select: { id: true, createdAt: true, type: true, title: true, isRead: true },
            orderBy: { createdAt: 'desc' },
            take: limit * 3,
          })
        : Promise.resolve([]),
    ]);

    // Normalize into a unified timeline
    const items: any[] = [
      ...enrollments.map((e: any) => ({
        id: e.id, type: 'enrollment',
        date: e.createdAt,
        title: `Enrolled in "${e.course?.title ?? 'course'}"`,
        meta: {
          courseId:  e.course?.id,
          status:    e.isCompleted ? 'completed' : 'active',
          thumbnail: e.course?.thumbnail,
        },
      })),
      ...labProgress.map((l: any) => ({
        id: l.id, type: 'lab',
        date: l.lastAccess ?? l.completedAt,
        title: `Lab activity: "${l.lab?.title ?? 'lab'}"`,
        meta: {
          labId:  l.lab?.id,
          status: l.completedAt ? 'completed' : l.flagSubmitted ? 'flag_submitted' : 'in_progress',
        },
      })),
      ...badges.map((b: any) => ({
        id: b.id, type: 'badge',
        date: b.awardedAt,
        title: `Earned badge: "${b.badge?.title ?? 'badge'}"`,
        meta: { badgeId: b.badge?.id, icon: b.badge?.iconUrl },
      })),
      ...notifications.map((n: any) => ({
        id: n.id, type: 'notification',
        date: n.createdAt,
        title: n.title,
        meta: { notificationType: n.type, isRead: n.isRead },
      })),
    ];

    items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const paginated = items.slice(skip, skip + limit);

    return {
      data: { items: paginated, total: items.length },
      meta: { page, limit, total: items.length, totalPages: Math.ceil(items.length / limit) },
    };
  }

  // ── PATCH /admin/users/:id/role ───────────────────────────────────────────
  async updateRole(adminId: string, targetId: string, dto: UpdateUserRoleDto) {
    if (adminId === targetId) throw new ForbiddenException('You cannot change your own role');

    const target = await this.prisma.user.findUnique({
      where: { id: targetId }, select: { id: true, name: true, role: true },
    });
    if (!target) throw new NotFoundException(`User with id "${targetId}" not found`);

    if (target.role === Role.ADMIN && dto.role !== Role.ADMIN) {
      const adminCount = await this.prisma.user.count({ where: { role: Role.ADMIN } });
      if (adminCount <= 1) throw new BadRequestException('Cannot demote the last administrator');
    }

    return this.prisma.user.update({
      where: { id: targetId },
      data:  { role: dto.role },
      select: { id: true, name: true, email: true, role: true },
    });
  }

  // ── PATCH /admin/users/:id/suspend ────────────────────────────────────────
  async suspend(adminId: string, targetId: string, dto: SuspendUserDto) {
    if (adminId === targetId) throw new ForbiddenException('You cannot suspend yourself');

    const target = await this.prisma.user.findUnique({
      where: { id: targetId }, select: { id: true, name: true, role: true },
    });
    if (!target) throw new NotFoundException(`User with id "${targetId}" not found`);
    if (target.role === Role.ADMIN) throw new ForbiddenException('Cannot suspend another administrator');

    await this.prisma.userSecurity.upsert({
      where:  { userId: targetId },
      create: { userId: targetId, isSuspended: true, suspensionReason: dto.reason ?? null, suspendedAt: new Date() },
      update: { isSuspended: true, suspensionReason: dto.reason ?? null, suspendedAt: new Date() },
    });

    await this.prisma.refreshToken.updateMany({
      where: { userId: targetId, revokedAt: null },
      data:  { revokedAt: new Date() },
    });

    return { success: true, message: `User "${target.name}" has been suspended` };
  }

  // ── PATCH /admin/users/:id/unsuspend ─────────────────────────────────────
  async unsuspend(adminId: string, targetId: string) {
    void adminId;

    const target = await this.prisma.user.findUnique({
      where: { id: targetId }, select: { id: true, name: true },
    });
    if (!target) throw new NotFoundException(`User with id "${targetId}" not found`);

    await this.prisma.userSecurity.upsert({
      where:  { userId: targetId },
      create: { userId: targetId, isSuspended: false },
      update: { isSuspended: false, suspensionReason: null, suspendedAt: null },
    });

    return { success: true, message: `User "${target.name}" has been unsuspended` };
  }
}
