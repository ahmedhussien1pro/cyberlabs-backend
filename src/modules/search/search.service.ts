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
          description: true,
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
          description: true,
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
          description: true,
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
        description: c.description ?? undefined,
        slug: c.slug,
        imageUrl: c.thumbnail ?? undefined,
        difficulty: c.difficulty?.toLowerCase() as any,
      })),
      ...labs.map((l) => ({
        id: l.id,
        type: 'lab' as const,
        title: l.title,
        description: l.description ?? undefined,
        slug: l.slug,
        imageUrl: l.imageUrl ?? undefined,
        difficulty: l.difficulty?.toLowerCase() as any,
      })),
      ...paths.map((p) => ({
        id: p.id,
        type: 'path' as const,
        title: p.title,
        description: p.description ?? undefined,
        slug: p.slug,
        imageUrl: p.thumbnail ?? undefined,
      })),
    ].slice(0, limit);

    return { results, total: results.length, query };
  }
}
