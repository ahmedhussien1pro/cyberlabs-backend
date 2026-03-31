// prisma/seed-data/mcq-labs/seed-mcq-labs.ts
// Upserts all MCQ labs into the Lab table.
// Each entry maps 1-to-1 with a JSON file in labs_assets/MCQ-data/.
// Fields that don't apply to MCQ labs (initialState, solution, etc.)
// are left as empty stubs so the shared Lab model stays compatible.

import { PrismaClient } from '@prisma/client';
import type { MCQLabMetadata } from '../../../src/modules/practice-labs/types/mcq-lab-metadata.type';

// ─── Register every MCQ lab here ────────────────────────────────────────────
import { apiHackingMCQMetadata } from '../../../src/modules/practice-labs/mcq/labs/api-hacking/api-hacking.metadata';

const ALL_MCQ_LABS: MCQLabMetadata[] = [
  apiHackingMCQMetadata,
  // Next labs will be added here one by one as we validate the pattern:
  // regexMCQMetadata,
  // careerPentestMCQMetadata,
  // ...
];

export async function seedMCQLabs(prisma: PrismaClient): Promise<void> {
  if (ALL_MCQ_LABS.length === 0) return;
  console.log('\n📝 Seeding MCQ labs...');

  for (const meta of ALL_MCQ_LABS) {
    const shared = {
      title:          meta.title,
      ar_title:       meta.ar_title,
      description:    meta.description,
      ar_description: meta.ar_description,
      difficulty:     meta.difficulty as any,
      category:       meta.category   as any,
      executionMode:  'FRONTEND'       as any,   // MCQ runs fully in frontend + shared backend
      skills:         meta.skills,
      xpReward:       meta.xpReward,
      pointsReward:   meta.pointsReward,
      duration:       meta.duration,
      isPublished:    meta.isPublished,
      imageUrl:       null,
      goal:           meta.goal,
      ar_goal:        meta.ar_goal,
      // MCQ-specific metadata stored as initialState for easy retrieval
      initialState: {
        type:          'MCQ',
        jsonFile:      meta.jsonFile,
        questionCount: meta.questionCount,
        passingScore:  meta.passingScore,
        pointsPerQuestion: Math.floor(meta.pointsReward / meta.questionCount),
      },
      // Stub fields required by the shared Lab model
      briefing:      { en: meta.goal, ar: meta.ar_goal },
      stepsOverview: { en: [], ar: [] },
      solution:      {},
      postSolve:     {},
      flagAnswer:    '',  // flag is generated dynamically per-user via HMAC
    };

    const lab = await prisma.lab.upsert({
      where:  { slug: meta.slug },
      update: shared,
      create: { ...shared, slug: meta.slug },
    });

    console.log(
      `  ✅ MCQ lab: ${meta.slug.padEnd(32)} | ` +
      `${String(meta.questionCount).padStart(2)} Qs | ` +
      `${meta.passingScore}% pass | ` +
      `${meta.difficulty}`,
    );
  }

  console.log(`  → ${ALL_MCQ_LABS.length} MCQ lab(s) seeded.`);
}
