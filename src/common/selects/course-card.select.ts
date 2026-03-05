// src/common/selects/course-card.select.ts
import { Prisma } from '@prisma/client';

export function courseCardBaseSelect() {
  return {
    id: true,
    slug: true,
    title: true,
    ar_title: true,
    description: true,
    ar_description: true,
    longDescription: true,
    ar_longDescription: true,
    thumbnail: true,
    color: true,
    access: true,
    state: true,
    difficulty: true,
    ar_difficulty: true,
    category: true,
    ar_category: true,
    contentType: true,
    isNew: true,
    isFeatured: true,
    isPublished: true,
    totalTopics: true,
    estimatedHours: true,
    enrollmentCount: true,
    averageRating: true,
    reviewCount: true,
    tags: true,
    skills: true,
    ar_skills: true,
    topics: true,
    ar_topics: true,
    prerequisites: true,
    ar_prerequisites: true,
    sections: {
      select: { id: true, order: true },
      orderBy: { order: Prisma.SortOrder.asc },
    },
    // ✅ كان: labs: { where: { isPublished: true } }
    // الـ schema لا يملك Course.labs مباشرة — العلاقة هي Course.courseLabs (junction)
    _count: {
      select: {
        courseLabs: true,
      },
    },
  } as const;
}

export function courseCardSelect(userId?: string | null) {
  const base = courseCardBaseSelect();

  if (!userId) return base;

  return {
    ...base,
    enrollments: {
      where: { userId },
      select: { progress: true, isCompleted: true },
    },
  } as const;
}

export const courseDetailInclude = (userId?: string | null) =>
  ({
    instructor: {
      select: { id: true, name: true, avatarUrl: true, bio: true },
    },
    sections: {
      include: {
        lessons: {
          orderBy: { order: Prisma.SortOrder.asc },
        },
      },
      orderBy: { order: Prisma.SortOrder.asc },
    },
    _count: {
      select: {
        courseLabs: true,
      },
    },
    enrollments: {
      where: { userId: userId ?? '' },
      select: { progress: true, isCompleted: true },
    },
  }) satisfies Prisma.CourseInclude;
