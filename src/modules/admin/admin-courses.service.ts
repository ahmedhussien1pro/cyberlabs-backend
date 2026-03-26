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
import { readFileSync, existsSync, readdirSync, writeFileSync } from 'fs';
import { join } from 'path';

// ─── helpers ───────────────────────────────────────────────────────────────────
function generateSlug(base: string): string {
  return base
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 80);
}

/** Derive isPublished from state to keep both fields in sync */
function isPublishedFromState(state: string): boolean {
  return state === 'PUBLISHED';
}

function safeNumber(val: any, fallback = 0): number {
  const n = Number(val);
  return isNaN(n) ? fallback : n;
}

// ─── JSON curriculum helpers (same logic as courses.service getCurriculum) ─────
const COURSE_DATA_DIR = join(process.cwd(), 'prisma/seed-data/course-data');

function normalizeName(s: string) {
  return s.toLowerCase().replace(/[-_\s&.,!()'"\+]/g, '');
}

/**
 * Try to find the JSON file for a course by slug or title.
 * Returns parsed JSON or null.
 */
function readCourseJson(slug: string, title: string): any | null {
  const exact = [
    join(COURSE_DATA_DIR, `${slug}.json`),
    join(COURSE_DATA_DIR, `${title}.json`),
  ];
  for (const p of exact) {
    if (existsSync(p)) {
      try {
        return JSON.parse(readFileSync(p, 'utf-8'));
      } catch {
        /* skip */
      }
    }
  }

  // fuzzy match
  let files: string[];
  try {
    files = readdirSync(COURSE_DATA_DIR).filter(
      (f) => f.endsWith('.json') && !f.endsWith('.ts'),
    );
  } catch {
    return null;
  }

  const slugNorm = normalizeName(slug);
  const titleNorm = normalizeName(title);

  for (const file of files) {
    const fileNorm = normalizeName(file.replace('.json', ''));
    if (
      fileNorm === slugNorm ||
      fileNorm === titleNorm ||
      fileNorm.includes(slugNorm) ||
      slugNorm.includes(fileNorm) ||
      fileNorm.includes(titleNorm) ||
      titleNorm.includes(fileNorm)
    ) {
      try {
        return JSON.parse(readFileSync(join(COURSE_DATA_DIR, file), 'utf-8'));
      } catch {
        return null;
      }
    }
  }
  return null;
}

/**
 * Write (or overwrite) the JSON file for a course.
 * Writes BOTH slug.json and title.json so readCourseJson always finds it.
 */
function writeCourseJson(slug: string, title: string, data: any): void {
  const content = JSON.stringify(data, null, 2);
  // Write by slug (primary — readCourseJson checks slug first)
  try {
    writeFileSync(join(COURSE_DATA_DIR, `${slug}.json`), content, 'utf-8');
  } catch (e: any) {
    console.warn(`[writeCourseJson] Could not write slug file:`, e?.message);
  }
  // Write by title as fallback (legacy lookups)
  if (title !== slug) {
    try {
      writeFileSync(join(COURSE_DATA_DIR, `${title}.json`), content, 'utf-8');
    } catch {
      /* non-critical */
    }
  }
}

/**
 * FIX: Parse full elements array from a lesson's content field.
 * saveCurriculum stores the entire elements JSON in content.
 * If content is not a JSON array, return a single legacy element.
 */
function parseElementsFromLesson(lesson: any): any[] {
  if (!lesson.content) return [];
  try {
    const parsed = JSON.parse(lesson.content);
    if (Array.isArray(parsed)) return parsed;
  } catch {
    /* not JSON — legacy plain-text content */
  }
  // Legacy fallback: reconstruct a minimal element from lesson fields
  const typeRaw = (lesson.type ?? 'ARTICLE').toString().toUpperCase();
  if (typeRaw === 'VIDEO') {
    return [
      {
        id: lesson.id,
        type: 'video',
        url: lesson.videoUrl ?? '',
        title: { en: lesson.title ?? '', ar: lesson.ar_title ?? '' },
        duration: lesson.duration ?? 0,
        isPreview: lesson.isPreview ?? false,
      },
    ];
  }
  if (lesson.content) {
    return [
      { id: lesson.id, type: 'text', value: { en: lesson.content, ar: '' } },
    ];
  }
  return [];
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
      id: true,
      title: true,
      order: true,
      lessons: {
        orderBy: { order: 'asc' as const },
        select: { id: true, title: true, order: true },
      },
    },
  },
};

