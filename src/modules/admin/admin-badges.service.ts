// src/modules/admin/admin-badges.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../core/database';

@Injectable()
export class AdminBadgesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: any) {
    const page = Math.max(1, query.page ?? 1);
    const limit = Math.min(100, Math.max(1, query.limit ?? 20));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { code: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    if (query.type) where.type = query.type;

    const [data, total] = await Promise.all([
      this.prisma.badge.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { _count: { select: { userBadges: true } } },
      }),
      this.prisma.badge.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string) {
    const badge = await this.prisma.badge.findUnique({
      where: { id },
      include: { _count: { select: { userBadges: true } } },
    });
    if (!badge) throw new NotFoundException(`Badge ${id} not found`);
    return { data: badge };
  }

  async create(dto: any) {
    const existing = await this.prisma.badge.findUnique({
      where: { code: dto.code },
    });
    if (existing)
      throw new BadRequestException(`Badge code "${dto.code}" already exists`);
    const badge = await this.prisma.badge.create({ data: dto });
    return { data: badge };
  }

  async update(id: string, dto: any) {
    await this.findOne(id);
    const badge = await this.prisma.badge.update({
      where: { id },
      data: dto,
    });
    return { data: badge };
  }

  async remove(id: string) {
    const { data: badge } = await this.findOne(id);
    const inUse = await this.prisma.userBadge.count({ where: { badgeId: id } });
    if (inUse > 0) {
      throw new BadRequestException(
        `Cannot delete badge awarded to ${inUse} users.`,
      );
    }
    await this.prisma.badge.delete({ where: { id } });
    return {
      data: { success: true, message: `Badge "${badge.title}" deleted` },
    };
  }

  async getStats() {
    const [total, totalAwarded] = await Promise.all([
      this.prisma.badge.count(),
      this.prisma.userBadge.count(),
    ]);
    return { data: { total, totalAwarded } };
  }
}
