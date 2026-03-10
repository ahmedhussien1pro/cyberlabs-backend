import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service';
import { TrackEntryDto } from './dto/track-entry.dto';
import { TrackActionDto } from './dto/track-action.dto';
import { nanoid } from 'nanoid';

@Injectable()
export class TrackingService {
  constructor(private readonly prisma: PrismaService) {}

  // Generate unique referral code for user (called at registration)
  async ensureReferralCode(userId: string): Promise<string> {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { referralCode: true } });
    if (user?.referralCode) return user.referralCode;
    let code: string;
    let exists = true;
    do {
      code = nanoid(8).toUpperCase();
      const found = await this.prisma.user.findUnique({ where: { referralCode: code } });
      exists = !!found;
    } while (exists);
    await this.prisma.user.update({ where: { id: userId }, data: { referralCode: code } });
    return code;
  }

  // Record entry event (public — from landing page)
  async trackEntry(dto: TrackEntryDto, userId?: string, ip?: string, userAgent?: string) {
    const sessionId = dto.sessionId ?? nanoid(16);

    // Create tracking event
    await this.prisma.trackingEvent.create({
      data: {
        sessionId,
        userId:       userId ?? null,
        eventType:    'ENTRY',
        page:         dto.landingPage ?? dto.page ?? null,
        referralCode: dto.referralCode ?? null,
        source:       dto.source ?? null,
        campaign:     dto.campaign ?? null,
        meta: {
          medium:  dto.medium  ?? null,
          content: dto.content ?? null,
          term:    dto.term    ?? null,
        },
        ip,
        userAgent,
      },
    });

    // If user is authenticated, upsert UserTracking
    if (userId) {
      await this.prisma.userTracking.upsert({
        where: { userId },
        create: {
          userId,
          source:       dto.source       ?? null,
          medium:       dto.medium       ?? null,
          campaign:     dto.campaign     ?? null,
          content:      dto.content      ?? null,
          term:         dto.term         ?? null,
          referralCode: dto.referralCode ?? null,
          landingPage:  dto.landingPage  ?? dto.page ?? null,
          visitedPages: dto.page ? [dto.page] : [],
          lastSeenAt:   new Date(),
        },
        update: {
          lastSeenAt:   new Date(),
          visitedPages: dto.page
            ? { push: dto.page }
            : undefined,
        },
      });
    }

    return { sessionId };
  }

  // Record arbitrary action
  async trackAction(dto: TrackActionDto, userId?: string, ip?: string, userAgent?: string) {
    await this.prisma.trackingEvent.create({
      data: {
        sessionId:    dto.sessionId,
        userId:       userId ?? null,
        eventType:    dto.eventType as any,
        page:         dto.page     ?? null,
        element:      dto.element  ?? null,
        referralCode: dto.referralCode ?? null,
        source:       dto.source   ?? null,
        campaign:     dto.campaign ?? null,
        meta:         dto.meta     ?? null,
        ip,
        userAgent,
      },
    });
    return { ok: true };
  }

  // Apply referral at registration: link new user to referrer
  async applyReferral(newUserId: string, referralCode: string) {
    const referrer = await this.prisma.user.findUnique({
      where:  { referralCode },
      select: { id: true },
    });
    if (!referrer || referrer.id === newUserId) return;
    await this.prisma.user.update({
      where: { id: newUserId },
      data:  { referredById: referrer.id },
    });
  }

  // Attach utm data to user at registration
  async attachTrackingToUser(
    userId: string,
    data: { source?: string; medium?: string; campaign?: string; referralCode?: string; landingPage?: string },
  ) {
    await this.prisma.userTracking.upsert({
      where: { userId },
      create: {
        userId,
        source:       data.source       ?? null,
        medium:       data.medium       ?? null,
        campaign:     data.campaign     ?? null,
        referralCode: data.referralCode ?? null,
        landingPage:  data.landingPage  ?? null,
        lastSeenAt:   new Date(),
      },
      update: {
        source:       data.source       ?? undefined,
        medium:       data.medium       ?? undefined,
        campaign:     data.campaign     ?? undefined,
        referralCode: data.referralCode ?? undefined,
        landingPage:  data.landingPage  ?? undefined,
        lastSeenAt:   new Date(),
      },
    });
  }

  // Stats for a single user referral code
  async getReferralStats(userId: string) {
    const user = await this.prisma.user.findUnique({
      where:  { id: userId },
      select: { referralCode: true },
    });
    if (!user?.referralCode) return { referralCode: null, totalReferrals: 0, referrals: [] };

    const referrals = await this.prisma.user.findMany({
      where:  { referredById: userId },
      select: { id: true, name: true, avatarUrl: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });
    return {
      referralCode: user.referralCode,
      totalReferrals: referrals.length,
      referrals,
    };
  }

  // Admin: full funnel stats
  async getAdminStats() {
    const [totalEvents, bySource, byCampaign, registrations, referralLeaders] = await Promise.all([
      this.prisma.trackingEvent.count(),
      this.prisma.trackingEvent.groupBy({
        by: ['source'],
        _count: { id: true },
        where: { source: { not: null } },
        orderBy: { _count: { id: 'desc' } },
        take: 10,
      }),
      this.prisma.trackingEvent.groupBy({
        by: ['campaign'],
        _count: { id: true },
        where: { campaign: { not: null } },
        orderBy: { _count: { id: 'desc' } },
        take: 10,
      }),
      this.prisma.trackingEvent.count({ where: { eventType: 'REGISTER' } }),
      this.prisma.user.findMany({
        where:  { referrals: { some: {} } },
        select: {
          id: true,
          name: true,
          avatarUrl: true,
          referralCode: true,
          _count: { select: { referrals: true } },
        },
        orderBy: { referrals: { _count: 'desc' } },
        take: 20,
      }),
    ]);

    return {
      totalEvents,
      registrations,
      conversionRate: totalEvents > 0 ? ((registrations / totalEvents) * 100).toFixed(2) + '%' : '0%',
      bySource: bySource.map((r) => ({ source: r.source, count: r._count.id })),
      byCampaign: byCampaign.map((r) => ({ campaign: r.campaign, count: r._count.id })),
      topReferrers: referralLeaders.map((u) => ({
        userId: u.id,
        name: u.name,
        avatarUrl: u.avatarUrl,
        referralCode: u.referralCode,
        totalReferrals: u._count.referrals,
      })),
    };
  }

  // Admin: referral leaderboard
  async getReferralLeaderboard(limit = 50) {
    const leaders = await this.prisma.user.findMany({
      where:  { referrals: { some: {} } },
      select: {
        id: true,
        name: true,
        avatarUrl: true,
        referralCode: true,
        createdAt: true,
        _count: { select: { referrals: true } },
      },
      orderBy: { referrals: { _count: 'desc' } },
      take: limit,
    });
    return leaders.map((u, i) => ({
      rank: i + 1,
      userId: u.id,
      name: u.name,
      avatarUrl: u.avatarUrl,
      referralCode: u.referralCode,
      totalReferrals: u._count.referrals,
      memberSince: u.createdAt,
    }));
  }
}
