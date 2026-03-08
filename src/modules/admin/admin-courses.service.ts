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
interface CourseJsonElement {
  title: { en: string; ar?: string };
  type?: string; // article | video | quiz
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
  // GET /admin/courses  — ALL courses, no isPublished filter
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
  // Individual count() calls — avoids Prisma groupBy _count union type issue
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
  // GET /admin/courses/:id  — full detail, no isPublished check
  // ───────────────────────────────────────────────────────────────────
  async findOne(id: string) {
    const course = await this.prisma.course.findUnique({
      where: { id },
      include: {
        instructor: {
          select: { id: true, name: true, email: true, avatarUrl: true },
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
  // POST /admin/courses  — create new course
  // ───────────────────────────────────────────────────────────────────
  async create(dto: CreateCourseDto) {
    // 1. Verify slug uniqueness
    const existing = await this.prisma.course.findUnique({
      where: { slug: dto.slug },
      select: { id: true },
    });
    if (existing) {
      throw new ConflictException(`Slug "${dto.slug}" is already in use`);
    }

    // 2. Verify instructor exists
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
      title,
      slug,
      instructorId,
      ar_title,
      description,
      ar_description,
      longDescription,
      ar_longDescription,
      difficulty,
      category,
      access,
      contentType,
      color,
      state,
      price,
      duration,
      estimatedHours,
      thumbnail,
      backgroundImage,
      tags,
      topics,
      skills,
      prerequisites,
      isNew,
      isFeatured,
    } = dto;

    return this.prisma.course.create({
      data: {
        title,
        slug,
        instructorId,
        ar_title,
        description,
        ar_description,
        longDescription,
        ar_longDescription,
        difficulty,
        category,
        access,
        contentType,
        color,
        state,
        price,
        duration,
        estimatedHours,
        thumbnail,
        backgroundImage,
        tags: tags ?? [],
        topics: topics ?? [],
        skills: skills ?? [],
        prerequisites: prerequisites ?? [],
        isNew: isNew ?? false,
        isFeatured: isFeatured ?? false,
        isPublished: false, // new courses always start unpublished
      },
      select: COURSE_LIST_SELECT,
    });
  }

  // ───────────────────────────────────────────────────────────────────
  // PATCH /admin/courses/:id  — update course fields
  // ───────────────────────────────────────────────────────────────────
  async update(id: string, dto: UpdateCourseDto) {
    await this.assertExists(id);

    // If updating slug, verify uniqueness against OTHER courses
    if (dto.slug) {
      const conflict = await this.prisma.course.findFirst({
        where: { slug: dto.slug, NOT: { id } },
        select: { id: true },
      });
      if (conflict) {
        throw new ConflictException(`Slug "${dto.slug}" is already in use`);
      }
    }

    // If updating instructorId, verify instructor exists
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
  // PATCH /admin/courses/:id/publish
  // Sets isPublished=true + state=PUBLISHED + publishedAt
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
  // Sets isPublished=false + state=DRAFT
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
  // Blocks deletion if active enrollments exist (data safety)
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
  // ───────────────────────────────────────────────────────────────────
  // POST /admin/courses/import-json
  // Parses JSON buffer → creates Course + Sections + Lessons atomically
  // ───────────────────────────────────────────────────────────────────
  async importJson(buffer: Buffer, dto: ImportCourseDto) {
    // 1. Parse JSON
    let courseJson: CourseJsonData;
    try {
      courseJson = JSON.parse(buffer.toString('utf-8')) as CourseJsonData;
    } catch {
      throw new BadRequestException('Uploaded file is not valid JSON');
    }

    // 2. Validate structure
    if (!courseJson.landingData?.title?.en) {
      throw new BadRequestException('JSON must contain landingData.title.en');
    }
    if (!Array.isArray(courseJson.topics) || courseJson.topics.length === 0) {
      throw new BadRequestException('JSON must contain at least one topic');
    }

    // 3. Check slug uniqueness
    const existing = await this.prisma.course.findUnique({
      where: { slug: dto.slug },
      select: { id: true },
    });
    if (existing) {
      throw new ConflictException(`Slug "${dto.slug}" is already in use`);
    }

    // 4. Verify instructor
    const instructor = await this.prisma.user.findUnique({
      where: { id: dto.instructorId },
      select: { id: true },
    });
    if (!instructor) {
      throw new NotFoundException(
        `Instructor with id "${dto.instructorId}" not found`,
      );
    }

    // 5. Resolve lab IDs from slugs (many-to-many)
    let linkedLabIds: string[] = [];
    if (dto.labSlugs?.length) {
      const labs = await this.prisma.practiceLab.findMany({
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

    // 6. Atomic transaction: Course + Sections + Lessons
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
            labs: { connect: linkedLabIds.map((id) => ({ id })) },
          }),
        },
      });

      // Create Sections (topics)
      for (let sIdx = 0; sIdx < topics.length; sIdx++) {
        const topic = topics[sIdx];
        const section = await tx.section.create({
          data: {
            courseId: created.id,
            title: topic.title.en,
            ar_title: topic.title.ar,
            description: topic.description?.en,
            ar_description: topic.description?.ar,
            order: sIdx + 1,
          },
        });

        // Create Lessons (elements)
        const elements = topic.elements ?? [];
        for (let eIdx = 0; eIdx < elements.length; eIdx++) {
          const el = elements[eIdx];
          await tx.lesson.create({
            data: {
              courseId: created.id,
              sectionId: section.id,
              title: el.title.en,
              ar_title: el.title.ar,
              content: el.content,
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

    // 7. Publish immediately if requested
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

    // 8. Return full course detail
    return this.findOne(course.id);
  }
}
