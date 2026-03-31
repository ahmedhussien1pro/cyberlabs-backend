// prisma/seed-data/mcq-labs/seed-mcq-labs.ts
// Upserts all MCQ labs into the Lab table.
// Each entry maps 1-to-1 with a JSON file in labs_assets/MCQ-data/.

import { PrismaClient } from '@prisma/client';
import type { MCQLabMetadata } from '../../../src/modules/practice-labs/types/mcq-lab-metadata.type';

// ─── Root ────────────────────────────────────────────────────────────────────
import { apiHackingMCQMetadata }   from '../../../src/modules/practice-labs/mcq/labs/api-hacking/api-hacking.metadata';
import { regexMCQMetadata }        from '../../../src/modules/practice-labs/mcq/labs/regex/regex.metadata';

// ─── Career in Cyber ─────────────────────────────────────────────────────────
import { careerPentestMCQMetadata }         from '../../../src/modules/practice-labs/mcq/labs/career-penetration-tester/career-penetration-tester.metadata';
import { careerRedTeamerMCQMetadata }       from '../../../src/modules/practice-labs/mcq/labs/career-red-teamer/career-red-teamer.metadata';
import { careerSecurityAnalystMCQMetadata } from '../../../src/modules/practice-labs/mcq/labs/career-security-analyst/career-security-analyst.metadata';
import { careerSecurityEngineerMCQMetadata }from '../../../src/modules/practice-labs/mcq/labs/career-security-engineer/career-security-engineer.metadata';
import { careerSocialMediaMCQMetadata }     from '../../../src/modules/practice-labs/mcq/labs/career-social-media/career-social-media.metadata';
import { careerVehicleMCQMetadata }         from '../../../src/modules/practice-labs/mcq/labs/career-vehicle/career-vehicle.metadata';

// ─── Digital Forensics ───────────────────────────────────────────────────────
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

const ALL_MCQ_LABS: MCQLabMetadata[] = [
  // ─── Root ──────────────────────────────────────────────────────────────────
  apiHackingMCQMetadata,
  regexMCQMetadata,

  // ─── Career in Cyber ───────────────────────────────────────────────────────
  careerPentestMCQMetadata,
  careerRedTeamerMCQMetadata,
  careerSecurityAnalystMCQMetadata,
  careerSecurityEngineerMCQMetadata,
  careerSocialMediaMCQMetadata,
  careerVehicleMCQMetadata,

  // ─── Digital Forensics ─────────────────────────────────────────────────────
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
      initialState: {
        type:              'MCQ',
        jsonFile:          meta.jsonFile,
        questionCount:     meta.questionCount,
        passingScore:      meta.passingScore,
        pointsPerQuestion: Math.floor(meta.pointsReward / meta.questionCount),
      },
      briefing:      { en: meta.goal, ar: meta.ar_goal },
      stepsOverview: { en: [], ar: [] },
      solution:      {},
      postSolve:     {},
      flagAnswer:    '',
    };

    await prisma.lab.upsert({
      where:  { slug: meta.slug },
      update: shared,
      create: { ...shared, slug: meta.slug },
    });

    console.log(
      `  ✅ MCQ lab: ${meta.slug.padEnd(40)} | ` +
      `${String(meta.questionCount).padStart(2)} Qs | ` +
      `${meta.passingScore}% pass | ` +
      `${meta.difficulty}`,
    );
  }

  console.log(`  → ${ALL_MCQ_LABS.length} MCQ lab(s) seeded.`);
}
