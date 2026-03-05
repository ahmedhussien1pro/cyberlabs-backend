// prisma/seed.ts
import { PrismaClient } from '@prisma/client';

// ── Seed functions ─────────────────────────────────────────────────
import { seedSubscriptionPlans } from './seed-data/subscription-plans';
import { seedLabs } from './seed-data/seed-labs';
import { seedCourses } from './seed-data/course-data/seed-courses';
import { seedPaths } from './seed-data/seed-paths';
import { seedCategoryLabs } from './seed-data/seed-category-labs';
// ── Labs من الـ modules (موجودة حالياً) ─────────────────────────
import { lab1Metadata } from '../src/modules/practice-labs/sql-injection/labs/lab1/lab1.metadata';

const prisma = new PrismaClient();

// ──────────────────────────────────────────────────────────────────
// Labs from module metadata files — هتضيف هنا أي lab جديد عنده metadata خاصة
// ──────────────────────────────────────────────────────────────────
const MODULE_LABS = [
  lab1Metadata,
  // lab2Metadata,  ← أضف هنا
];
const LAB_CATEGORIES: string[] = [
  'sql-injection',
  'ac-vuln',
  'business-logic',
  'jwt',
  'xss',
  'idor',
];
async function seedModuleLabs() {
  if (MODULE_LABS.length === 0) return;
  console.log('\n🧪 Seeding module labs...');

  for (const meta of MODULE_LABS) {
    const shared = {
      title: meta.title,
      ar_title: meta.ar_title,
      description: meta.description,
      ar_description: meta.ar_description,
      difficulty: meta.difficulty as any,
      category: meta.category as any,
      executionMode: meta.executionMode as any,
      skills: meta.skills,
      xpReward: meta.xpReward,
      pointsReward: meta.pointsReward,
      duration: meta.duration,
      isPublished: meta.isPublished,
      scenario: meta.scenario?.context,
      flagAnswer: meta.flagAnswer,
      initialState: meta.initialState,
      imageUrl: meta.imageUrl,
    };

    const lab = await prisma.lab.upsert({
      where: { slug: meta.slug },
      update: shared,
      create: { ...shared, slug: meta.slug },
    });

    // Seed hints
    for (const hint of meta.hints ?? []) {
      await prisma.labHint.upsert({
        where: { labId_order: { labId: lab.id, order: hint.order } },
        update: { content: hint.content, xpCost: hint.xpCost },
        create: {
          labId: lab.id,
          order: hint.order,
          content: hint.content,
          xpCost: hint.xpCost,
        },
      });
    }
    console.log(`  ✅ module-lab: ${meta.slug}`);
  }
}

// ──────────────────────────────────────────────────────────────────
// MAIN
// ──────────────────────────────────────────────────────────────────
async function main() {
  console.log('🌱 Starting CyberLabs seed...\n');
  console.log('═'.repeat(50));

  try {
    // ① Subscription plans — لا تعتمد على أي شيء
    // await seedSubscriptionPlans(prisma);

    // ② Labs من seed-config.ts (LABS_META)
    // await seedLabs(prisma);

    // ③ Labs من ملفات الـ modules (lab1.metadata، إلخ)
    // await seedModuleLabs();

    // ④ Courses — بعد اللابات عشان تربطها
    // await seedCourses(prisma);

    // ⑤ Learning Paths — الأخيرة عشان تلاقي كورسات ولابات في الـ DB
    // await seedPaths(prisma);
    for (const category of LAB_CATEGORIES) {
      await seedCategoryLabs(prisma, category);
    }

    console.log('\n' + '═'.repeat(50));
    console.log('🎉 All seeds completed successfully!');
  } catch (error) {
    console.error('\n❌ Seed failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(console.error);
