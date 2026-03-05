// prisma/seed-data/seed-labs.ts
import { PrismaClient, Prisma } from '@prisma/client';
import { LABS_META } from './seed-config';

export async function seedLabs(prisma: PrismaClient) {
  if (LABS_META.length === 0) {
    console.log('\n🧪 No labs configured in seed-config — skipping');
    return;
  }
  console.log('\n🧪 Seeding labs...');

  for (const meta of LABS_META) {
    const shared = {
      title: meta.title,
      ar_title: meta.ar_title,
      description: meta.description,
      ar_description: meta.ar_description,
      difficulty: meta.difficulty as any,
      category: meta.category as any,
      executionMode: meta.executionMode as any,
      xpReward: meta.xpReward ?? 0,
      pointsReward: meta.pointsReward ?? 0,
      duration: meta.duration,
      skills: meta.skills ?? [],
      imageUrl: meta.imageUrl,
      isPublished: meta.isPublished ?? false,
      flagAnswer: meta.flagAnswer,
      maxAttempts: meta.maxAttempts,
      timeLimit: meta.timeLimit,
      ...(meta.engineConfig
        ? { engineConfig: meta.engineConfig as Prisma.InputJsonValue }
        : {}),
      ...(meta.steps ? { steps: meta.steps as Prisma.InputJsonValue } : {}),
    };

    try {
      await prisma.lab.upsert({
        where: { slug: meta.slug },
        update: shared,
        create: {
          ...shared,
          slug: meta.slug,
          initialState: {} as Prisma.InputJsonValue,
        },
      });
      console.log(`  ✅ lab: ${meta.slug}`);
    } catch (e: any) {
      console.error(`  ❌ lab: ${meta.slug}:`, e.message);
    }
  }

  console.log(`  🎉 ${LABS_META.length} labs processed\n`);
}
