import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { STATE } from '@prisma/client';
import { PrismaService } from '../../core/database';
import { AdminCourseQueryDto } from './dto/admin-course-query.dto';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { ImportCourseDto } from './dto/import-course.dto';
import { UpdateCurriculumDto } from './dto/update-curriculum.dto';

/** Shared Prisma select for admin course list rows */
const COURSE_LIST_SELECT = {
  id: true,
  slug: true,
  title: true,
  ar_title: true,
  thumbnail: true,
  difficulty: true,
  category: true,
  access: true,
  state: true,
  isPublished: true,
  isFeatured: true,
  isNew: true,
  price: true,
  enrollmentCount: true,
  averageRating: true,
  reviewCount: true,
  createdAt: true,
  updatedAt: true,
  instructor: {
    select: { id: true, name: true, avatarUrl: true },
  },
  _count: {
    select: { enrollments: true, sections: true, lessons: true },
  },
} as const;

/** Shared Prisma select for Lab rows inside CourseLab responses */
const LAB_SELECT = {
  id: true,
  title: true,
  slug: true,
  difficulty: true,
  category: true,
  imageUrl: true,   // Lab model uses imageUrl, NOT thumbnail
  isPublished: true,
} as const;

interface CourseJsonElement {
  title: { en: string; ar?: string };
  type?: string;
  order?: number;
  duration?: number;
  content?: string;
  videoUrl?: string;
}

interface CourseJsonTopic {
  title: { en: string; ar?: string };
  description?: { en?: string; ar?: string };
  elements?: CourseJsonElement[];
}

interface CourseJsonData {
  landingData: {
    title: { en: string; ar?: string };
    description?: { en?: string; ar?: string };
    longDescription?: { en?: string; ar?: string };
  };
  topics: CourseJsonTopic[];
}

@Injectable()
export class AdminCoursesService {
  constructor(private readonly prisma: PrismaService) {}

