import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../../core/database';
import { GetNotificationsDto, NotificationTab } from '../dto';

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  // ── GET /notifications ─────────────────────────────────────────────
  async getNotifications(userId: string, query: GetNotificationsDto) {
    const { tab, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const isArchived = tab === NotificationTab.ARCHIVED;

    const [notifications, total, unreadCount] = await this.prisma.$transaction([
      this.prisma.notification.findMany({
        where: { userId, isArchived },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
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
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  // ── PATCH /notifications/:id/read ──────────────────────────────────
  async markAsRead(userId: string, notificationId: string) {
    await this._assertOwnership(userId, notificationId);
    await this.prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });
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
    await this._assertOwnership(userId, notificationId);
    await this.prisma.notification.update({
      where: { id: notificationId },
      data: { isArchived: true, isRead: true },
    });
    return { success: true };
  }

  // ── DELETE /notifications/:id ─────────────────────────────────────
  async deleteOne(userId: string, notificationId: string) {
    await this._assertOwnership(userId, notificationId);
    await this.prisma.notification.delete({ where: { id: notificationId } });
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

  // ── Private helpers ───────────────────────────────────────────────
  private async _assertOwnership(userId: string, notificationId: string) {
    const notification = await this.prisma.notification.findUnique({
      where: { id: notificationId },
      select: { userId: true },
    });
    if (!notification) throw new NotFoundException('Notification not found');
    if (notification.userId !== userId)
      throw new ForbiddenException('Access denied');
    return notification;
  }
}
