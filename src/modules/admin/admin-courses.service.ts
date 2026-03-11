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

const COURSE_FULL_SELECT = {
  id: true,
  slug: true,
  title: true,
  ar_title: true,
  description: true,
  ar_description: true,
  longDescription: true,
  ar_longDescription: true,
  image: true,
  thumbnail: true,
  color: true,
  access: true,
  state: true,
  difficulty: true,
  category: true,
  contentType: true,
  estimatedHours: true,
  isFeatured: true,
  isNew: true,
  isPublished: true,
  labsLink: true,
  tags: true,
  skills: true,
  ar_skills: true,
  topics: true,
  ar_topics: true,
  prerequisites: true,
  ar_prerequisites: true,
  instructorId: true,
  createdAt: true,
  updatedAt: true,
  _count: { select: { enrollments: true } },
  courseLabs: {
    orderBy: { order: 'asc' as const },
    select: { lab: { select: { id: true, slug: true, title: true } } },
  },
  sections: {
    orderBy: { order: 'asc' as const },
    select: {
      id: true, title: true, order: true,
      lessons: {
        orderBy: { order: 'asc' as const },
        select: { id: true, title: true, order: true },
      },
    },
  },
};

const COURSE_LIST_SELECT = {
  id: true,
  title: true,
  ar_title: true,
  slug: true,
  thumbnail: true,
  image: true,
  color: true,
  access: true,
  state: true,
  difficulty: true,
  category: true,
  isPublished: true,
  isFeatured: true,
  isNew: true,
  estimatedHours: true,
  tags: true,
  skills: true,
  createdAt: true,
  updatedAt: true,
  _count: { select: { enrollments: true, sections: true } },
  courseLabs: { select: { lab: { select: { slug: true } } } },
};

