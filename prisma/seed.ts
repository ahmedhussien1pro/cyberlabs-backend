import { PrismaClient } from '@prisma/client';
import { lab1Metadata } from '../src/modules/practice-labs/sql-injection/labs/lab1/lab1.metadata';

const prisma = new PrismaClient();
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
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
