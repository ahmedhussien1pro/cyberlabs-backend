// src/modules/admin/admin-courses.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../core/database';
import { AdminCourseQueryDto } from './dto/admin-course-query.dto';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { ImportCourseDto } from './dto/import-course.dto';
import { UpdateCurriculumDto } from './dto/update-curriculum.dto';

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
  difficulty: true,
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
    // 'level' does not exist on Course — the schema uses 'difficulty'
    if (query.difficulty) where.difficulty = query.difficulty;
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
        // Schema: Course -> Section[] -> Lesson[]
        // Section model has no 'modules' relation; lessons belong directly to sections
        sections: {
          orderBy: { order: 'asc' },
          include: {
            lessons: { orderBy: { order: 'asc' } },
          },
        },
      },
    });
    if (!course) throw new NotFoundException(`Course ${id} not found`);
    return { data: course };
  }

  // ─── Create ────────────────────────────────────────────────────────────────
  async create(dto: CreateCourseDto) {
    const slug = (dto as any).slug ?? generateSlug(dto.title);
    const existing = await this.prisma.course.findUnique({ where: { slug } });
    if (existing) {
      throw new BadRequestException(`Slug "${slug}" already exists`);
    }
    const course = await this.prisma.course.create({
      data: {
        ...dto,
        slug,
        isPublished: (dto as any).isPublished ?? false,
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
  // Schema: Course -> Section[] -> Lesson[]
  // There are no CourseSection / CourseSectionModule / CourseSectionModuleLesson models.
  // Sections belong to courses; lessons belong to sections (and modules).
  async updateCurriculum(id: string, dto: UpdateCurriculumDto) {
    await this.findOne(id);
    const dtoAny = dto as any;
    const sections: any[] = dtoAny.sections ?? [];

    await this.prisma.$transaction(async (tx) => {
      // Delete existing sections (cascade deletes lessons)
      await (tx as any).section.deleteMany({ where: { courseId: id } });

      for (const [si, section] of sections.entries()) {
        const sec = await (tx as any).section.create({
          data: {
            courseId: id,
            title: section.title,
            order: section.order ?? si,
          },
        });

        for (const [_li, lesson] of (
          (section.lessons ?? section.modules ?? []) as any[]
        ).entries()) {
          await (tx as any).lesson.create({
            data: {
              sectionId: sec.id,
              courseId: id,
              // Lessons also require moduleId — use a default module per section if schema demands
              title: lesson.title,
              order: lesson.order ?? _li,
              content: lesson.content ?? '',
              videoUrl: lesson.videoUrl ?? null,
              // moduleId is required by schema; create a default module for the section
              moduleId: await ensureDefaultModule(tx as any, id, sec.id, si),
            },
          });
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

    const baseSlug = `${original.slug}-copy`;
    let candidateSlug = baseSlug;
    let attempt = 0;
    while (
      await this.prisma.course.findUnique({ where: { slug: candidateSlug } })
    ) {
      attempt++;
      candidateSlug = `${baseSlug}-${attempt}`;
    }

    const {
      id: _id,
      createdAt: _c,
      updatedAt: _u,
      sections,
      _count,
      ...rest
    } = original as any;

    const copy = await this.prisma.$transaction(async (tx) => {
      const newCourse = await (tx as any).course.create({
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

      for (const [si, section] of ((sections ?? []) as any[]).entries()) {
        const sec = await (tx as any).section.create({
          data: {
            courseId: newCourse.id,
            title: section.title,
            order: section.order ?? si,
          },
        });
        const defaultModuleId = await ensureDefaultModule(
          tx as any,
          newCourse.id,
          sec.id,
          si,
        );
        for (const [li, lesson] of (
          (section.lessons ?? []) as any[]
        ).entries()) {
          await (tx as any).lesson.create({
            data: {
              sectionId: sec.id,
              courseId: newCourse.id,
              moduleId: defaultModuleId,
              title: lesson.title,
              order: lesson.order ?? li,
              content: lesson.content ?? '',
              videoUrl: lesson.videoUrl ?? null,
            },
          });
        }
      }
      return newCourse;
    });

    return { data: copy };
  }

  // ─── Course ↔ Lab relations ────────────────────────────────────────────────
  // Schema: CourseLab join table (courseId, labId, order)
  async getCourseLabs(courseId: string) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      include: {
        courseLabs: {
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
    if (!course) throw new NotFoundException(`Course ${courseId} not found`);
    return { data: course.courseLabs };
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
    if (existing)
      throw new BadRequestException('Lab already attached to this course');
    const count = await this.prisma.courseLab.count({ where: { courseId } });
    const record = await this.prisma.courseLab.create({
      data: { courseId, labId, order: count },
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
    });
    return { data: record };
  }

  async detachLab(courseId: string, labId: string) {
    const record = await this.prisma.courseLab.findUnique({
      where: { courseId_labId: { courseId, labId } },
    });
    if (!record) throw new NotFoundException('Lab not attached to this course');
    await this.prisma.courseLab.delete({
      where: { courseId_labId: { courseId, labId } },
    });
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
    const meta = metadata as any;
    const slug =
      meta.slug ?? generateSlug(meta.title ?? parsed.title ?? 'untitled');
    const existing = await this.prisma.course.findUnique({ where: { slug } });
    if (existing) throw new BadRequestException(`Slug "${slug}" already taken`);

    const course = await this.prisma.course.create({
      data: {
        title: meta.title ?? parsed.title,
        slug,
        description: meta.description ?? parsed.description ?? null,
        thumbnail: meta.thumbnail ?? parsed.thumbnail ?? null,
        isPublished: false,
        difficulty:
          meta.difficulty ??
          meta.level ??
          parsed.difficulty ??
          parsed.level ??
          null,
        access: meta.access ?? parsed.access ?? null,
        instructorId: meta.instructorId ?? parsed.instructorId,
      } as any,
    });

    return { data: course };
  }
}

// ─── Helper: ensure a default Module exists for a section ─────────────────────
// Lesson model requires moduleId (not nullable in schema).
async function ensureDefaultModule(
  tx: any,
  courseId: string,
  sectionId: string,
  order: number,
): Promise<string> {
  const existing = await tx.module.findFirst({
    where: { courseId, id: { contains: sectionId } },
  });
  if (existing) return existing.id;
  const mod = await tx.module.create({
    data: {
      courseId,
      title: 'Default Module',
      order,
    },
  });
  return mod.id;
}
