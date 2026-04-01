// prisma/seed-data/mcq-labs/seed-mcq-labs.ts
//
// HOW IT WORKS:
// 1. Each lab metadata defines jsonFile (relative path inside ./data/).
// 2. If the metadata also has questions[] inline → use those directly.
// 3. Otherwise → read the JSON file from disk (only the seed script does fs I/O).
// 4. Questions are stored in DB initialState.questions.
// 5. mcq.service reads from DB — zero fs I/O at runtime (Vercel-safe).

import * as fs   from 'fs';
import * as path from 'path';
import { Prisma, PrismaClient } from '@prisma/client';
import type { MCQLabMetadata, MCQQuestion } from '../../../src/modules/practice-labs/types/mcq-lab-metadata.type';

// ─── Root ─────────────────────────────────────────────────────────────────────
import { apiHackingMCQMetadata }   from '../../../src/modules/practice-labs/mcq/labs/api-hacking/api-hacking.metadata';
import { regexMCQMetadata }        from '../../../src/modules/practice-labs/mcq/labs/regex/regex.metadata';

// ─── Career in Cyber ──────────────────────────────────────────────────────────
import { careerPentestMCQMetadata }          from '../../../src/modules/practice-labs/mcq/labs/career-penetration-tester/career-penetration-tester.metadata';
import { careerRedTeamerMCQMetadata }        from '../../../src/modules/practice-labs/mcq/labs/career-red-teamer/career-red-teamer.metadata';
import { careerSecurityAnalystMCQMetadata }  from '../../../src/modules/practice-labs/mcq/labs/career-security-analyst/career-security-analyst.metadata';
import { careerSecurityEngineerMCQMetadata } from '../../../src/modules/practice-labs/mcq/labs/career-security-engineer/career-security-engineer.metadata';
import { careerSocialMediaMCQMetadata }      from '../../../src/modules/practice-labs/mcq/labs/career-social-media/career-social-media.metadata';
import { careerVehicleMCQMetadata }          from '../../../src/modules/practice-labs/mcq/labs/career-vehicle/career-vehicle.metadata';

// ─── Digital Forensics ────────────────────────────────────────────────────────
import { dfornBlockchainMCQMetadata }        from '../../../src/modules/practice-labs/mcq/labs/dforn-blockchain/dforn-blockchain.metadata';
import { dfornCloudMCQMetadata }             from '../../../src/modules/practice-labs/mcq/labs/dforn-cloud/dforn-cloud.metadata';
import { dfornComputerMCQMetadata }          from '../../../src/modules/practice-labs/mcq/labs/dforn-computer/dforn-computer.metadata';
import { dfornDataRecoveryMCQMetadata }      from '../../../src/modules/practice-labs/mcq/labs/dforn-data-recovery/dforn-data-recovery.metadata';
import { dfornDatabaseMCQMetadata }          from '../../../src/modules/practice-labs/mcq/labs/dforn-database/dforn-database.metadata';
import { dfornExaminerMCQMetadata }          from '../../../src/modules/practice-labs/mcq/labs/dforn-examiner/dforn-examiner.metadata';
import { dfornDroneMCQMetadata }             from '../../../src/modules/practice-labs/mcq/labs/dforn-drone/dforn-drone.metadata';
import { dfornEmailMCQMetadata }             from '../../../src/modules/practice-labs/mcq/labs/dforn-email/dforn-email.metadata';
import { dfornGamingMCQMetadata }            from '../../../src/modules/practice-labs/mcq/labs/dforn-gaming/dforn-gaming.metadata';
import { dfornIncidentResponderMCQMetadata } from '../../../src/modules/practice-labs/mcq/labs/dforn-incident-responder/dforn-incident-responder.metadata';
import { dfornIotMCQMetadata }               from '../../../src/modules/practice-labs/mcq/labs/dforn-iot/dforn-iot.metadata';
import { dfornMalwareMCQMetadata }           from '../../../src/modules/practice-labs/mcq/labs/dforn-malware/dforn-malware.metadata';
import { dfornMalwareAnalystMCQMetadata }    from '../../../src/modules/practice-labs/mcq/labs/dforn-malware-analyst/dforn-malware-analyst.metadata';
import { dfornMobileMCQMetadata }            from '../../../src/modules/practice-labs/mcq/labs/dforn-mobile/dforn-mobile.metadata';
import { dfornMultimediaMCQMetadata }        from '../../../src/modules/practice-labs/mcq/labs/dforn-multimedia/dforn-multimedia.metadata';
import { dfornNetworkMCQMetadata }           from '../../../src/modules/practice-labs/mcq/labs/dforn-network/dforn-network.metadata';

// ─── JSON data root ───────────────────────────────────────────────────────────
// All JSON files live under:  prisma/seed-data/mcq-labs/data/<jsonFile>
const DATA_DIR = path.resolve(__dirname, 'data');