function normalizeCourse(raw: any): any {
  const labSlugs: string[] = (raw.courseLabs ?? [])
    .map((cl: any) => cl.lab?.slug ?? '')
    .filter(Boolean);

  const enrollmentCount = raw._count?.enrollments ?? raw.enrollmentCount ?? 0;
  const totalTopics =
    raw._count?.sections ?? raw.totalTopics ?? (raw.sections?.length ?? 0);

  const { _count, courseLabs, ...rest } = raw;

  // Derive state: if isPublished=true always show PUBLISHED regardless of stored state
  const state = rest.isPublished
    ? 'PUBLISHED'
    : rest.state && rest.state !== 'PUBLISHED'
      ? rest.state
      : 'DRAFT';

  return {
    ...rest,
    state,
    enrollmentCount,
    totalTopics,
    labSlugs,
    tags:             Array.isArray(rest.tags)             ? rest.tags             : [],
    skills:           Array.isArray(rest.skills)           ? rest.skills           : [],
    ar_skills:        Array.isArray(rest.ar_skills)        ? rest.ar_skills        : [],
    topics:           Array.isArray(rest.topics)           ? rest.topics           : [],
    ar_topics:        Array.isArray(rest.ar_topics)        ? rest.ar_topics        : [],
    prerequisites:    Array.isArray(rest.prerequisites)    ? rest.prerequisites    : [],
    ar_prerequisites: Array.isArray(rest.ar_prerequisites) ? rest.ar_prerequisites : [],
  };
}

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
        draft: total - published,
        comingSoon: 0,
        featured: 0,
      },
    };
  }

  // ─── List ──────────────────────────────────────────────────────────────────
  async findAll(query: AdminCourseQueryDto) {
    const page  = Math.max(1, query.page  ?? 1);
    const limit = Math.min(100, Math.max(1, query.limit ?? 20));
    const skip  = (page - 1) * limit;

    const where: any = {};
    if (query.search) {
      where.OR = [
        { title:    { contains: query.search, mode: 'insensitive' } },
        { slug:     { contains: query.search, mode: 'insensitive' } },
        { ar_title: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    if (query.isPublished !== undefined) {
      where.isPublished =
        query.isPublished === true || query.isPublished === ('true' as any);
    }
    if (query.difficulty) where.difficulty = query.difficulty;
    if (query.access)     where.access     = query.access;

    const [rows, total] = await Promise.all([
      this.prisma.course.findMany({
        where, skip, take: limit,
        orderBy: { createdAt: 'desc' },
        select: COURSE_LIST_SELECT,
      }),
      this.prisma.course.count({ where }),
    ]);

    return {
      data: rows.map(normalizeCourse),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  // ─── Single (id or slug) ───────────────────────────────────────────────────
  async findOne(idOrSlug: string) {
    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);

    let raw: any = null;

    if (isUuid) {
      raw = await (this.prisma.course as any).findUnique({
        where: { id: idOrSlug },
        select: COURSE_FULL_SELECT,
      });
    }

    if (!raw) {
      raw = await (this.prisma.course as any).findUnique({
        where: { slug: idOrSlug },
        select: COURSE_FULL_SELECT,
      });
    }

    if (!raw) throw new NotFoundException(`Course "${idOrSlug}" not found`);

    return { data: normalizeCourse(raw) };
  }

  // ─── Get Curriculum ────────────────────────────────────────────────────────
  async getCurriculum(idOrSlug: string) {
    const { data: course } = await this.findOne(idOrSlug);
    const topics = Array.isArray(course.topics) ? course.topics : [];
    return {
      data: {
        topics,
        totalTopics: topics.length,
        courseId:    course.id,
        courseSlug:  course.slug,
        courseTitle: course.title,
        landingData: null,
      },
    };
  }

  // ─── Save Curriculum ───────────────────────────────────────────────────────
  async saveCurriculum(idOrSlug: string, topics: object[]) {
    const { data: existing } = await this.findOne(idOrSlug);
    const updated = await (this.prisma.course as any).update({
      where: { id: existing.id },
      data: { topics },
    });
    return {
      data: {
        topics:      Array.isArray(updated.topics) ? updated.topics : [],
        totalTopics: Array.isArray(updated.topics) ? updated.topics.length : 0,
      },
    };
  }

  // ─── Create ────────────────────────────────────────────────────────────────
  async create(dto: CreateCourseDto) {
    const slug = (dto as any).slug ?? generateSlug(dto.title);
    const existing = await this.prisma.course.findUnique({ where: { slug } });
    if (existing) throw new BadRequestException(`Slug "${slug}" already exists`);
    const course = await this.prisma.course.create({
      data: { ...dto, slug, isPublished: (dto as any).isPublished ?? false } as any,
    });
    return { data: normalizeCourse(course) };
  }

  // ─── Update ────────────────────────────────────────────────────────────────
  async update(idOrSlug: string, dto: UpdateCourseDto) {
    const { data: existing } = await this.findOne(idOrSlug);
    const updated = await (this.prisma.course as any).update({
      where: { id: existing.id },
      data: dto as any,
      select: COURSE_FULL_SELECT,
    });
    return { data: normalizeCourse(updated) };
  }

  // ─── Update Curriculum (sections model — legacy) ───────────────────────────
  async updateCurriculum(idOrSlug: string, dto: UpdateCurriculumDto) {
    const { data: existing } = await this.findOne(idOrSlug);
    const id = existing.id;
    const sections: any[] = (dto as any).sections ?? [];

    await this.prisma.$transaction(async (tx) => {
      await (tx as any).section.deleteMany({ where: { courseId: id } });
      for (const [si, section] of sections.entries()) {
        const sec = await (tx as any).section.create({
          data: { courseId: id, title: section.title, order: section.order ?? si },
        });
        for (const [li, lesson] of ((section.lessons ?? section.modules ?? []) as any[]).entries()) {
          await (tx as any).lesson.create({
            data: {
              sectionId: sec.id,
              courseId:  id,
              title:     lesson.title,
              order:     lesson.order ?? li,
              content:   lesson.content ?? '',
              videoUrl:  lesson.videoUrl ?? null,
              moduleId:  await ensureDefaultModule(tx as any, id, sec.id, si),
            },
          });
        }
      }
    });

    return this.findOne(id);
  }

  // ─── Publish ───────────────────────────────────────────────────────────────
  async publish(idOrSlug: string) {
    const { data: existing } = await this.findOne(idOrSlug);
    const updated = await (this.prisma.course as any).update({
      where: { id: existing.id },
      // Update both isPublished AND state so both fields are consistent
      data: { isPublished: true, state: 'PUBLISHED' },
      select: COURSE_FULL_SELECT,
    });
    return { data: normalizeCourse(updated) };
  }

  // ─── Unpublish ─────────────────────────────────────────────────────────────
  async unpublish(idOrSlug: string) {
    const { data: existing } = await this.findOne(idOrSlug);
    const updated = await (this.prisma.course as any).update({
      where: { id: existing.id },
      // Revert to DRAFT when unpublishing
      data: { isPublished: false, state: 'DRAFT' },
      select: COURSE_FULL_SELECT,
    });
    return { data: normalizeCourse(updated) };
  }

  // ─── Delete ────────────────────────────────────────────────────────────────
  async remove(idOrSlug: string) {
    const { data: existing } = await this.findOne(idOrSlug);
    await this.prisma.course.delete({ where: { id: existing.id } });
    return { data: { success: true, message: 'Course deleted successfully' } };
  }

  // ─── Duplicate ─────────────────────────────────────────────────────────────
  async duplicate(idOrSlug: string) {
    const { data: original } = await this.findOne(idOrSlug);

    const baseSlug = `${original.slug}-copy`;
    let candidateSlug = baseSlug;
    let attempt = 0;
    while (await this.prisma.course.findUnique({ where: { slug: candidateSlug } })) {
      attempt++;
      candidateSlug = `${baseSlug}-${attempt}`;
    }

    const {
      id: _id, createdAt: _c, updatedAt: _u,
      sections, labSlugs: _l, enrollmentCount: _e, totalTopics: _t,
      ...rest
    } = original as any;

    const copy = await this.prisma.$transaction(async (tx) => {
      const newCourse = await (tx as any).course.create({
        data: {
          ...rest,
          title:       `${original.title} (Copy)`,
          ar_title:    original.ar_title ? `${original.ar_title} (نسخة)` : undefined,
          slug:        candidateSlug,
          isPublished: false,
          state:       'DRAFT',
        },
      });
      for (const [si, section] of ((sections ?? []) as any[]).entries()) {
        const sec = await (tx as any).section.create({
          data: { courseId: newCourse.id, title: section.title, order: section.order ?? si },
        });
        const mid = await ensureDefaultModule(tx as any, newCourse.id, sec.id, si);
        for (const [li, lesson] of ((section.lessons ?? []) as any[]).entries()) {
          await (tx as any).lesson.create({
            data: {
              sectionId: sec.id,
              courseId:  newCourse.id,
              moduleId:  mid,
              title:     lesson.title,
              order:     lesson.order ?? li,
              content:   lesson.content ?? '',
              videoUrl:  lesson.videoUrl ?? null,
            },
          });
        }
      }
      return newCourse;
    });

    return { data: normalizeCourse(copy) };
  }

  // ─── Course ↔ Lab ─────────────────────────────────────────────────────────
  async getCourseLabs(courseId: string) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      include: {
        courseLabs: {
          orderBy: { order: 'asc' },
          include: {
            lab: { select: { id: true, title: true, slug: true, difficulty: true, isPublished: true } },
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
        this.prisma.courseLab.updateMany({ where: { courseId, labId }, data: { order: idx } }),
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
      include: {
        lab: { select: { id: true, title: true, slug: true, difficulty: true, isPublished: true } },
      },
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
    const meta = metadata as any;
    const slug = meta.slug ?? generateSlug(meta.title ?? parsed.title ?? 'untitled');
    const existing = await this.prisma.course.findUnique({ where: { slug } });
    if (existing) throw new BadRequestException(`Slug "${slug}" already taken`);

    const course = await this.prisma.course.create({
      data: {
        title:       meta.title       ?? parsed.title,
        slug,
        description: meta.description ?? parsed.description ?? null,
        thumbnail:   meta.thumbnail   ?? parsed.thumbnail   ?? null,
        isPublished: false,
        state:       'DRAFT',
        difficulty:  meta.difficulty  ?? meta.level ?? parsed.difficulty ?? parsed.level ?? null,
        access:      meta.access      ?? parsed.access ?? null,
        instructorId: meta.instructorId ?? parsed.instructorId,
      } as any,
    });

    return { data: normalizeCourse(course) };
  }
}

// ─── Helper ────────────────────────────────────────────────────────────────
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
    data: { courseId, title: 'Default Module', order },
  });
  return mod.id;
}
