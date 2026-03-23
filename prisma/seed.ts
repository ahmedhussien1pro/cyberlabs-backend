// prisma/seed.ts
import { PrismaClient } from '@prisma/client';
import { Prisma } from '@prisma/client';

import { seedSubscriptionPlans } from './seed-data/subscription-plans';
import { seedLabs } from './seed-data/seed-labs';
import { seedCourses } from './seed-data/course-data/seed-courses';
import { seedPaths } from './seed-data/seed-paths';
import { seedCategoryLabs } from './seed-data/seed-category-labs';
import { seedBadges } from './seed-data/seed-badges';

import { lab1Metadata } from '../src/modules/practice-labs/sql-injection/labs/lab1/lab1.metadata';

const prisma = new PrismaClient();

const MODULE_LABS = [
  lab1Metadata,
  // lab2Metadata,
];

const LAB_CATEGORIES: string[] = [
  // ─── Existing categories ───────────────────────────────────────────────────
  'bash-scripting',
  // 'sql-injection',
  // 'ac-vuln',
  // 'business-logic',
  // 'jwt',
  // 'xss',
  // 'idor',
  // 'csrf',
  // 'broken-auth',
  // 'command-injection',
  // 'file-inclusion',
  // 'file-upload',
  // 'ssti',
  // 'race-condition',
  // 'captcha-bypass',
  // 'api-hacking',
  // 'cryptography',
  // 'obfuscation',
  // 'cookies-lab',
  // 'linux',
  // 'wireshark',
];

function toJson(val: unknown): Prisma.InputJsonValue | undefined {
  if (val === undefined || val === null) return undefined;
  return JSON.parse(JSON.stringify(val)) as Prisma.InputJsonValue;
}

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
      imageUrl: meta.imageUrl ?? null,
      goal: meta.goal,
      ar_goal: meta.ar_goal,
      briefing: toJson(meta.briefing),
      stepsOverview: toJson(meta.stepsOverview),
      solution: toJson(meta.solution),
      postSolve: toJson(meta.postSolve),
      flagAnswer: meta.flagAnswer,
      initialState: toJson(meta.initialState) ?? {},
    };

    const lab = await prisma.lab.upsert({
      where: { slug: meta.slug },
      update: shared,
      create: { ...shared, slug: meta.slug },
    });

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

// ──────────────────────────────────────────────────────────────────────────────
async function main() {
  console.log('🌱 Starting CyberLabs seed...\n');
  console.log('═'.repeat(50));

  try {
    // await seedSubscriptionPlans(prisma);
    // await seedLabs(prisma);
    // await seedModuleLabs();
    // await seedCourses(prisma);
    // await seedPaths(prisma);

    for (const category of LAB_CATEGORIES) {
      await seedCategoryLabs(prisma, category);
    }

    // ✅ Always seed badges (idempotent — skips existing)
    // await seedBadges(prisma);

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
