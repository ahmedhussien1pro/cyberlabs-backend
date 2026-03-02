// prisma/seed-data/course-data/seed-courses.ts
import { PrismaClient } from '@prisma/client';
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

// ── Enum mappings ─────────────────────────────────────────────────────
const COLOR_MAP: Record<string, string> = {
  emerald: 'EMERALD',
  blue: 'BLUE',
  violet: 'VIOLET',
  orange: 'ORANGE',
  rose: 'ROSE',
  cyan: 'CYAN',
};
const DIFFICULTY_MAP: Record<string, string> = {
  beginner: 'BEGINNER',
  intermediate: 'INTERMEDIATE',
  advanced: 'ADVANCED',
  expert: 'EXPERT',
};
const ACCESS_MAP: Record<string, string> = {
  free: 'FREE',
  pro: 'PRO',
  premium: 'PREMIUM',
};
const CONTENT_TYPE_MAP: Record<string, string> = {
  practical: 'PRACTICAL',
  theoretical: 'THEORETICAL',
  mixed: 'MIXED',
};
const CATEGORY_MAP: Record<string, string> = {
  web_security: 'WEB_SECURITY',
  web: 'WEB_SECURITY',
  penetration_testing: 'PENETRATION_TESTING',
  pentest: 'PENETRATION_TESTING',
  malware_analysis: 'MALWARE_ANALYSIS',
  malware: 'MALWARE_ANALYSIS',
  cloud_security: 'CLOUD_SECURITY',
  cloud: 'CLOUD_SECURITY',
  fundamentals: 'FUNDAMENTALS',
  cryptography: 'CRYPTOGRAPHY',
  network_security: 'NETWORK_SECURITY',
  network: 'NETWORK_SECURITY',
  tools_and_techniques: 'TOOLS_AND_TECHNIQUES',
  tools: 'TOOLS_AND_TECHNIQUES',
  career_and_industry: 'CAREER_AND_INDUSTRY',
  career: 'CAREER_AND_INDUSTRY',
};

// ── Helpers ───────────────────────────────────────────────────────────
function safeNumber(val: any, fallback = 0): number {
  const n = Number(val);
  return isNaN(n) ? fallback : n;
}

