// prisma/seed-data/course-data/seed-courses.ts
import { PrismaClient } from '@prisma/client';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { COURSES_META } from '../seed-config';

function safeNumber(val: any, fallback = 0): number {
  const n = Number(val);
  return isNaN(n) ? fallback : n;
}

export async function seedCourses(prisma: PrismaClient) {
  console.log('\n📚 Seeding courses...');

  const instructor =
    (await prisma.user.findFirst({
      where: { role: 'ADMIN' },
      select: { id: true },
    })) ?? (await prisma.user.findFirst({ select: { id: true } }));

  if (!instructor) throw new Error('❌ No user found — seed users first.');

  const instructorId = instructor.id;
  const baseDir = join(process.cwd(), 'prisma/seed-data/course-data');
  let seeded = 0;

  for (const meta of COURSES_META) {
    const filePath = join(baseDir, meta.jsonFile);

    if (!existsSync(filePath)) {
      console.warn(`  ⚠️  JSON not found: ${meta.jsonFile} — skipping`);
      continue;
    }

    let raw: any;
    try {
      raw = JSON.parse(readFileSync(filePath, 'utf-8'));
    } catch {
      console.warn(`  ⚠️  Could not parse: ${meta.jsonFile} — skipping`);
      continue;
    }

    const ld = raw.landingData ?? raw;

    const titleEn: string =
      (typeof ld.title === 'object' ? ld.title?.en : ld.title) ?? meta.slug;
    const titleAr: string | undefined =
      typeof ld.title === 'object' ? ld.title?.ar : ld.ar_title;

    const descEn: string | undefined =
      typeof ld.description === 'object' ? ld.description?.en : ld.description;
    const descAr: string | undefined =
      typeof ld.description === 'object'
        ? ld.description?.ar
        : ld.ar_description;

    const topicsArr: any[] = raw.topics ?? [];

    // ✅ عدد التوبيكس الفعلي (عدد الـ sections مش عدد العناصر)
    const totalTopics = topicsArr.length;

    // Topic titles للكارد
    const topicsList: string[] =
      meta.topics ??
      topicsArr
        .map(
          (t: any) =>
            (typeof t.title === 'object' ? t.title?.en : t.title) ?? '',
        )
        .filter(Boolean);

    const ar_topicsList: string[] =
      meta.ar_topics ??
      topicsArr
        .map((t: any) => (typeof t.title === 'object' ? t.title?.ar : '') ?? '')
        .filter(Boolean);

    const coursePayload = {
      title: titleEn,
      ar_title: titleAr,
      description: descEn,
      ar_description: descAr,
      color: meta.color as any,
      difficulty: meta.difficulty as any,
      access: meta.access as any,
      contentType: meta.contentType as any,
      category: meta.category as any,
      estimatedHours: meta.estimatedHours,
      duration: meta.estimatedHours * 60,
      state: 'PUBLISHED' as any,
      isPublished: true,
      isNew: meta.isNew ?? false,
      isFeatured: meta.isFeatured ?? false,
      thumbnail: meta.thumbnail ?? '',
      tags: meta.tags ?? [],
      skills: meta.skills ?? [],
      ar_skills: meta.ar_skills ?? [],
      topics: topicsList,
      ar_topics: ar_topicsList,
      // ✅ عدد الـ sections الفعلي
      totalTopics,
    };

    try {
      const course = await prisma.course.upsert({
        where: { slug: meta.slug },
        update: coursePayload,
        create: {
          ...coursePayload,
          slug: meta.slug,
          instructor: { connect: { id: instructorId } },
        },
      });

      if (topicsArr.length > 0) {
        await seedCourseSections(prisma, course.id, topicsArr);
      }

      if (meta.labSlugs && meta.labSlugs.length > 0) {
        await linkCourseToLabs(prisma, course.id, meta.labSlugs);
      }

      console.log(`  ✅ ${meta.slug} (${totalTopics} topics)`);
      seeded++;
    } catch (e: any) {
      console.error(`  ❌ ${meta.slug}:`, e.message);
    }
  }

  console.log(`  🎉 ${seeded}/${COURSES_META.length} courses seeded\n`);
}

async function linkCourseToLabs(
  prisma: PrismaClient,
  courseId: string,
  labSlugs: string[],
) {
  await (prisma as any).courseLab.deleteMany({ where: { courseId } });

  for (let i = 0; i < labSlugs.length; i++) {
    const lab = await prisma.lab.findUnique({
      where: { slug: labSlugs[i] },
      select: { id: true },
    });
    if (!lab) {
      console.warn(`    ⚠️  Lab slug not found: "${labSlugs[i]}"`);
      continue;
    }
    await (prisma as any).courseLab.upsert({
      where: { courseId_labId: { courseId, labId: lab.id } },
      update: { order: i + 1 },
      create: { courseId, labId: lab.id, order: i + 1 },
    });
  }
}

async function seedCourseSections(
  prisma: PrismaClient,
  courseId: string,
  topics: any[],
) {
  await prisma.lesson.deleteMany({ where: { courseId } });
  await prisma.section.deleteMany({ where: { courseId } });
  await prisma.module.deleteMany({ where: { courseId } });

  for (let sIdx = 0; sIdx < topics.length; sIdx++) {
    const topic = topics[sIdx];
    const order = sIdx + 1;

    const sTitle =
      typeof topic.title === 'object'
        ? (topic.title?.en ?? `Section ${order}`)
        : (topic.title ?? `Section ${order}`);
    const sTitleAr =
      typeof topic.title === 'object' ? topic.title?.ar : undefined;
    const sDesc =
      typeof topic.description === 'object'
        ? topic.description?.en
        : topic.description;

    const [section, mod] = await Promise.all([
      prisma.section.create({
        data: {
          courseId,
          title: sTitle,
          ar_title: sTitleAr,
          order,
          ...(sDesc ? { description: sDesc } : {}),
        },
      }),
      prisma.module.create({
        data: {
          courseId,
          title: sTitle,
          ar_title: sTitleAr,
          order,
          ...(sDesc ? { description: sDesc } : {}),
        },
      }),
    ]);

    const elements: any[] = topic.elements ?? topic.lessons ?? [];

    for (let eIdx = 0; eIdx < elements.length; eIdx++) {
      const el = elements[eIdx];
      const lessonOrder = safeNumber(el.order, eIdx + 1);

      const lTitle =
        typeof el.title === 'object'
          ? (el.title?.en ?? `Lesson ${lessonOrder}`)
          : (el.title ?? `Lesson ${lessonOrder}`);
      const lTitleAr = typeof el.title === 'object' ? el.title?.ar : undefined;

      const typeRaw = (el.type ?? 'article').toString().toUpperCase();
      const lessonType: 'VIDEO' | 'ARTICLE' | 'QUIZ' =
        typeRaw === 'VIDEO' ? 'VIDEO' : typeRaw === 'QUIZ' ? 'QUIZ' : 'ARTICLE';

      await prisma.lesson.create({
        data: {
          courseId,
          sectionId: section.id,
          moduleId: mod.id,
          title: lTitle,
          ar_title: lTitleAr,
          order: lessonOrder,
          type: lessonType,
          duration: safeNumber(el.duration, 0),
          content: el.content ?? '',
          ...(el.videoUrl || el.video_url
            ? { videoUrl: el.videoUrl ?? el.video_url }
            : {}),
        },
      });
    }
  }
}