  // ───────────────────────────────────────────────────────────────────
  // GET /admin/courses
  // ───────────────────────────────────────────────────────────────────
  async findAll(query: AdminCourseQueryDto) {
    const {
      page = 1,
      limit = 20,
      search,
      difficulty,
      category,
      access,
      state,
      isPublished,
    } = query;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { ar_title: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (difficulty) where.difficulty = difficulty;
    if (category) where.category = category;
    if (access) where.access = access;
    if (state) where.state = state;
    if (isPublished !== undefined) where.isPublished = isPublished;

    const [courses, total] = await this.prisma.$transaction([
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
      data: courses,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // ───────────────────────────────────────────────────────────────────
  // GET /admin/courses/stats
  // ───────────────────────────────────────────────────────────────────
  async getStats() {
    const [
      total,
      published,
      unpublished,
      featured,
      statePublished,
      stateDraft,
      stateComingSoon,
    ] = await this.prisma.$transaction([
      this.prisma.course.count(),
      this.prisma.course.count({ where: { isPublished: true } }),
      this.prisma.course.count({ where: { isPublished: false } }),
      this.prisma.course.count({ where: { isFeatured: true } }),
      this.prisma.course.count({ where: { state: STATE.PUBLISHED } }),
      this.prisma.course.count({ where: { state: STATE.DRAFT } }),
      this.prisma.course.count({ where: { state: STATE.COMING_SOON } }),
    ]);

    return {
      total,
      published,
      unpublished,
      featured,
      byState: {
        [STATE.PUBLISHED]: statePublished,
        [STATE.DRAFT]: stateDraft,
        [STATE.COMING_SOON]: stateComingSoon,
      },
    };
  }

  // ───────────────────────────────────────────────────────────────────
  // GET /admin/courses/:id
  // ───────────────────────────────────────────────────────────────────
  async findOne(id: string) {
    const course = await this.prisma.course.findUnique({
      where: { id },
      include: {
        instructor: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
        sections: {
          orderBy: { order: 'asc' },
          include: {
            lessons: {
              orderBy: { order: 'asc' },
              select: {
                id: true,
                title: true,
                ar_title: true,
                type: true,
                duration: true,
                order: true,
                isPublished: true,
              },
            },
          },
        },
        _count: {
          select: {
            enrollments: true,
            sections: true,
            lessons: true,
            reviews: true,
          },
        },
      },
    });

    if (!course)
      throw new NotFoundException(`Course with id "${id}" not found`);
    return course;
  }

  // ───────────────────────────────────────────────────────────────────
  // POST /admin/courses
  // ───────────────────────────────────────────────────────────────────
  async create(dto: CreateCourseDto) {
    const existing = await this.prisma.course.findUnique({
      where: { slug: dto.slug },
      select: { id: true },
    });
    if (existing) {
      throw new ConflictException(`Slug "${dto.slug}" is already in use`);
    }

    const instructor = await this.prisma.user.findUnique({
      where: { id: dto.instructorId },
      select: { id: true, name: true },
    });
    if (!instructor) {
      throw new NotFoundException(
        `Instructor with id "${dto.instructorId}" not found`,
      );
    }

    const {
      title, slug, instructorId, ar_title, description, ar_description,
      longDescription, ar_longDescription, difficulty, category, access,
      contentType, color, state, price, duration, estimatedHours, thumbnail,
      backgroundImage, tags, topics, skills, prerequisites, isNew, isFeatured,
    } = dto;

    return this.prisma.course.create({
      data: {
        title, slug, instructorId, ar_title, description, ar_description,
        longDescription, ar_longDescription, difficulty, category, access,
        contentType, color, state, price, duration, estimatedHours, thumbnail,
        backgroundImage,
        tags: tags ?? [],
        topics: topics ?? [],
        skills: skills ?? [],
        prerequisites: prerequisites ?? [],
        isNew: isNew ?? false,
        isFeatured: isFeatured ?? false,
        isPublished: false,
      },
      select: COURSE_LIST_SELECT,
    });
  }

  // ───────────────────────────────────────────────────────────────────
  // PATCH /admin/courses/:id
  // ───────────────────────────────────────────────────────────────────
  async update(id: string, dto: UpdateCourseDto) {
    await this.assertExists(id);

    if (dto.slug) {
      const conflict = await this.prisma.course.findFirst({
        where: { slug: dto.slug, NOT: { id } },
        select: { id: true },
      });
      if (conflict) {
        throw new ConflictException(`Slug "${dto.slug}" is already in use`);
      }
    }

    if (dto.instructorId) {
      const instructor = await this.prisma.user.findUnique({
        where: { id: dto.instructorId },
        select: { id: true },
      });
      if (!instructor) {
        throw new NotFoundException(
          `Instructor with id "${dto.instructorId}" not found`,
        );
      }
    }

    return this.prisma.course.update({
      where: { id },
      data: dto,
      select: COURSE_LIST_SELECT,
    });
  }

  // ───────────────────────────────────────────────────────────────────
  // PUT /admin/courses/:id/curriculum
  // ───────────────────────────────────────────────────────────────────
  async updateCurriculum(id: string, dto: UpdateCurriculumDto) {
    await this.assertExists(id);

    await this.prisma.$transaction(async (tx) => {
      await tx.lesson.deleteMany({ where: { courseId: id } });
      await tx.section.deleteMany({ where: { courseId: id } });
      await tx.module.deleteMany({ where: { courseId: id } });

      for (let sIdx = 0; sIdx < dto.topics.length; sIdx++) {
        const topic = dto.topics[sIdx];

        const section = await tx.section.create({
          data: {
            courseId: id,
            title: topic.title,
            ar_title: topic.ar_title,
            description: topic.description,
            order: sIdx + 1,
          },
        });

        const module = await tx.module.create({
          data: {
            courseId: id,
            title: topic.title,
            ar_title: topic.ar_title,
            description: topic.description,
            ar_description: topic.ar_description,
            order: sIdx + 1,
          },
        });

        const elements = topic.elements ?? [];
        for (let eIdx = 0; eIdx < elements.length; eIdx++) {
          const el = elements[eIdx];
          await tx.lesson.create({
            data: {
              courseId: id,
              sectionId: section.id,
              moduleId: module.id,
              title: el.title,
              ar_title: el.ar_title,
              content: el.content ?? '',
              videoUrl: el.videoUrl,
              type: (el.type?.toUpperCase() ?? 'ARTICLE') as any,
              order: el.order ?? eIdx + 1,
              duration: el.duration,
              isPublished: true,
            },
          });
        }
      }
    });

    return this.findOne(id);
  }

  // ───────────────────────────────────────────────────────────────────
  // PATCH /admin/courses/:id/publish
  // ───────────────────────────────────────────────────────────────────
  async publish(id: string) {
    const course = await this.assertExists(id);

    if (course.isPublished) {
      throw new BadRequestException('Course is already published');
    }

    return this.prisma.course.update({
      where: { id },
      data: {
        isPublished: true,
        state: STATE.PUBLISHED,
        publishedAt: new Date(),
      },
      select: {
        id: true,
        slug: true,
        title: true,
        isPublished: true,
        state: true,
        publishedAt: true,
      },
    });
  }

  // ───────────────────────────────────────────────────────────────────
  // PATCH /admin/courses/:id/unpublish
  // ───────────────────────────────────────────────────────────────────
  async unpublish(id: string) {
    const course = await this.assertExists(id);

    if (!course.isPublished) {
      throw new BadRequestException('Course is already unpublished');
    }

    return this.prisma.course.update({
      where: { id },
      data: { isPublished: false, state: STATE.DRAFT },
      select: {
        id: true,
        slug: true,
        title: true,
        isPublished: true,
        state: true,
      },
    });
  }

  // ───────────────────────────────────────────────────────────────────
  // DELETE /admin/courses/:id
  // ───────────────────────────────────────────────────────────────────
  async remove(id: string) {
    await this.assertExists(id);

    const enrollmentCount = await this.prisma.enrollment.count({
      where: { courseId: id },
    });

    if (enrollmentCount > 0) {
      throw new BadRequestException(
        `Cannot delete course with ${enrollmentCount} active enrollment(s). Unpublish it instead.`,
      );
    }

    await this.prisma.course.delete({ where: { id } });
    return { success: true, message: 'Course deleted successfully' };
  }

  // ───────────────────────────────────────────────────────────────────
  // POST /admin/courses/import-json
  // ───────────────────────────────────────────────────────────────────
  async importJson(buffer: Buffer, dto: ImportCourseDto) {
    let courseJson: CourseJsonData;
    try {
      courseJson = JSON.parse(buffer.toString('utf-8')) as CourseJsonData;
    } catch {
      throw new BadRequestException('Uploaded file is not valid JSON');
    }

    if (!courseJson.landingData?.title?.en) {
      throw new BadRequestException('JSON must contain landingData.title.en');
    }
    if (!Array.isArray(courseJson.topics) || courseJson.topics.length === 0) {
      throw new BadRequestException('JSON must contain at least one topic');
    }

    const existing = await this.prisma.course.findUnique({
      where: { slug: dto.slug },
      select: { id: true },
    });
    if (existing) {
      throw new ConflictException(`Slug "${dto.slug}" is already in use`);
    }

    const instructor = await this.prisma.user.findUnique({
      where: { id: dto.instructorId },
      select: { id: true },
    });
    if (!instructor) {
      throw new NotFoundException(
        `Instructor with id "${dto.instructorId}" not found`,
      );
    }

    let linkedLabIds: string[] = [];
    if (dto.labSlugs?.length) {
      const labs = await this.prisma.lab.findMany({
        where: { slug: { in: dto.labSlugs } },
        select: { id: true, slug: true },
      });
      const foundSlugs = labs.map((l) => l.slug);
      const missingSlugs = dto.labSlugs.filter((s) => !foundSlugs.includes(s));
      if (missingSlugs.length) {
        throw new NotFoundException(
          `Labs not found for slugs: ${missingSlugs.join(', ')}`,
        );
      }
      linkedLabIds = labs.map((l) => l.id);
    }

    const { landingData, topics } = courseJson;

    const course = await this.prisma.$transaction(async (tx) => {
      const created = await tx.course.create({
        data: {
          slug: dto.slug,
          title: landingData.title.en,
          ar_title: landingData.title.ar,
          description: landingData.description?.en,
          ar_description: landingData.description?.ar,
          longDescription: landingData.longDescription?.en,
          ar_longDescription: landingData.longDescription?.ar,
          instructorId: dto.instructorId,
          color: dto.color,
          difficulty: dto.difficulty,
          access: dto.access,
          category: dto.category,
          contentType: dto.contentType,
          estimatedHours: dto.estimatedHours,
          thumbnail: dto.thumbnail,
          tags: dto.tags ?? [],
          skills: dto.skills ?? [],
          isNew: dto.isNew ?? false,
          isFeatured: dto.isFeatured ?? false,
          isPublished: false,
          state: STATE.DRAFT,
          ...(linkedLabIds.length && {
            courseLabs: {
              create: linkedLabIds.map((labId, idx) => ({ labId, order: idx })),
            },
          }),
        },
      });

      for (let sIdx = 0; sIdx < topics.length; sIdx++) {
        const topic = topics[sIdx];

        const section = await tx.section.create({
          data: {
            courseId: created.id,
            title: topic.title.en,
            ar_title: topic.title.ar,
            description: topic.description?.en,
            order: sIdx + 1,
          },
        });

        const module = await tx.module.create({
          data: {
            courseId: created.id,
            title: topic.title.en,
            ar_title: topic.title.ar,
            description: topic.description?.en,
            ar_description: topic.description?.ar,
            order: sIdx + 1,
          },
        });

        const elements = topic.elements ?? [];
        for (let eIdx = 0; eIdx < elements.length; eIdx++) {
          const el = elements[eIdx];
          await tx.lesson.create({
            data: {
              courseId: created.id,
              sectionId: section.id,
              moduleId: module.id,
              title: el.title.en,
              ar_title: el.title.ar,
              content: el.content ?? '',
              videoUrl: el.videoUrl,
              type: (el.type?.toUpperCase() ?? 'ARTICLE') as any,
              order: el.order ?? eIdx + 1,
              duration: el.duration,
              isPublished: true,
            },
          });
        }
      }

      return created;
    });

    if (dto.publishImmediately) {
      await this.prisma.course.update({
        where: { id: course.id },
        data: {
          isPublished: true,
          state: STATE.PUBLISHED,
          publishedAt: new Date(),
        },
      });
    }

    return this.findOne(course.id);
  }

  // ══════════════════════════════════════════════════════════
  // CourseLab management
  // ══════════════════════════════════════════════════════════

  /** GET /admin/courses/:id/labs */
  async getCourseLabs(courseId: string) {
    await this.assertExists(courseId);
    return this.prisma.courseLab.findMany({
      where: { courseId },
      orderBy: { order: 'asc' },
      include: {
        lab: { select: LAB_SELECT },
      },
    });
  }

  /** POST /admin/courses/:id/labs/:labId */
  async attachLab(courseId: string, labId: string) {
    await this.assertExists(courseId);

    const lab = await this.prisma.lab.findUnique({
      where: { id: labId },
      select: { id: true },
    });
    if (!lab) throw new NotFoundException(`Lab "${labId}" not found`);

    const existing = await this.prisma.courseLab.findUnique({
      where: { courseId_labId: { courseId, labId } },
    });
    if (existing) throw new ConflictException('Lab already linked to this course');

    const lastEntry = await this.prisma.courseLab.findFirst({
      where: { courseId },
      orderBy: { order: 'desc' },
      select: { order: true },
    });
    const order = lastEntry ? lastEntry.order + 1 : 0;

    return this.prisma.courseLab.create({
      data: { courseId, labId, order },
      include: {
        lab: { select: LAB_SELECT },
      },
    });
  }

  /** DELETE /admin/courses/:id/labs/:labId */
  async detachLab(courseId: string, labId: string) {
    await this.assertExists(courseId);

    const link = await this.prisma.courseLab.findUnique({
      where: { courseId_labId: { courseId, labId } },
    });
    if (!link) throw new NotFoundException('Lab is not linked to this course');

    await this.prisma.courseLab.delete({
      where: { courseId_labId: { courseId, labId } },
    });
    return { success: true, message: 'Lab detached successfully' };
  }

  /** PATCH /admin/courses/:id/labs/reorder */
  async reorderLabs(courseId: string, orderedLabIds: string[]) {
    await this.assertExists(courseId);

    await this.prisma.$transaction(
      orderedLabIds.map((labId, idx) =>
        this.prisma.courseLab.update({
          where: { courseId_labId: { courseId, labId } },
          data: { order: idx },
        }),
      ),
    );

    return this.getCourseLabs(courseId);
  }

  // ───────────────────────────────────────────────────────────────────
  // Private helpers
  // ───────────────────────────────────────────────────────────────────
  private async assertExists(id: string) {
    const course = await this.prisma.course.findUnique({
      where: { id },
      select: { id: true, title: true, isPublished: true },
    });
    if (!course)
      throw new NotFoundException(`Course with id "${id}" not found`);
    return course;
  }
}
