import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

import { lab1Metadata } from '../src/modules/practice-labs/sql-injection/labs/lab1/lab1.metadata';

const prisma = new PrismaClient();
// async function seedCourses() {
//   const coursesDir = path.join(__dirname, 'seed-data/courses');
//   if (!fs.existsSync(coursesDir)) return;
//   const files = fs.readdirSync(coursesDir).filter((f) => f.endsWith('.json'));
//   for (const file of files) {
//     const courseData = JSON.parse(
//       fs.readFileSync(path.join(coursesDir, file), 'utf-8'),
//     );
//     await prisma.course.upsert({
//       where: { slug: courseData.slug },
//       update: courseData,
//       create: courseData,
//     });
//     console.log(`✅ Seeded course: ${courseData.title}`);
//   }
// }
async function seedLabs() {
  const labsDir = path.join(__dirname, 'seed-data/labs');
  if (!fs.existsSync(labsDir)) return;
  const files = fs.readdirSync(labsDir).filter((f) => f.endsWith('.json'));
  for (const file of files) {
    const labData = JSON.parse(
      fs.readFileSync(path.join(labsDir, file), 'utf-8'),
    );
    // Handle relationships if needed (like lab hints)
    const { hints, ...labFields } = labData;
    const createdLab = await prisma.lab.create({
      data: {
        ...labFields,
        hints: hints
          ? {
              create: hints,
            }
          : undefined,
      },
    });
    console.log(`✅ Seeded lab: ${createdLab.title}`);
  }
}

// ─── Import all lab metadata files ───────────────────────────

const ALL_LABS = [lab1Metadata];

async function seedLabsMetaData() {
  console.log('🌱 Seeding labs from metadata files...');

  for (const meta of ALL_LABS) {
    const lab = await prisma.lab.upsert({
      where: { slug: meta.slug },
      update: {
        title: meta.title,
        ar_title: meta.ar_title,
        description: meta.description,
        ar_description: meta.ar_description,
        difficulty: meta.difficulty as any,
        category: meta.category as any,
        skills: meta.skills,
        xpReward: meta.xpReward,
        pointsReward: meta.pointsReward,
        duration: meta.duration,
        executionMode: meta.executionMode as any,
        isPublished: meta.isPublished,
        scenario: meta.scenario?.context,
        flagAnswer: meta.flagAnswer,
        initialState: meta.initialState,
        imageUrl: meta.imageUrl,
      },
      create: {
        slug: meta.slug,
        title: meta.title,
        ar_title: meta.ar_title,
        description: meta.description,
        ar_description: meta.ar_description,
        difficulty: meta.difficulty as any,
        category: meta.category as any,
        skills: meta.skills,
        xpReward: meta.xpReward,
        pointsReward: meta.pointsReward,
        duration: meta.duration,
        executionMode: meta.executionMode as any,
        isPublished: meta.isPublished,
        scenario: meta.scenario?.context,
        flagAnswer: meta.flagAnswer,
        initialState: meta.initialState,
        imageUrl: meta.imageUrl,
      },
    });

    // Upsert الـ Hints
    for (const hint of meta.hints) {
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

    console.log(`  ✅ ${meta.slug} seeded`);
  }

  console.log('🎉 Done!');
}
async function main() {
  await seedLabsMetaData();
  // await seedLabs();
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