// ─── List select now includes all fields needed by the admin card ─────────────
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
  contentType: true,
  isPublished: true,
  isFeatured: true,
  isNew: true,
  estimatedHours: true,
  tags: true,
  skills: true,
  ar_skills: true,
  topics: true,
  ar_topics: true,
  prerequisites: true,
  ar_prerequisites: true,
  // description fields — needed by admin card
  description: true,
  ar_description: true,
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
    raw._count?.sections ?? raw.totalTopics ?? raw.sections?.length ?? 0;

  const { _count, courseLabs, ...rest } = raw;

  const state: string = rest.state ?? 'DRAFT';

  return {
    ...rest,
    state,
    isPublished: isPublishedFromState(state),
    enrollmentCount,
    totalTopics,
    labSlugs,
    tags: Array.isArray(rest.tags) ? rest.tags : [],
    skills: Array.isArray(rest.skills) ? rest.skills : [],
    ar_skills: Array.isArray(rest.ar_skills) ? rest.ar_skills : [],
    topics: Array.isArray(rest.topics) ? rest.topics : [],
    ar_topics: Array.isArray(rest.ar_topics) ? rest.ar_topics : [],
    prerequisites: Array.isArray(rest.prerequisites) ? rest.prerequisites : [],
    ar_prerequisites: Array.isArray(rest.ar_prerequisites)
      ? rest.ar_prerequisites
      : [],
  };
}

