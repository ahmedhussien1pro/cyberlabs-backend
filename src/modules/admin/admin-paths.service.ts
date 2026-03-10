// src/modules/admin/admin-paths.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../core/database';

function generateSlug(base: string): string {
  return base
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 80);
}

const PATH_LIST_SELECT = {
  id: true,
  title: true,
  ar_title: true,
  slug: true,
  isPublished: true,
  description: true,
  difficulty: true,
  totalCourses: true,
  totalLabs: true,
  estimatedHours: true,
  isFeatured: true,
  isNew: true,
  createdAt: true,
  updatedAt: true,
  _count: { select: { modules: true, enrollments: true } },
};

@Injectable()
export class AdminPathsService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Stats ─────────────────────────────────────────────────────────────────
  async getStats() {
    const [total, published] = await Promise.all([
      this.prisma.learningPath.count(),
      this.prisma.learningPath.count({ where: { isPublished: true } }),
    ]);
    return { data: { total, published, unpublished: total - published } };
  }

  // ─── List ──────────────────────────────────────────────────────────────────
  async findAll(query: any) {
    const page = Math.max(1, query.page ?? 1);
    const limit = Math.min(100, Math.max(1, query.limit ?? 20));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { ar_title: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    if (query.isPublished !== undefined) {
      where.isPublished =
        query.isPublished === true || (query.isPublished as any) === 'true';
    }

    const [data, total] = await Promise.all([
      this.prisma.learningPath.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: PATH_LIST_SELECT,
      }),
      this.prisma.learningPath.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  // ─── Single ────────────────────────────────────────────────────────────────
  async findOne(id: string) {
    const path = await this.prisma.learningPath.findUnique({
      where: { id },
      include: {
        modules: {
          orderBy: { order: 'asc' },
          include: { lab: true, course: true },
        },
        _count: { select: { modules: true, enrollments: true } },
      },
    });
    if (!path) throw new NotFoundException(`Learning path ${id} not found`);
    return { data: path };
  }

  // ─── Create ────────────────────────────────────────────────────────────────
  async create(dto: any) {
    const slug = dto.slug ?? generateSlug(dto.title ?? 'untitled-path');
    const existing = await this.prisma.learningPath.findFirst({
      where: { slug },
    });
    if (existing)
      throw new BadRequestException(`Slug "${slug}" already exists`);

    const { modules, ...pathData } = dto;
    const path = await this.prisma.learningPath.create({
      data: { ...pathData, slug, isPublished: pathData.isPublished ?? false },
    });

    if (modules?.length) {
      for (const [i, mod] of modules.entries()) {
        await this.prisma.pathModule.create({
          data: {
            pathId: path.id,
            labId: mod.labId ?? null,
            courseId: mod.courseId ?? null,
            order: mod.order ?? i,
            title: mod.title ?? '',
          },
        });
      }
    }

    return this.findOne(path.id);
  }

  // ─── Update ────────────────────────────────────────────────────────────────
  async update(id: string, dto: any) {
    await this.findOne(id);
    const { modules, ...pathData } = dto;
    const updated = await this.prisma.learningPath.update({
      where: { id },
      data: pathData,
      select: PATH_LIST_SELECT,
    });
    return { data: updated };
  }

  // ─── Publish / Unpublish ───────────────────────────────────────────────────
  async publish(id: string) {
    await this.findOne(id);
    const updated = await this.prisma.learningPath.update({
      where: { id },
      data: { isPublished: true },
      select: PATH_LIST_SELECT,
    });
    return { data: updated };
  }

  async unpublish(id: string) {
    await this.findOne(id);
    const updated = await this.prisma.learningPath.update({
      where: { id },
      data: { isPublished: false },
      select: PATH_LIST_SELECT,
    });
    return { data: updated };
  }

  // ─── Delete ────────────────────────────────────────────────────────────────
  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.learningPath.delete({ where: { id } });
    return {
      data: { success: true, message: 'Learning path deleted successfully' },
    };
  }

  // ─── Duplicate ─────────────────────────────────────────────────────────────
  async duplicate(id: string) {
    const { data: original } = await this.findOne(id);

    const baseSlug = original.slug
      ? `${original.slug}-copy`
      : generateSlug(`${original.title}-copy`);
    let candidateSlug = baseSlug;
    let attempt = 0;
    while (
      await this.prisma.learningPath.findFirst({
        where: { slug: candidateSlug },
      })
    ) {
      attempt++;
      candidateSlug = `${baseSlug}-${attempt}`;
    }

    const {
      id: _id,
      createdAt: _c,
      updatedAt: _u,
      modules,
      _count,
      ...rest
    } = original as any;

    const copy = await this.prisma.$transaction(async (tx) => {
      const newPath = await tx.learningPath.create({
        data: {
          ...rest,
          title: `${original.title} (Copy)`,
          ar_title: original.ar_title
            ? `${original.ar_title} (نسخة)`
            : undefined,
          slug: candidateSlug,
          isPublished: false,
        },
      });

      for (const [i, mod] of (modules ?? []).entries()) {
        await tx.pathModule.create({
          data: {
            pathId: newPath.id,
            labId: mod.labId ?? null,
            courseId: mod.courseId ?? null,
            order: mod.order ?? i,
            title: mod.title ?? '',
          },
        });
      }

      return newPath;
    });

    return { data: copy };
  }

  // ─── Lab relations ─────────────────────────────────────────────────────────
  async getLabs(pathId: string) {
    const path = await this.prisma.learningPath.findUnique({
      where: { id: pathId },
      include: {
        modules: {
          orderBy: { order: 'asc' },
          include: {
            lab: {
              select: {
                id: true,
                title: true,
                slug: true,
                difficulty: true,
                isPublished: true,
              },
            },
          },
        },
      },
    });
    if (!path) throw new NotFoundException(`Learning path ${pathId} not found`);
    return { data: path.modules.filter((m) => m.lab !== null) };
  }

  async attachLab(pathId: string, labId: string, dto: any) {
    await this.findOne(pathId);
    const count = await this.prisma.pathModule.count({ where: { pathId } });
    const mod = await this.prisma.pathModule.create({
      data: {
        pathId,
        labId,
        order: dto?.order ?? count,
        title: dto?.title ?? '',
        courseId: null,
      },
      include: { lab: true },
    });
    return { data: mod };
  }

  async detachLab(pathId: string, labId: string) {
    const mod = await this.prisma.pathModule.findFirst({
      where: { pathId, labId },
    });
    if (!mod) throw new NotFoundException('Lab not found in this path');
    await this.prisma.pathModule.delete({ where: { id: mod.id } });
    return { data: { success: true } };
  }

  // ─── Course relations ───────────────────────────────────────────────────────
  async attachCourse(pathId: string, courseId: string, dto: any) {
    await this.findOne(pathId);

    const existing = await this.prisma.pathModule.findFirst({
      where: { pathId, courseId },
    });
    if (existing)
      throw new BadRequestException('Course already attached to this path');

    const count = await this.prisma.pathModule.count({ where: { pathId } });
    const mod = await this.prisma.pathModule.create({
      data: {
        pathId,
        courseId,
        labId: null,
        order: dto?.order ?? count,
        title: dto?.title ?? '',
      },
      include: { course: true },
    });
    return { data: mod };
  }

  async detachCourse(pathId: string, courseId: string) {
    const mod = await this.prisma.pathModule.findFirst({
      where: { pathId, courseId },
    });
    if (!mod) throw new NotFoundException('Course not found in this path');
    await this.prisma.pathModule.delete({ where: { id: mod.id } });
    return { data: { success: true } };
  }

  // ─── Reorder modules (two-phase to avoid unique constraint conflicts) ──────
  async reorderModules(
    pathId: string,
    orders: { id: string; order: number }[],
  ) {
    await this.findOne(pathId);

    // Phase 1: shift all to high temp values
    await this.prisma.$transaction(
      orders.map(({ id }, i) =>
        this.prisma.pathModule.update({
          where: { id },
          data: { order: 10000 + i },
        }),
      ),
    );

    // Phase 2: apply real order values
    await this.prisma.$transaction(
      orders.map(({ id, order }) =>
        this.prisma.pathModule.update({ where: { id }, data: { order } }),
      ),
    );

    return this.findOne(pathId);
  }
}
