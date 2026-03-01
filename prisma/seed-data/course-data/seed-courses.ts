// prisma/seed-data/seed-courses.ts
import {
  PrismaClient,
  Difficulty,
  CATEGORY,
  CourseColor,
  CourseContentType,
  CourseAccess,
  STATE,
} from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

// ─── Mapping: JSON filename → Course metadata ───────────────────────────────
// Each JSON file corresponds to a course slug defined in paths.ts
const COURSE_FILE_MAP: Record<
  string,
  {
    slug: string;
    title: string;
    ar_title: string;
    description: string;
    ar_description: string;
    difficulty: Difficulty;
    category: CATEGORY;
    color: CourseColor;
    contentType: CourseContentType;
    access: CourseAccess;
    duration: number; // minutes
    tags: string[];
  }
> = {
  'Introduction to Cyber Security Fundamentals.json': {
    slug: 'introduction-to-cybersecurity',
    title: 'Introduction to Cybersecurity',
    ar_title: 'مقدمة في الأمن السيبراني',
    description:
      'Learn the fundamentals of cybersecurity, understand the CIA Triad, explore offensive and defensive security.',
    ar_description:
      'تعلّم أساسيات الأمن السيبراني، وافهم مثلث CIA، واستكشف الأمن الهجومي والدفاعي.',
    difficulty: 'BEGINNER',
    category: 'FUNDAMENTALS',
    color: 'BLUE',
    contentType: 'THEORETICAL',
    access: 'FREE',
    duration: 90,
    tags: ['cybersecurity', 'CIA Triad', 'fundamentals', 'beginner'],
  },
};

// ─── Helper: derive slug from filename if not in map ────────────────────────
function fileNameToSlug(filename: string): string {
  return filename
    .replace('.json', '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

export async function seedCourses(prisma: PrismaClient) {
  console.log('\n📚 Seeding courses...');

  // ─── 1. Find or create system instructor user ────────────────────────────
  let instructor = await prisma.user.findFirst({
    where: { email: 'system@cyberlabs.io' },
  });

  if (!instructor) {
    const bcrypt = await import('bcrypt');
    instructor = await prisma.user.create({
      data: {
        name: 'CyberLabs System',
        email: 'system@cyberlabs.io',
        password: await bcrypt.hash('SystemPass#2026!', 10),
        role: 'ADMIN',
        isVerified: true,
        isEmailVerified: true,
        isActive: true,
      },
    });
    console.log('  👤 System instructor created');
  }

  // ─── 2. Read JSON files ───────────────────────────────────────────────────
  const courseDataDir = __dirname;
  const files = fs
    .readdirSync(courseDataDir)
    .filter((f) => f.endsWith('.json'));
  console.log(`  📁 Found ${files.length} course JSON files`);

  const seededSlugs: string[] = [];

  for (const filename of files) {
    const filePath = path.join(courseDataDir, filename);
    const raw = fs.readFileSync(filePath, 'utf-8');
    const json = JSON.parse(raw);

    const meta = COURSE_FILE_MAP[filename];
    const slug = meta?.slug ?? fileNameToSlug(filename);

    const landingData = json.landingData ?? {};
    const topics: string[] = (json.topics ?? []).map((t: any) =>
      typeof t.title === 'object' ? t.title.en : t.title,
    );
    const ar_topics: string[] = (json.topics ?? []).map((t: any) =>
      typeof t.title === 'object' ? t.title.ar : t.title,
    );

    await prisma.course.upsert({
      where: { slug },
      create: {
        slug,
        instructorId: instructor.id,
        title: meta?.title ?? landingData.title?.en ?? slug,
        ar_title: meta?.ar_title ?? landingData.title?.ar ?? null,
        description: meta?.description ?? landingData.description?.en ?? null,
        ar_description:
          meta?.ar_description ?? landingData.description?.ar ?? null,
        difficulty: meta?.difficulty ?? 'BEGINNER',
        category: meta?.category ?? 'FUNDAMENTALS',
        color: meta?.color ?? 'BLUE',
        contentType: meta?.contentType ?? 'MIXED',
        access: meta?.access ?? 'FREE',
        duration: meta?.duration ?? 120,
        tags: meta?.tags ?? [],
        topics,
        ar_topics,
        totalTopics: topics.length,
        isPublished: true,
        isFeatured: false,
        state: 'PUBLISHED',
        averageRating: landingData.rating ?? 0,
        enrollmentCount: landingData.students ?? 0,
      },
      update: {
        title: meta?.title ?? landingData.title?.en ?? slug,
        ar_title: meta?.ar_title ?? landingData.title?.ar ?? null,
        description: meta?.description ?? landingData.description?.en ?? null,
        ar_description:
          meta?.ar_description ?? landingData.description?.ar ?? null,
        difficulty: meta?.difficulty ?? 'BEGINNER',
        topics,
        ar_topics,
        totalTopics: topics.length,
        isPublished: true,
        state: 'PUBLISHED',
      },
    });

    seededSlugs.push(slug);
    console.log(`  ✅ ${slug}`);
  }

  console.log(`  🎉 ${seededSlugs.length} courses seeded\n`);
  return seededSlugs;
}