/** Load questions for a lab — inline first, then JSON file fallback. */
function loadQuestions(meta: MCQLabMetadata): MCQQuestion[] {
  // 1. Inline questions in metadata (e.g. api-hacking)
  if (meta.questions && meta.questions.length > 0) {
    return meta.questions;
  }

  // 2. JSON file on disk (seed-time only — never called at runtime)
  const filePath = path.join(DATA_DIR, meta.jsonFile);

  if (!fs.existsSync(filePath)) {
    console.warn(`  ⚠️  JSON not found, skipping: ${filePath}`);
    return [];
  }

  try {
    const raw  = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(raw);

    // Support both shapes:
    //   { questions: [...] }   ← wrapped
    //   [...]                  ← bare array
    const questions: MCQQuestion[] = Array.isArray(data) ? data : (data.questions ?? []);
    return questions;
  } catch (err) {
    console.error(`  ❌  Failed to parse JSON for ${meta.slug}:`, err);
    return [];
  }
}

/** Safe double-cast: typed object → unknown → Prisma.InputJsonValue.
 *  Required because Prisma's InputJsonValue union includes primitives,
 *  so TypeScript rejects a direct cast from a complex object type.
 */
function toJson(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}

const ALL_MCQ_LABS: MCQLabMetadata[] = [
  // ─── Root ─────────────────────────────────────────────────────────────────
  apiHackingMCQMetadata,
  regexMCQMetadata,

  // ─── Career in Cyber ──────────────────────────────────────────────────────
  careerPentestMCQMetadata,
  careerRedTeamerMCQMetadata,
  careerSecurityAnalystMCQMetadata,
  careerSecurityEngineerMCQMetadata,
  careerSocialMediaMCQMetadata,
  careerVehicleMCQMetadata,

  // ─── Digital Forensics ────────────────────────────────────────────────────
  dfornBlockchainMCQMetadata,
  dfornCloudMCQMetadata,
  dfornComputerMCQMetadata,
  dfornDataRecoveryMCQMetadata,
  dfornDatabaseMCQMetadata,
  dfornExaminerMCQMetadata,
  dfornDroneMCQMetadata,
  dfornEmailMCQMetadata,
  dfornGamingMCQMetadata,
  dfornIncidentResponderMCQMetadata,
  dfornIotMCQMetadata,
  dfornMalwareMCQMetadata,
  dfornMalwareAnalystMCQMetadata,
  dfornMobileMCQMetadata,
  dfornMultimediaMCQMetadata,
  dfornNetworkMCQMetadata,
];

export async function seedMCQLabs(prisma: PrismaClient): Promise<void> {
  if (ALL_MCQ_LABS.length === 0) return;
  console.log('\n📝 Seeding MCQ labs...');

  for (const meta of ALL_MCQ_LABS) {
    const questions = loadQuestions(meta);

    if (questions.length === 0) {
      console.warn(`  ⚠️  Skipped (no questions): ${meta.slug}`);
      continue;
    }

    const ptsPerQ = Math.floor(meta.pointsReward / meta.questionCount);

    // toJson() does: value → unknown → Prisma.InputJsonValue
    // This is the correct pattern when passing typed objects to Prisma Json columns.
    const initialState = toJson({
      type:              'MCQ',
      jsonFile:          meta.jsonFile,
      questionCount:     meta.questionCount,
      passingScore:      meta.passingScore,
      pointsPerQuestion: ptsPerQ,
      questions,          // ← stored in DB; mcq.service reads from here at runtime
    });

    const shared = {
      title:          meta.title,
      ar_title:       meta.ar_title,
      description:    meta.description,
      ar_description: meta.ar_description,
      difficulty:     meta.difficulty as any,
      category:       meta.category   as any,
      executionMode:  'FRONTEND'       as any,
      skills:         meta.skills,
      xpReward:       meta.xpReward,
      pointsReward:   meta.pointsReward,
      duration:       meta.duration,
      isPublished:    meta.isPublished,
      imageUrl:       null,
      goal:           meta.goal,
      ar_goal:        meta.ar_goal,
      initialState,
      briefing:      toJson({ en: meta.goal, ar: meta.ar_goal }),
      stepsOverview: toJson({ en: [], ar: [] }),
      solution:      toJson({}),
      postSolve:     toJson({}),
      flagAnswer:    '',
    };

    await prisma.lab.upsert({
      where:  { slug: meta.slug },
      update: shared,
      create: { ...shared, slug: meta.slug },
    });

    console.log(
      `  ✅ ${meta.slug.padEnd(44)} | ` +
      `${String(questions.length).padStart(2)}Q | ` +
      `${meta.passingScore}% pass | ` +
      `${ptsPerQ}pts/Q | ` +
      `${meta.difficulty}`,
    );
  }

  console.log(`  → ${ALL_MCQ_LABS.length} MCQ lab(s) processed.`);
}