function toSlug(str: string): string {
  return str
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

// ── Main seed function ────────────────────────────────────────────────
export async function seedCourses(prisma: PrismaClient) {
  console.log('\n📚 Seeding courses from JSON files...');

  const instructor =
    (await prisma.user.findFirst({
      where: { role: 'ADMIN' },
      select: { id: true },
    })) ?? (await prisma.user.findFirst({ select: { id: true } }));

  if (!instructor) {
    throw new Error('❌ No user found. Seed users first.');
  }

  const instructorId = instructor.id;
  const baseDir = join(process.cwd(), 'prisma/seed-data/course-data');
  const jsonFiles = readdirSync(baseDir).filter((f) => f.endsWith('.json'));

  console.log(`  📂 Found ${jsonFiles.length} course JSON files`);
  let seeded = 0;

  for (const file of jsonFiles) {
    let raw: any;
    try {
      raw = JSON.parse(readFileSync(join(baseDir, file), 'utf-8'));
    } catch {
      console.warn(`  ⚠️  Could not parse ${file} — skipping`);
      continue;
    }

    const ld = raw.landingData ?? raw;

    const titleEn: string =
      (typeof ld.title === 'object' ? ld.title?.en : ld.title) ??
      file.replace('.json', '');
    const titleAr: string | undefined =
      typeof ld.title === 'object' ? ld.title?.ar : ld.ar_title;

    const descEn: string | undefined =
      typeof ld.description === 'object' ? ld.description?.en : ld.description;
    const descAr: string | undefined =
      typeof ld.description === 'object'
        ? ld.description?.ar
        : ld.ar_description;

    const slug: string = ld.slug ?? toSlug(file.replace('.json', ''));

    const color =
      COLOR_MAP[(ld.color ?? '').toString().toLowerCase()] ?? 'BLUE';
    const difficulty =
      DIFFICULTY_MAP[(ld.difficulty ?? '').toString().toLowerCase()] ??
      'BEGINNER';
    const access =
      ACCESS_MAP[(ld.access ?? '').toString().toLowerCase()] ?? 'FREE';
    const contentType =
      CONTENT_TYPE_MAP[
        (ld.contentType ?? ld.content_type ?? '').toString().toLowerCase()
      ] ?? 'MIXED';

    const categoryRaw = (ld.category ?? '')
      .toString()
      .toLowerCase()
      .replace(/[\s\-]/g, '_');
    const category = CATEGORY_MAP[categoryRaw] ?? null;

    const estimatedHours = safeNumber(
      ld.estimatedHours ?? ld.estimated_hours,
      0,
    );
    const duration = safeNumber(ld.duration) || estimatedHours * 60 || 0;
    const thumbnail: string | undefined =
      ld.thumbnail ?? ld.imageUrl ?? undefined;
    const tags: string[] = Array.isArray(ld.tags) ? ld.tags : [];
    const skills: string[] = Array.isArray(ld.skills) ? ld.skills : [];

    const topicsArr: any[] = raw.topics ?? [];
    // ✅ field is totalTopics in schema (not totalLessons)
    const totalTopics = topicsArr.reduce(
      (acc: number, t: any) =>
        acc + (Array.isArray(t.elements) ? t.elements.length : 0),
      0,
    );

    // update: can use raw instructorId FK
    const updateData = {
      title: titleEn,
      ar_title: titleAr,
      description: descEn,
      ar_description: descAr,
      slug,
      color: color as any,
      difficulty: difficulty as any,
      access: access as any,
      contentType: contentType as any,
      state: 'PUBLISHED' as any,
      isPublished: true,
      ...(thumbnail ? { thumbnail } : {}),
      tags,
      skills,
      estimatedHours,
      duration,
      totalTopics,
      instructorId,
      ...(category ? { category: category as any } : {}),
    };

    // create: must use relation connect (Prisma checked create)
    const createData = {
      title: titleEn,
      ar_title: titleAr,
      description: descEn,
      ar_description: descAr,
      slug,
      color: color as any,
      difficulty: difficulty as any,
      access: access as any,
      contentType: contentType as any,
      state: 'PUBLISHED' as any,
      isPublished: true,
      ...(thumbnail ? { thumbnail } : {}),
      tags,
      skills,
      estimatedHours,
      duration,
      totalTopics,
      instructor: { connect: { id: instructorId } },
      ...(category ? { category: category as any } : {}),
    };

    try {
      const course = await prisma.course.upsert({
        where: { slug },
        update: updateData,
        create: createData,
      });
      console.log(`  ✅ ${slug}`);
      seeded++;

      if (topicsArr.length > 0) {
        await seedCourseSections(prisma, course.id, topicsArr);
      }
    } catch (e: any) {
      console.error(`  ❌ Failed to seed ${slug}:`, e.message);
    }
  }

  console.log(`  🎉 ${seeded} courses seeded\n`);
}

// ── Seed sections & lessons ───────────────────────────────────────────
async function seedCourseSections(
  prisma: PrismaClient,
  courseId: string,
  topics: any[],
) {
  // ✅ FIX: Delete lessons first (FK dependency), then sections and modules
  await prisma.lesson.deleteMany({ where: { courseId } });
  await prisma.section.deleteMany({ where: { courseId } });
  await prisma.module.deleteMany({ where: { courseId } });

  for (let sIdx = 0; sIdx < topics.length; sIdx++) {
    const topic = topics[sIdx];
    const order = sIdx + 1;

    const sectionTitle =
      typeof topic.title === 'object'
        ? (topic.title?.en ?? `Section ${order}`)
        : (topic.title ?? `Section ${order}`);
    const sectionTitleAr =
      typeof topic.title === 'object' ? topic.title?.ar : undefined;
    const sectionDesc =
      typeof topic.description === 'object'
        ? topic.description?.en
        : topic.description;

    // Create Section (new LMS structure)
    const section = await prisma.section.create({
      data: {
        courseId,
        title: sectionTitle,
        ar_title: sectionTitleAr,
        order,
        ...(sectionDesc ? { description: sectionDesc } : {}),
      },
    });

    // ✅ FIX: Create a matching Module for this section
    // Lesson.moduleId is a required FK in the schema — we must provide it.
    // One Module per Section keeps @@unique([moduleId, order]) constraints safe.
    const mod = await prisma.module.create({
      data: {
        courseId,
        title: sectionTitle,
        ar_title: sectionTitleAr,
        order,
        ...(sectionDesc ? { description: sectionDesc } : {}),
      },
    });

    const elements: any[] = topic.elements ?? topic.lessons ?? [];

    for (let eIdx = 0; eIdx < elements.length; eIdx++) {
      const el = elements[eIdx];
      const lessonOrder = safeNumber(el.order, eIdx + 1);

      const lessonTitle =
        typeof el.title === 'object'
          ? (el.title?.en ?? `Lesson ${lessonOrder}`)
          : (el.title ?? `Lesson ${lessonOrder}`);
      const lessonTitleAr =
        typeof el.title === 'object' ? el.title?.ar : undefined;

      const typeRaw = (el.type ?? 'article').toString().toUpperCase();
      const lessonType: 'VIDEO' | 'ARTICLE' | 'QUIZ' =
        typeRaw === 'VIDEO' ? 'VIDEO' : typeRaw === 'QUIZ' ? 'QUIZ' : 'ARTICLE';

      await prisma.lesson.create({
        data: {
          courseId,
          sectionId: section.id,
          // ✅ FIX: moduleId is required in schema — use the mirrored module
          moduleId: mod.id,
          title: lessonTitle,
          ar_title: lessonTitleAr,
          order: lessonOrder,
          type: lessonType,
          duration: safeNumber(el.duration, 0),
          // ✅ FIX: content is required String (not String?) — default to ''
          content: el.content ?? '',
          ...(el.videoUrl || el.video_url
            ? { videoUrl: el.videoUrl ?? el.video_url }
            : {}),
        },
      });
    }
  }
}
