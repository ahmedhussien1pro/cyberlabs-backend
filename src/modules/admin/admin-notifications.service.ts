import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/database';
import { NotificationsGateway } from '../notifications/gateways/notifications.gateway';
import { NotificationPriority } from '@prisma/client';

interface BroadcastDto {
  title: string;
  message: string;
  type?: string;
}

@Injectable()
export class AdminNotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gateway: NotificationsGateway,
  ) {}

  // ── Broadcast to ALL users ────────────────────────────────────────────────
  async broadcast(dto: BroadcastDto, admin?: any) {
    const users = await this.prisma.user.findMany({
      select: { id: true },
    });

    const notifType = dto.type ?? 'INFO';

    // Bulk insert
    await this.prisma.notification.createMany({
      data: users.map((u) => ({
        userId: u.id,
        type: notifType,
        title: dto.title,
        ar_title: dto.title,
        body: dto.message,
        ar_body: dto.message,
        priority: NotificationPriority.HIGH,
      })),
    });

    // Push realtime via WebSocket to all connected users
    try {
      this.gateway.server.emit('notification:broadcast', {
        type: notifType,
        title: dto.title,
        body: dto.message,
      });
    } catch {
      // WebSocket server may not be ready
    }

    // Save broadcast record
    const record = await this.prisma.broadcastNotification.create({
      data: {
        title: dto.title,
        message: dto.message,
        type: notifType,
        recipientCount: users.length,
        sentById: admin?.id ?? null,
      },
    });

    return {
      success: true,
      recipientCount: users.length,
      broadcastId: record.id,
    };
  }

  // ── History ───────────────────────────────────────────────────────────────
  async getHistory(query: { page?: string; limit?: string }) {
    const page = Math.max(Number(query.page ?? 1), 1);
    const limit = Math.min(Number(query.limit ?? 20), 100);
    const skip = (page - 1) * limit;

    const [data, total] = await this.prisma.$transaction([
      this.prisma.broadcastNotification.findMany({
        skip,
        take: limit,
        orderBy: { sentAt: 'desc' },
        include: {
          sentBy: {
            select: { id: true, name: true, email: true },
          },
        },
      }),
      this.prisma.broadcastNotification.count(),
    ]);

    return {
      data,
      total,
      page,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }
}
