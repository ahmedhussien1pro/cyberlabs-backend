import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../core/database';
import { GetNotificationsDto, NotificationTab } from '../dto';

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  // ── GET /notifications ─────────────────────────────────────────────
  async getNotifications(userId: string, query: GetNotificationsDto) {
    const { tab, page = 1, limit = 20 } = query;
    const safeLimit = Math.min(Number(limit), 50); // Prevent huge queries
    const skip = (Math.max(Number(page), 1) - 1) * safeLimit;

    const isArchived = tab === NotificationTab.ARCHIVED;

    const [notifications, total, unreadCount] = await this.prisma.$transaction([
      this.prisma.notification.findMany({
        where: { userId, isArchived },
        orderBy: { createdAt: 'desc' },
        skip,
        take: safeLimit,
        select: {
          id: true,
          type: true,
          title: true,
          ar_title: true,
          body: true,
          ar_body: true,
          isRead: true,
          isArchived: true,
          actionUrl: true,
          priority: true,
          createdAt: true,
        },
      }),
      this.prisma.notification.count({ where: { userId, isArchived } }),
      this.prisma.notification.count({
        where: { userId, isRead: false, isArchived: false },
      }),
    ]);

    return {
      notifications,
      unreadCount,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / safeLimit) || 1,
    };
  }

  // ── PATCH /notifications/:id/read ──────────────────────────────────
  async markAsRead(userId: string, notificationId: string) {
    const result = await this.prisma.notification.updateMany({
      where: { id: notificationId, userId },
      data: { isRead: true },
    });

    if (result.count === 0) {
      throw new NotFoundException('Notification not found or access denied');
    }

    return { success: true };
  }

  // ── PATCH /notifications/read-all ──────────────────────────────────
  async markAllRead(userId: string) {
    const { count } = await this.prisma.notification.updateMany({
      where: { userId, isRead: false, isArchived: false },
      data: { isRead: true },
    });
    return { success: true, updated: count };
  }

  // ── PATCH /notifications/:id/archive ──────────────────────────────
  async archive(userId: string, notificationId: string) {
    const result = await this.prisma.notification.updateMany({
      where: { id: notificationId, userId },
      data: { isArchived: true, isRead: true },
    });

    if (result.count === 0) {
      throw new NotFoundException('Notification not found or access denied');
    }

    return { success: true };
  }

  // ── DELETE /notifications/:id ─────────────────────────────────────
  async deleteOne(userId: string, notificationId: string) {
    const result = await this.prisma.notification.deleteMany({
      where: { id: notificationId, userId },
    });

    if (result.count === 0) {
      throw new NotFoundException('Notification not found or access denied');
    }

    return { success: true };
  }

  // ── Internal: create notification (called by other services) ──────
  async createNotification(data: {
    userId: string;
    type: string;
    title: string;
    ar_title?: string;
    body?: string;
    ar_body?: string;
    actionUrl?: string;
    priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  }) {
    return this.prisma.notification.create({ data });
  }
  async clearAll(userId: string) {
    return this.prisma.notification.deleteMany({ where: { userId } });
  }
}
