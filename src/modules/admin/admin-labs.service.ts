// src/modules/admin/admin-labs.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { AdminLabQueryDto } from './dto/admin-lab-query.dto';
import { CreateLabDto } from './dto/create-lab.dto';
import { UpdateLabDto } from './dto/update-lab.dto';

function generateSlug(base: string): string {
  return base
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 80);
}

const LAB_LIST_SELECT = {
  id: true,
  title: true,
  slug: true,
  category: true,
  difficulty: true,
  executionMode: true,
  isPublished: true,
  thumbnail: true,
  estimatedTime: true,
  createdAt: true,
  updatedAt: true,
  _count: {
    select: {
      submissions: true,
      usersProgress: true,
    },
  },
};

@Injectable()
export class AdminLabsService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Stats ─────────────────────────────────────────────────────────────────
  async getStats() {
    const [total, published, totalCompletions, totalSubmissions] = await Promise.all([
      this.prisma.lab.count(),
      this.prisma.lab.count({ where: { isPublished: true } }),
      this.prisma.labProgress.count({ where: { status: 'COMPLETED' } }).catch(() => 0),
      this.prisma.labSubmission.count().catch(() => 0),
    ]);
    return {
      data: {
        total,
        published,
        unpublished: total - published,
        totalCompletions,
        totalSubmissions,
      },
    };
  }

  // ─── List ──────────────────────────────────────────────────────────────────
  async findAll(query: AdminLabQueryDto) {
    const page = Math.max(1, query.page ?? 1);
    const limit = Math.min(100, Math.max(1, query.limit ?? 20));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { slug: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    if (query.difficulty) where.difficulty = query.difficulty;
    if (query.category) where.category = query.category;
    if (query.executionMode) where.executionMode = query.executionMode;
    if (query.isPublished !== undefined) {
      where.isPublished =
        query.isPublished === true || (query.isPublished as any) === 'true';
    }

    const [data, total] = await Promise.all([
      this.prisma.lab.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: LAB_LIST_SELECT,
      }),
      this.prisma.lab.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  // ─── Single ────────────────────────────────────────────────────────────────
  async findOne(id: string) {
    const lab = await this.prisma.lab.findUnique({
      where: { id },
      include: { _count: { select: { submissions: true, usersProgress: true } } },
    });
    if (!lab) throw new NotFoundException(`Lab ${id} not found`);
    return { data: lab };
  }

  // ─── Create ────────────────────────────────────────────────────────────────
  async create(dto: CreateLabDto) {
    const slug = (dto as any).slug ?? generateSlug(dto.title);
    const existing = await this.prisma.lab.findUnique({ where: { slug } });
    if (existing) throw new BadRequestException(`Slug "${slug}" already exists`);
    const lab = await this.prisma.lab.create({
      data: { ...dto, slug, isPublished: (dto as any).isPublished ?? false } as any,
    });
    return { data: lab };
  }

  // ─── Update ────────────────────────────────────────────────────────────────
  async update(id: string, dto: UpdateLabDto) {
    await this.findOne(id);
    const updated = await this.prisma.lab.update({
      where: { id },
      data: dto as any,
      select: LAB_LIST_SELECT,
    });
    return { data: updated };
  }

  // ─── Publish / Unpublish ───────────────────────────────────────────────────
  async publish(id: string) {
    await this.findOne(id);
    const updated = await this.prisma.lab.update({
      where: { id },
      data: { isPublished: true },
      select: LAB_LIST_SELECT,
    });
    return { data: updated };
  }

  async unpublish(id: string) {
    await this.findOne(id);
    const updated = await this.prisma.lab.update({
      where: { id },
      data: { isPublished: false },
      select: LAB_LIST_SELECT,
    });
    return { data: updated };
  }

  // ─── Delete ────────────────────────────────────────────────────────────────
  async remove(id: string) {
    const { data: lab } = await this.findOne(id);
    const progressCount = await this.prisma.labProgress
      .count({ where: { labId: id } })
      .catch(() => 0);
    if (progressCount > 0) {
      throw new BadRequestException(
        `Cannot delete lab with ${progressCount} active user progress records. Unpublish it first.`,
      );
    }
    await this.prisma.lab.delete({ where: { id } });
    return { data: { success: true, message: `Lab "${lab.title}" deleted successfully` } };
  }

  // ─── DUPLICATE ─────────────────────────────────────────────────────────────
  async duplicate(id: string) {
    const { data: original } = await this.findOne(id);

    const baseSlug = `${original.slug}-copy`;
    let candidateSlug = baseSlug;
    let attempt = 0;
    while (await this.prisma.lab.findUnique({ where: { slug: candidateSlug } })) {
      attempt++;
      candidateSlug = `${baseSlug}-${attempt}`;
    }

    const {
      id: _id,
      createdAt: _c,
      updatedAt: _u,
      _count: _cnt,
      ...rest
    } = original as any;

    const copy = await this.prisma.lab.create({
      data: {
        ...rest,
        title: `${original.title} (Copy)`,
        slug: candidateSlug,
        isPublished: false,
      },
      select: LAB_LIST_SELECT,
    });

    return { data: copy };
  }
}
