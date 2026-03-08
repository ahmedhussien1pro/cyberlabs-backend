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
        instructor: { select: { id: true, name: true, email: true, avatarUrl: true } },
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

    if (!course) throw new NotFoundException(`Course with id "${id}" not found`);
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
      throw new NotFoundException(`Instructor with id "${dto.instructorId}" not found`);
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
      select: { id: true, slug: true, title: true, isPublished: true, state: true, publishedAt: true },
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
      select: { id: true, slug: true, title: true, isPublished: true, state: true },
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
    if (!course) throw new NotFoundException(`Course with id "${id}" not found`);
    return course;
  }
}
