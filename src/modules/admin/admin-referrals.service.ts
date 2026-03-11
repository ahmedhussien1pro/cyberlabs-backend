import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../core/database';
import { CreateReferralLinkDto } from './dto/create-referral-link.dto';

@Injectable()
export class AdminReferralsService {
  constructor(private readonly prisma: PrismaService) {}

  // ── GET /admin/referrals ──────────────────────────────────────────────────
  async findAll() {
    const links = await this.prisma.referralLink.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { clicks: true } },
        targetUser: { select: { id: true, name: true } },
      },
    });

    return links.map((l) => this.formatLink(l));
  }

  // ── GET /admin/referrals/stats ────────────────────────────────────────────
  async getStats() {
    const links = await this.prisma.referralLink.findMany({
      include: {
        _count: { select: { clicks: true } },
        clicks: { select: { convertedAt: true } },
      },
    });

    const totalLinks = links.length;
    const totalClicks = links.reduce((s, l) => s + (l._count?.clicks ?? 0), 0);
    const totalRegistrations = links.reduce(
      (s, l) => s + l.clicks.filter((c: any) => c.convertedAt != null).length,
      0,
    );

    // Group by source
    const sourceMap = new Map<
      string,
      { clicks: number; registrations: number }
    >();
    for (const l of links) {
      const src = l.source;
      const prev = sourceMap.get(src) ?? { clicks: 0, registrations: 0 };
      sourceMap.set(src, {
        clicks: prev.clicks + (l._count?.clicks ?? 0),
        registrations:
          prev.registrations +
          l.clicks.filter((c: any) => c.convertedAt != null).length,
      });
    }

    return {
      totalLinks,
      totalClicks,
      totalRegistrations,
      bySource: Array.from(sourceMap.entries()).map(([source, data]) => ({
        source,
        ...data,
      })),
    };
  }

  // ── POST /admin/referrals ─────────────────────────────────────────────────
  async create(dto: CreateReferralLinkDto) {
    const baseUrl = process.env.FRONTEND_URL ?? 'https://cyberlabs.io';

    const link = await this.prisma.referralLink.create({
      data: {
        label: dto.label,
        slug: dto.slug,
        source: dto.source,
        targetUserId: dto.targetUserId ?? null,
        targetUserName: dto.targetUserName ?? null,
        url: `${baseUrl}/ref/${dto.slug}`,
      },
      include: {
        _count: { select: { clicks: true } },
        targetUser: { select: { id: true, name: true } },
      },
    });

    return this.formatLink(link);
  }

  // ── DELETE /admin/referrals/:id ───────────────────────────────────────────
  async remove(id: string) {
    const existing = await this.prisma.referralLink.findUnique({
      where: { id },
    });
    if (!existing)
      throw new NotFoundException(`Referral link "${id}" not found`);
    await this.prisma.referralLink.delete({ where: { id } });
  }

  // ── private ───────────────────────────────────────────────────────────────
  private formatLink(l: any) {
    return {
      id: l.id,
      label: l.label,
      slug: l.slug,
      source: l.source,
      targetUserId: l.targetUserId,
      targetUserName: l.targetUserName ?? l.targetUser?.name,
      clicks: l._count?.clicks ?? 0,
      registrations:
        l.clicks?.filter((c: any) => c.convertedAt != null).length ?? 0,
      url: l.url,
      createdAt: l.createdAt,
    };
  }
}
