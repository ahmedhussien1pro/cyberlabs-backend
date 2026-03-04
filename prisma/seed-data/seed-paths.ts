// prisma/seed-data/seed-paths.ts
import { PrismaClient } from '@prisma/client';
import { PATHS_META } from './seed-config';

export async function seedPaths(prisma: PrismaClient) {
  if (PATHS_META.length === 0) {
    console.log('\n🗺️  No paths configured in seed-config — skipping');
    return;
  }
  console.log('\n🗺️  Seeding learning paths...');

  for (const meta of PATHS_META) {
    const totalCourses = meta.modules.filter((m) => m.type === 'COURSE').length;
    const totalLabs = meta.modules.filter((m) => m.type === 'LAB').length;
    const totalModules = meta.modules.length;
    const estimatedHours = meta.modules.reduce(
      (acc, m) => acc + (m.estimatedHours ?? 0),
      0,
    );

    const pathPayload = {
      title: meta.title,
      ar_title: meta.ar_title,
      description: meta.description,
      ar_description: meta.ar_description,
      color: meta.color as any,
      difficulty: meta.difficulty as any,
      isNew: meta.isNew ?? false,
      isFeatured: meta.isFeatured ?? false,
      isPublished: meta.isPublished ?? false,
      tags: meta.tags ?? [],
      skills: meta.skills ?? [],
      ar_skills: meta.ar_skills ?? [],
      totalModules,
      totalCourses,
      totalLabs,
      estimatedHours,
    };

    try {
      const path = await prisma.learningPath.upsert({
        where: { slug: meta.slug },
        update: pathPayload,
        create: { ...pathPayload, slug: meta.slug },
      });

      // Rebuild modules fresh every seed
      await prisma.pathModule.deleteMany({ where: { pathId: path.id } });

      for (const mod of meta.modules) {
        let courseId: string | undefined;
        let labId: string | undefined;
        let resolvedTitle = mod.title ?? mod.slug;
        let resolvedTitleAr = mod.ar_title;
        let resolvedTopics = 0;

        if (mod.type === 'COURSE') {
          const course = await prisma.course.findUnique({
            where: { slug: mod.slug },
            select: {
              id: true,
              title: true,
              ar_title: true,
              totalTopics: true,
            },
          });
          if (!course) {
            console.warn(`    ⚠️  Course not found: ${mod.slug}`);
            continue;
          }
          courseId = course.id;
          resolvedTitle = mod.title ?? course.title;
          resolvedTitleAr = mod.ar_title ?? course.ar_title ?? undefined;
          // ✅ عدد الـ sections الفعلي من الـ course
          resolvedTopics = course.totalTopics ?? 0;
        } else if (mod.type === 'LAB') {
          const lab = await prisma.lab.findUnique({
            where: { slug: mod.slug },
            select: { id: true, title: true, ar_title: true },
          });
          if (!lab) {
            console.warn(`    ⚠️  Lab not found: ${mod.slug}`);
            continue;
          }
          labId = lab.id;
          resolvedTitle = mod.title ?? lab.title;
          resolvedTitleAr = mod.ar_title ?? lab.ar_title ?? undefined;
        }

        await prisma.pathModule.create({
          data: {
            pathId: path.id,
            order: mod.order,
            type: mod.type as any,
            title: resolvedTitle,
            ar_title: resolvedTitleAr,
            estimatedHours: mod.estimatedHours ?? 0,
            isLocked: mod.isLocked ?? false,
            totalTopics: resolvedTopics,
            ...(courseId ? { courseId } : {}),
            ...(labId ? { labId } : {}),
          },
        });
      }

      console.log(`  ✅ path: ${meta.slug}`);
    } catch (e: any) {
      console.error(`  ❌ path: ${meta.slug}:`, e.message);
    }
  }

  console.log(`  🎉 ${PATHS_META.length} paths processed\n`);
}
