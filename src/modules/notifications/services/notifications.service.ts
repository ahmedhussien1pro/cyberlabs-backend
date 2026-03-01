import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../core/database';
import { GetNotificationsDto, NotificationTab } from '../dto';
import { NotificationsGateway } from '../gateways/notifications.gateway';
import { NotificationPayload } from '../notifications.events';
import { NotificationPriority } from '@prisma/client';

@Injectable()
export class NotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gateway: NotificationsGateway, // ← inject gateway
  ) {}

  // ── Core: create + push realtime ───────────────────────────────────
  async notify(userId: string, payload: NotificationPayload) {
    const notification = await this.prisma.notification.create({
      data: {
        userId,
        type: payload.type,
        title: payload.title,
        ar_title: payload.ar_title,
        body: payload.body,
        ar_body: payload.ar_body,
        actionUrl: payload.actionUrl,
        priority: payload.priority ?? NotificationPriority.MEDIUM,
      },
    });

    // Push realtime (fire-and-forget — لو الـ user مش online مش مشكلة)
    try {
      this.gateway.sendToUser(userId, notification);
    } catch {
      // silently ignore if socket server not ready
    }

    return notification;
  }

  // ── Keep for backwards compatibility ─────────────────────────────
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
    return this.notify(data.userId, {
      type: data.type,
      title: data.title,
      ar_title: data.ar_title ?? data.title,
      body: data.body,
      ar_body: data.ar_body,
      actionUrl: data.actionUrl,
      priority: (data.priority ?? 'MEDIUM') as NotificationPriority,
    });
  }

  // ── GET /notifications ──────────────────────────────────────────────
  async getNotifications(userId: string, query: GetNotificationsDto) {
    const { tab, page = 1, limit = 20 } = query;
    const safeLimit = Math.min(Number(limit), 50);
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

  async markAsRead(userId: string, notificationId: string) {
    const result = await this.prisma.notification.updateMany({
      where: { id: notificationId, userId },
      data: { isRead: true },
    });
    if (result.count === 0)
      throw new NotFoundException('Notification not found or access denied');
    return { success: true };
  }

  async markAllRead(userId: string) {
    const { count } = await this.prisma.notification.updateMany({
      where: { userId, isRead: false, isArchived: false },
      data: { isRead: true },
    });
    return { success: true, updated: count };
  }

  async archive(userId: string, notificationId: string) {
    const result = await this.prisma.notification.updateMany({
      where: { id: notificationId, userId },
      data: { isArchived: true, isRead: true },
    });
    if (result.count === 0)
      throw new NotFoundException('Notification not found or access denied');
    return { success: true };
  }

  async deleteOne(userId: string, notificationId: string) {
    const result = await this.prisma.notification.deleteMany({
      where: { id: notificationId, userId },
    });
    if (result.count === 0)
      throw new NotFoundException('Notification not found or access denied');
    return { success: true };
  }

  async clearAll(userId: string) {
    return this.prisma.notification.deleteMany({ where: { userId } });
  }
}
