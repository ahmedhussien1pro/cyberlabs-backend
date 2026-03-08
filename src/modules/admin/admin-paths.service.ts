import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../core/database';
import { PathModuleType, PathModuleStatus } from '@prisma/client';

@Injectable()
export class AdminPathsService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Stats ────────────────────────────────────────────────────────────────
  async getStats() {
    const [total, published, unpublished] = await this.prisma.$transaction([
      this.prisma.learningPath.count(),
      this.prisma.learningPath.count({ where: { isPublished: true } }),
      this.prisma.learningPath.count({ where: { isPublished: false } }),
    ]);
    return { total, published, unpublished };
  }

  // ─── List ─────────────────────────────────────────────────────────────────
  async findAll(query: any) {
    const page = +(query.page ?? 1);
    const limit = +(query.limit ?? 20);
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { slug:  { contains: query.search, mode: 'insensitive' } },
      ];
    }
    if (query.isPublished !== undefined) {
      where.isPublished = query.isPublished === 'true' || query.isPublished === true;
    }

    const [paths, total] = await this.prisma.$transaction([
      this.prisma.learningPath.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          // ✅ relation name from schema is `modules` not `courses`
          _count: { select: { modules: true, enrollments: true } },
        },
      }),
      this.prisma.learningPath.count({ where }),
    ]);

    return {
      data: paths,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  // ─── Find One ─────────────────────────────────────────────────────────────
  async findOne(id: string) {
    const path = await this.prisma.learningPath.findUnique({
      where: { id },
      include: {
        // ✅ `modules` is the correct relation name in LearningPath
        modules: {
          include: {
            course: {
              select: {
                id: true,
                title: true,
                slug: true,
                thumbnail: true,
                difficulty: true,
              },
            },
            lab: {
              select: {
                id: true,
                title: true,
                slug: true,
                imageUrl: true,
                difficulty: true,
              },
            },
          },
          orderBy: { order: 'asc' },
        },
        _count: { select: { enrollments: true } },
      },
    });

    if (!path) throw new NotFoundException(`Learning path "${id}" not found`);
    return path;
  }

  // ─── Create ───────────────────────────────────────────────────────────────
  async create(dto: any) {
    const { modules: modulesData, ...data } = dto;

    return this.prisma.learningPath.create({
      data: {
        ...data,
        isPublished: false,
        ...(modulesData?.length && {
          // ✅ PathModule requires `title` field — not just courseId
          modules: {
            create: (modulesData as any[]).map((m, index) => ({
              title:          m.title          ?? 'Module',
              ar_title:       m.ar_title       ?? null,
              description:    m.description    ?? null,
              ar_description: m.ar_description ?? null,
              order:          m.order          ?? index,
              type:           (m.type as PathModuleType) ?? PathModuleType.COURSE,
              status:         (m.status as PathModuleStatus) ?? PathModuleStatus.PUBLISHED,
              estimatedHours: m.estimatedHours ?? 0,
              isLocked:       m.isLocked       ?? false,
              totalTopics:    m.totalTopics    ?? 0,
              courseId:       m.courseId       ?? null,
              labId:          m.labId          ?? null,
            })),
          },
        }),
      },
    });
  }

  // ─── Update ───────────────────────────────────────────────────────────────
  async update(id: string, dto: any) {
    await this.findOne(id); // 404 guard

    const { modules: modulesData, ...data } = dto;

    if (modulesData) {
      // ✅ use prisma.pathModule (camelCase of model name `PathModule`)
      await this.prisma.pathModule.deleteMany({ where: { pathId: id } });
      await this.prisma.pathModule.createMany({
        data: (modulesData as any[]).map((m, index) => ({
          pathId:         id,
          title:          m.title          ?? 'Module',
          ar_title:       m.ar_title       ?? null,
          description:    m.description    ?? null,
          ar_description: m.ar_description ?? null,
          order:          m.order          ?? index,
          type:           (m.type as PathModuleType) ?? PathModuleType.COURSE,
          status:         (m.status as PathModuleStatus) ?? PathModuleStatus.PUBLISHED,
          estimatedHours: m.estimatedHours ?? 0,
          isLocked:       m.isLocked       ?? false,
          totalTopics:    m.totalTopics    ?? 0,
          courseId:       m.courseId       ?? null,
          labId:          m.labId          ?? null,
        })),
      });
    }

    return this.prisma.learningPath.update({ where: { id }, data });
  }

  // ─── Publish / Unpublish ──────────────────────────────────────────────────
  async publish(id: string) {
    const path = await this.findOne(id);
    if (path.isPublished)
      throw new BadRequestException('Learning path is already published');
    return this.prisma.learningPath.update({
      where: { id },
      data: { isPublished: true },
    });
  }

  async unpublish(id: string) {
    const path = await this.findOne(id);
    if (!path.isPublished)
      throw new BadRequestException('Learning path is already unpublished');
    return this.prisma.learningPath.update({
      where: { id },
      data: { isPublished: false },
    });
  }

  // ─── Delete ───────────────────────────────────────────────────────────────
  async remove(id: string) {
    await this.findOne(id); // 404 guard
    await this.prisma.learningPath.delete({ where: { id } });
    return { success: true, message: `Learning path "${id}" deleted` };
  }
}
