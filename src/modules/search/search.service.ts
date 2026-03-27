import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/database';

@Injectable()
export class SearchService {
  constructor(private readonly prisma: PrismaService) {}

  async search(query: string, limit: number) {
    if (!query || query.length < 2) {
      return { results: [], total: 0, query };
    }

    const textFilter = {
      OR: [
        { title: { contains: query, mode: 'insensitive' as const } },
        { description: { contains: query, mode: 'insensitive' as const } },
        { ar_title: { contains: query, mode: 'insensitive' as const } },
        { ar_description: { contains: query, mode: 'insensitive' as const } },
      ],
    };

    const perType = Math.ceil(limit / 3);

    const [courses, labs, paths] = await Promise.all([
      this.prisma.course.findMany({
        where: { isPublished: true, ...textFilter },
        take: perType,
        orderBy: { enrollmentCount: 'desc' },
        select: {
          id: true,
          title: true,
          ar_title: true,
          description: true,
          ar_description: true,
          slug: true,
          thumbnail: true,
          difficulty: true,
        },
      }),
      this.prisma.lab.findMany({
        where: { isPublished: true, ...textFilter },
        take: perType,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          title: true,
          ar_title: true,
          description: true,
          ar_description: true,
          slug: true,
          imageUrl: true,
          difficulty: true,
        },
      }),
      this.prisma.learningPath.findMany({
        where: { isPublished: true, ...textFilter },
        take: perType,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          title: true,
          ar_title: true,
          description: true,
          ar_description: true,
          slug: true,
          thumbnail: true,
        },
      }),
    ]);

    const results = [
      ...courses.map((c) => ({
        id: c.id,
        type: 'course' as const,
        title: c.title,
        ar_title: c.ar_title ?? undefined,
        description: c.description ?? undefined,
        ar_description: c.ar_description ?? undefined,
        slug: c.slug,
        imageUrl: c.thumbnail ?? undefined,
        difficulty: c.difficulty?.toLowerCase() as any,
      })),
      ...labs.map((l) => ({
        id: l.id,
        type: 'lab' as const,
        title: l.title,
        ar_title: l.ar_title ?? undefined,
        description: l.description ?? undefined,
        ar_description: l.ar_description ?? undefined,
        slug: l.slug,
        imageUrl: l.imageUrl ?? undefined,
        difficulty: l.difficulty?.toLowerCase() as any,
      })),
      ...paths.map((p) => ({
        id: p.id,
        type: 'path' as const,
        title: p.title,
        ar_title: p.ar_title ?? undefined,
        description: p.description ?? undefined,
        ar_description: p.ar_description ?? undefined,
        slug: p.slug,
        imageUrl: p.thumbnail ?? undefined,
      })),
    ].slice(0, limit);

    return { results, total: results.length, query };
  }
}