@Injectable()
export class AdminCoursesService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Stats ─────────────────────────────────────────────────────────────
  async getStats() {
    const [total, published, comingSoon, featured] = await Promise.all([
      this.prisma.course.count(),
      this.prisma.course.count({ where: { state: 'PUBLISHED' } }),
      this.prisma.course.count({ where: { state: 'COMING_SOON' } }),
      this.prisma.course.count({ where: { isFeatured: true } }),
    ]);
    const draft = Math.max(0, total - published - comingSoon);

    // Build byState breakdown dynamically from all distinct state values
    const stateGroups = await this.prisma.course.groupBy({
      by: ['state'],
      _count: { _all: true },
    });
    const byState: Record<string, number> = {};
    for (const row of stateGroups) {
      byState[row.state] = row._count._all;
    }

    return {
      data: {
        total,
        published,
        draft,
        comingSoon,
        featured,
        unpublished: total - published,
        byState,
      },
    };
  }

  // ─── List ────────────────────────────────────────────────────────────────
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
    if ((query as any).state && (query as any).state !== 'all') {
      where.state = (query as any).state;
    }
    if (query.difficulty) where.difficulty = query.difficulty;
    if (query.access) where.access = query.access;

    const [rows, total] = await Promise.all([
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
      data: rows.map(normalizeCourse),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  // ─── Single (id or slug) ───────────────────────────────────────────────────
  async findOne(idOrSlug: string) {
    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        idOrSlug,
      );

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

  // ─── Get Curriculum ──────────────────────────────────────────────────────
  async getCurriculum(idOrSlug: string) {
    const { data: course } = await this.findOne(idOrSlug);

    // JSON file takes priority (single source of truth after save)
    const json = readCourseJson(course.slug, course.title);
    if (json) {
      const topics = json.topics ?? [];
      return {
        data: {
          topics,
          totalTopics: topics.length,
          landingData: json.landingData ?? null,
          courseId: course.id,
          courseSlug: course.slug,
          courseTitle: course.title,
          source: 'json' as const,
        },
      };
    }

    // FIX: DB fallback — restore full elements from content JSON
    const dbCourse = await (this.prisma.course as any).findUnique({
      where: { id: course.id },
      select: {
        sections: {
          orderBy: { order: 'asc' as const },
          select: {
            id: true,
            title: true,
            ar_title: true,
            order: true,
            lessons: {
              orderBy: { order: 'asc' as const },
              select: {
                id: true,
                title: true,
                ar_title: true,
                order: true,
                type: true,
                duration: true,
                videoUrl: true,
                isPreview: true,
                // FIX: content stores the full elements JSON array
                content: true,
              },
            },
          },
        },
      },
    });

    const topics = ((dbCourse?.sections ?? []) as any[]).map((sec: any) => ({
      id: sec.id,
      title: { en: sec.title ?? '', ar: sec.ar_title ?? '' },
      // FIX: each lesson's content field holds the full elements array for that topic
      // The first lesson per section stores ALL elements for that topic (sentinel lesson)
      // For backwards compat we also try per-lesson element reconstruction
      elements: (() => {
        const lessons: any[] = sec.lessons ?? [];
        if (lessons.length === 0) return [];
        // Try to decode the sentinel lesson (first lesson, index 0)
        // saveCurriculum stores __elements__ JSON in the first lesson's content
        const sentinel = lessons[0];
        if (sentinel?.content) {
          try {
            const parsed = JSON.parse(sentinel.content);
            if (Array.isArray(parsed)) return parsed;
          } catch {
            /* not JSON */
          }
        }
        // Fallback: reconstruct from individual lessons
        return lessons.flatMap((l: any) => parseElementsFromLesson(l));
      })(),
    }));

    return {
      data: {
        topics,
        totalTopics: topics.length,
        landingData: null,
        courseId: course.id,
        courseSlug: course.slug,
        courseTitle: course.title,
        source: 'db' as const,
      },
    };
  }

  // ─── Save Curriculum ─────────────────────────────────────────────────────
  async saveCurriculum(idOrSlug: string, rawTopics: object[]) {
    const { data: existing } = await this.findOne(idOrSlug);
    const courseId = existing.id;
    const courseTitle = existing.title;
    const courseSlug = existing.slug;

    const topicTitles: string[] = (rawTopics as any[])
      .map((t) => (typeof t.title === 'object' ? t.title?.en : t.title) ?? '')
      .filter(Boolean);

    const arTopicTitles: string[] = (rawTopics as any[])
      .map((t) => (typeof t.title === 'object' ? t.title?.ar : '') ?? '')
      .filter(Boolean);

    await (this.prisma.course as any).update({
      where: { id: courseId },
      data: {
        topics: topicTitles,
        ar_topics: arTopicTitles,
        totalTopics: topicTitles.length,
      },
    });

    await this.prisma.lesson.deleteMany({ where: { courseId } });
    await this.prisma.section.deleteMany({ where: { courseId } });
    await (this.prisma as any).module.deleteMany({ where: { courseId } });

    for (let sIdx = 0; sIdx < (rawTopics as any[]).length; sIdx++) {
      const topic = (rawTopics as any[])[sIdx];
      const order = sIdx + 1;

      const sTitle =
        typeof topic.title === 'object'
          ? (topic.title?.en ?? `Section ${order}`)
          : (topic.title ?? `Section ${order}`);
      const sTitleAr =
        typeof topic.title === 'object' ? topic.title?.ar : undefined;

      const [section, mod] = await Promise.all([
        this.prisma.section.create({
          data: {
            courseId,
            title: sTitle,
            ...(sTitleAr ? { ar_title: sTitleAr } : {}),
            order,
          },
        }),
        (this.prisma as any).module.create({
          data: {
            courseId,
            title: sTitle,
            ...(sTitleAr ? { ar_title: sTitleAr } : {}),
            order,
          },
        }),
      ]);

      const elements: any[] = topic.elements ?? [];

      // FIX: Store full elements array as JSON in the sentinel lesson's content.
      // This preserves ALL rich element data (text, image, table, terminal, note…)
      // so getCurriculum DB fallback can restore them exactly.
      const sentinelTitle =
        typeof topic.title === 'object'
          ? (topic.title?.en ?? `Section ${order}`)
          : (topic.title ?? `Section ${order}`);

      await this.prisma.lesson.create({
        data: {
          courseId,
          sectionId: section.id,
          moduleId: mod.id,
          title: sentinelTitle,
          ...(sTitleAr ? { ar_title: sTitleAr } : {}),
          order: 0,
          type: 'ARTICLE',
          duration: 0,
          // FIX: serialize full elements array here
          content: JSON.stringify(elements),
        },
      });

      // Also create individual lesson rows for VIDEO elements
      // so progress tracking / platform lesson list still works
      for (let eIdx = 0; eIdx < elements.length; eIdx++) {
        const el = elements[eIdx];
        if ((el.type ?? '').toString().toUpperCase() !== 'VIDEO') continue;

        const lessonOrder = safeNumber(el.order, eIdx + 1);
        const lTitle =
          typeof el.title === 'object'
            ? (el.title?.en ?? `Lesson ${lessonOrder}`)
            : (el.title ?? `Lesson ${lessonOrder}`);
        const lTitleAr =
          typeof el.title === 'object' ? el.title?.ar : undefined;

        await this.prisma.lesson.create({
          data: {
            courseId,
            sectionId: section.id,
            moduleId: mod.id,
            title: lTitle,
            ...(lTitleAr ? { ar_title: lTitleAr } : {}),
            order: lessonOrder,
            type: 'VIDEO',
            duration: safeNumber(el.duration, 0),
            content: '',
            videoUrl: el.videoUrl ?? el.url ?? el.video_url ?? null,
          },
        });
      }
    }

    // FIX: write JSON file by BOTH slug and title so readCourseJson always finds it
    const existingJson = readCourseJson(courseSlug, courseTitle);
    const updatedJson = {
      landingData: existingJson?.landingData ?? null,
      topics: rawTopics,
    };
    writeCourseJson(courseSlug, courseTitle, updatedJson);

    return {
      data: {
        topics: topicTitles,
        ar_topics: arTopicTitles,
        totalTopics: topicTitles.length,
      },
    };
  }

  // ─── Create ───────────────────────────────────────────────────────────────
  async create(dto: CreateCourseDto) {
    const slug = (dto as any).slug ?? generateSlug(dto.title);
    const existing = await this.prisma.course.findUnique({ where: { slug } });
    if (existing)
      throw new BadRequestException(`Slug "${slug}" already exists`);

    const state = (dto as any).state ?? 'DRAFT';
    const isPublished = isPublishedFromState(state);

    const course = await this.prisma.course.create({
      data: { ...dto, slug, state, isPublished } as any,
    });
    return { data: normalizeCourse(course) };
  }

  // ─── Update ───────────────────────────────────────────────────────────────
  async update(idOrSlug: string, dto: UpdateCourseDto) {
    const { data: existing } = await this.findOne(idOrSlug);

    const updateData: any = { ...dto };
    if (updateData.state !== undefined) {
      updateData.isPublished = isPublishedFromState(updateData.state);
    }
    if (
      updateData.isPublished !== undefined &&
      updateData.state === undefined
    ) {
      updateData.state = updateData.isPublished ? 'PUBLISHED' : 'DRAFT';
    }

    const updated = await (this.prisma.course as any).update({
      where: { id: existing.id },
      data: updateData,
      select: COURSE_FULL_SELECT,
    });
    return { data: normalizeCourse(updated) };
  }

  // ─── Update Curriculum (sections model — legacy) ─────────────────────────
  async updateCurriculum(idOrSlug: string, dto: UpdateCurriculumDto) {
    const { data: existing } = await this.findOne(idOrSlug);
    const id = existing.id;
    const sections: any[] = (dto as any).sections ?? [];

    await this.prisma.$transaction(async (tx) => {
      await (tx as any).section.deleteMany({ where: { courseId: id } });
      for (const [si, section] of sections.entries()) {
        const sec = await (tx as any).section.create({
          data: {
            courseId: id,
            title: section.title,
            order: section.order ?? si,
          },
        });
        for (const [li, lesson] of (
          (section.lessons ?? section.modules ?? []) as any[]
        ).entries()) {
          await (tx as any).lesson.create({
            data: {
              sectionId: sec.id,
              courseId: id,
              title: lesson.title,
              order: lesson.order ?? li,
              content: lesson.content ?? '',
              videoUrl: lesson.videoUrl ?? null,
              moduleId: await ensureDefaultModule(tx as any, id, sec.id, si),
            },
          });
        }
      }
    });

    return this.findOne(id);
  }

  // ─── Publish ─────────────────────────────────────────────────────────────
  async publish(idOrSlug: string) {
    const { data: existing } = await this.findOne(idOrSlug);
    const updated = await (this.prisma.course as any).update({
      where: { id: existing.id },
      data: { isPublished: true, state: 'PUBLISHED' },
      select: COURSE_FULL_SELECT,
    });
    return { data: normalizeCourse(updated) };
  }

  // ─── Unpublish ────────────────────────────────────────────────────────────
  async unpublish(idOrSlug: string) {
    const { data: existing } = await this.findOne(idOrSlug);
    const updated = await (this.prisma.course as any).update({
      where: { id: existing.id },
      data: { isPublished: false, state: 'DRAFT' },
      select: COURSE_FULL_SELECT,
    });
    return { data: normalizeCourse(updated) };
  }

  // ─── Delete ───────────────────────────────────────────────────────────────
  async remove(idOrSlug: string) {
    const { data: existing } = await this.findOne(idOrSlug);
    await this.prisma.course.delete({ where: { id: existing.id } });
    return { data: { success: true, message: 'Course deleted successfully' } };
  }

  // ─── Duplicate ────────────────────────────────────────────────────────────
  async duplicate(idOrSlug: string) {
    const { data: original } = await this.findOne(idOrSlug);

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
      labSlugs: _l,
      enrollmentCount: _e,
      totalTopics: _t,
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
          state: 'DRAFT',
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
        const mid = await ensureDefaultModule(
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
              moduleId: mid,
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
            lab: {
              select: {
                id: true,
                slug: true,
                title: true,
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

    const state = meta.state ?? 'DRAFT';
    const title = meta.title ?? parsed.title ?? slug;

    const course = await this.prisma.course.create({
      data: {
        title,
        slug,
        description: meta.description ?? parsed.description ?? null,
        thumbnail: meta.thumbnail ?? parsed.thumbnail ?? null,
        state,
        isPublished: isPublishedFromState(state),
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

    if (
      parsed.topics &&
      Array.isArray(parsed.topics) &&
      parsed.topics.length > 0
    ) {
      try {
        await this.saveCurriculum(course.id, parsed.topics);
      } catch (e: any) {
        console.warn(`[ImportJSON] saveCurriculum failed:`, e?.message);
        // FIX: even if saveCurriculum fails, persist the raw JSON so getCurriculum
        // can still serve it from the JSON file fallback
        try {
          writeCourseJson(slug, title, parsed);
        } catch {
          /* ignore */
        }
      }
    } else {
      // No topics array — write the full JSON as-is
      try {
        writeCourseJson(slug, title, parsed);
      } catch (e: any) {
        console.warn(`[ImportJSON] writeCourseJson failed:`, e?.message);
      }
    }

    return { data: normalizeCourse(course) };
  }
}

// ─── Helper ───────────────────────────────────────────────────────────────────
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
