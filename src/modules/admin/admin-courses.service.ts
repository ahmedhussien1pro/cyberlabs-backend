// src/modules/admin/admin-courses.service.ts
// NOTE: Only the duplicate() method is appended here; all original methods are preserved.
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { AdminCourseQueryDto } from './dto/admin-course-query.dto';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { ImportCourseDto } from './dto/import-course.dto';
import { UpdateCurriculumDto } from './dto/update-curriculum.dto';
import * as crypto from 'crypto';

// ─── helpers ───────────────────────────────────────────────────────────────
function generateSlug(base: string): string {
  return base
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 80);
}

const COURSE_LIST_SELECT = {
  id: true,
  title: true,
  ar_title: true,
  slug: true,
  thumbnail: true,
  isPublished: true,
  level: true,
  access: true,
  createdAt: true,
  updatedAt: true,
  _count: { select: { enrollments: true, sections: true } },
};

@Injectable()
export class AdminCoursesService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Stats ─────────────────────────────────────────────────────────────────
  async getStats() {
    const [total, published] = await Promise.all([
      this.prisma.course.count(),
      this.prisma.course.count({ where: { isPublished: true } }),
    ]);
    return {
      data: {
        total,
        published,
        unpublished: total - published,
      },
    };
  }

  // ─── List ──────────────────────────────────────────────────────────────────
  async findAll(query: AdminCourseQueryDto) {
    const page = Math.max(1, query.page ?? 1);
    const limit = Math.min(100, Math.max(1, query.limit ?? 20));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { slug: { contains: query.search, mode: 'insensitive' } },
        { ar_title: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    if (query.isPublished !== undefined) {
      where.isPublished =
        query.isPublished === true || query.isPublished === ('true' as any);
    }
    if (query.level) where.level = query.level;
    if (query.access) where.access = query.access;

    const [data, total] = await Promise.all([
      this.prisma.course.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: COURSE_LIST_SELECT,
      }),
      this.prisma.course.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // ─── Single ────────────────────────────────────────────────────────────────
  async findOne(id: string) {
    const course = await this.prisma.course.findUnique({
      where: { id },
      include: {
        sections: {
          orderBy: { order: 'asc' },
          include: {
            modules: {
              orderBy: { order: 'asc' },
              include: {
                lessons: { orderBy: { order: 'asc' } },
              },
            },
          },
        },
      },
    });
    if (!course) throw new NotFoundException(`Course ${id} not found`);
    return { data: course };
  }

  // ─── Create ────────────────────────────────────────────────────────────────
  async create(dto: CreateCourseDto) {
    const slug = dto.slug ?? generateSlug(dto.title);
    const existing = await this.prisma.course.findUnique({ where: { slug } });
    if (existing) {
      throw new BadRequestException(`Slug "${slug}" already exists`);
    }
    const course = await this.prisma.course.create({
      data: {
        ...dto,
        slug,
        isPublished: dto.isPublished ?? false,
      } as any,
    });
    return { data: course };
  }

  // ─── Update ────────────────────────────────────────────────────────────────
  async update(id: string, dto: UpdateCourseDto) {
    await this.findOne(id);
    const updated = await this.prisma.course.update({
      where: { id },
      data: dto as any,
      select: COURSE_LIST_SELECT,
    });
    return { data: updated };
  }

  // ─── Update Curriculum ─────────────────────────────────────────────────────
  async updateCurriculum(id: string, dto: UpdateCurriculumDto) {
    await this.findOne(id);
    await this.prisma.$transaction(async (tx) => {
      await tx.courseSection.deleteMany({ where: { courseId: id } });
      for (const [si, section] of dto.sections.entries()) {
        const sec = await tx.courseSection.create({
          data: { courseId: id, title: section.title, order: section.order ?? si },
        });
        for (const [mi, mod] of (section.modules ?? []).entries()) {
          const m = await tx.courseSectionModule.create({
            data: { sectionId: sec.id, title: mod.title, order: mod.order ?? mi, type: mod.type ?? 'TEXT' },
          });
          for (const [li, lesson] of (mod.lessons ?? []).entries()) {
            await tx.courseSectionModuleLesson.create({
              data: { moduleId: m.id, title: lesson.title, order: lesson.order ?? li, content: lesson.content, videoUrl: lesson.videoUrl },
            });
          }
        }
      }
    });
    return this.findOne(id);
  }

  // ─── Publish / Unpublish ───────────────────────────────────────────────────
  async publish(id: string) {
    await this.findOne(id);
    const updated = await this.prisma.course.update({
      where: { id },
      data: { isPublished: true },
      select: COURSE_LIST_SELECT,
    });
    return { data: updated };
  }

  async unpublish(id: string) {
    await this.findOne(id);
    const updated = await this.prisma.course.update({
      where: { id },
      data: { isPublished: false },
      select: COURSE_LIST_SELECT,
    });
    return { data: updated };
  }

  // ─── Delete ────────────────────────────────────────────────────────────────
  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.course.delete({ where: { id } });
    return { data: { success: true, message: 'Course deleted successfully' } };
  }

  // ─── DUPLICATE ─────────────────────────────────────────────────────────────
  async duplicate(id: string) {
    const { data: original } = await this.findOne(id);

    // build unique slug
    const baseSlug = `${original.slug}-copy`;
    let candidateSlug = baseSlug;
    let attempt = 0;
    while (await this.prisma.course.findUnique({ where: { slug: candidateSlug } })) {
      attempt++;
      candidateSlug = `${baseSlug}-${attempt}`;
    }

    const { id: _id, createdAt: _c, updatedAt: _u, sections, _count, ...rest } = original as any;

    const copy = await this.prisma.$transaction(async (tx) => {
      const newCourse = await tx.course.create({
        data: {
          ...rest,
          title: `${original.title} (Copy)`,
          ar_title: original.ar_title ? `${original.ar_title} (نسخة)` : undefined,
          slug: candidateSlug,
          isPublished: false,
        },
      });

      // deep-copy curriculum
      for (const [si, section] of (sections ?? []).entries()) {
        const sec = await tx.courseSection.create({
          data: { courseId: newCourse.id, title: section.title, order: section.order ?? si },
        });
        for (const [mi, mod] of (section.modules ?? []).entries()) {
          const m = await tx.courseSectionModule.create({
            data: { sectionId: sec.id, title: mod.title, order: mod.order ?? mi, type: mod.type ?? 'TEXT' },
          });
          for (const [li, lesson] of (mod.lessons ?? []).entries()) {
            await tx.courseSectionModuleLesson.create({
              data: {
                moduleId: m.id,
                title: lesson.title,
                order: lesson.order ?? li,
                content: lesson.content ?? null,
                videoUrl: lesson.videoUrl ?? null,
              },
            });
          }
        }
      }
      return newCourse;
    });

    return { data: copy };
  }

  // ─── Course ↔ Lab relations ────────────────────────────────────────────────
  async getCourseLabs(courseId: string) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      include: {
        labs: {
          orderBy: { order: 'asc' },
          include: { lab: { select: { id: true, title: true, slug: true, difficulty: true, isPublished: true } } },
        },
      },
    });
    if (!course) throw new NotFoundException(`Course ${courseId} not found`);
    return { data: course.labs };
  }

  async reorderLabs(courseId: string, order: string[]) {
    await this.getCourseLabs(courseId);
    await Promise.all(
      order.map((labId, idx) =>
        this.prisma.courseLab.updateMany({
          where: { courseId, labId },
          data: { order: idx },
        }),
      ),
    );
    return this.getCourseLabs(courseId);
  }

  async attachLab(courseId: string, labId: string) {
    const existing = await this.prisma.courseLab.findUnique({
      where: { courseId_labId: { courseId, labId } },
    });
    if (existing) throw new BadRequestException('Lab already attached to this course');
    const count = await this.prisma.courseLab.count({ where: { courseId } });
    const record = await this.prisma.courseLab.create({
      data: { courseId, labId, order: count },
      include: { lab: { select: { id: true, title: true, slug: true, difficulty: true, isPublished: true } } },
    });
    return { data: record };
  }

  async detachLab(courseId: string, labId: string) {
    const record = await this.prisma.courseLab.findUnique({
      where: { courseId_labId: { courseId, labId } },
    });
    if (!record) throw new NotFoundException('Lab not attached to this course');
    await this.prisma.courseLab.delete({ where: { courseId_labId: { courseId, labId } } });
    return { data: { success: true } };
  }

  // ─── Import JSON ───────────────────────────────────────────────────────────
  async importJson(buffer: Buffer, metadata: ImportCourseDto) {
    let parsed: any;
    try {
      parsed = JSON.parse(buffer.toString('utf-8'));
    } catch {
      throw new BadRequestException('Invalid JSON file');
    }
    const slug = metadata.slug ?? generateSlug(metadata.title ?? parsed.title ?? 'untitled');
    const existing = await this.prisma.course.findUnique({ where: { slug } });
    if (existing) throw new BadRequestException(`Slug "${slug}" already taken`);

    const course = await this.prisma.course.create({
      data: {
        title: metadata.title ?? parsed.title,
        slug,
        description: metadata.description ?? parsed.description ?? null,
        thumbnail: metadata.thumbnail ?? parsed.thumbnail ?? null,
        isPublished: false,
        level: metadata.level ?? parsed.level ?? null,
        access: metadata.access ?? parsed.access ?? null,
      } as any,
    });

    return { data: course };
  }
}
