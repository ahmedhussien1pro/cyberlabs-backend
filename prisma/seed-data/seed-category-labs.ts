// prisma/seed-data/seed-category-labs.ts
import * as fs from 'fs';
import * as path from 'path';
import { PrismaClient, Prisma } from '@prisma/client';
import type { LabMetadata } from '../../src/modules/practice-labs/types/lab-metadata.type';

// Prisma بيرفض typed interfaces في JSON fields
// الحل: نحوّل أي object لـ plain JSON
function toJson(val: unknown): Prisma.InputJsonValue | undefined {
  if (val === undefined || val === null) return undefined;
  return JSON.parse(JSON.stringify(val)) as Prisma.InputJsonValue;
}

// ──────────────────────────────────────────────────────────────────────────────
async function upsertLab(
  prisma: PrismaClient,
  meta: LabMetadata,
): Promise<void> {
  const shared = {
    // ─── Card Fields ──────────────────────────────────────────────
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

    // ─── Lab Platform Fields ───────────────────────────────────────
    goal: meta.goal,
    ar_goal: meta.ar_goal,

    // typed interfaces → plain JSON لـ Prisma
    briefing: toJson(meta.briefing),
    stepsOverview: toJson(meta.stepsOverview),
    solution: toJson(meta.solution),
    postSolve: toJson(meta.postSolve),

    // ─── Engine / Seed Fields ──────────────────────────────────────
    flagAnswer: meta.flagAnswer,
    initialState: toJson(meta.initialState) ?? {},
  };

  const lab = await prisma.lab.upsert({
    where: { slug: meta.slug },
    update: shared,
    create: { ...shared, slug: meta.slug },
  });

  // ─── Hints ──────────────────────────────────────────────────────
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
}

// ──────────────────────────────────────────────────────────────────────────────
function resolveMetadata(
  mod: Record<string, any>,
  labDirName: string,
): LabMetadata | null {
  const namedExport = mod[`${labDirName}Metadata`];
  const candidate = namedExport ?? mod['default'] ?? Object.values(mod)[0];
  if (!candidate || typeof candidate !== 'object' || !candidate.slug)
    return null;
  return candidate as LabMetadata;
}

// ──────────────────────────────────────────────────────────────────────────────
export async function seedCategoryLabs(
  prisma: PrismaClient,
  categorySlug: string,
): Promise<void> {
  const labsDir = path.resolve(
    __dirname,
    '../../src/modules/practice-labs',
    categorySlug,
    'labs',
  );

  if (!fs.existsSync(labsDir)) {
    console.warn(`  ⚠️  Directory not found — skipping: ${labsDir}`);
    return;
  }

  const labDirs = fs
    .readdirSync(labsDir, { withFileTypes: true })
    .filter((e) => e.isDirectory() && /^lab\d+$/i.test(e.name))
    .sort((a, b) => {
      const n = (s: string) => parseInt(s.replace(/\D/g, ''), 10);
      return n(a.name) - n(b.name);
    });

  if (labDirs.length === 0) {
    console.warn(`  ⚠️  No lab directories in: ${labsDir}`);
    return;
  }

  console.log(
    `\n🧪 [${categorySlug}] — found ${labDirs.length} lab(s): ${labDirs.map((d) => d.name).join(', ')}`,
  );

  let seeded = 0,
    skipped = 0;

  for (const dir of labDirs) {
    const metaPath = path.join(labsDir, dir.name, `${dir.name}.metadata.ts`);

    if (!fs.existsSync(metaPath)) {
      console.warn(`  ⚠️  Missing metadata — skipping: ${dir.name}/`);
      skipped++;
      continue;
    }

    let mod: Record<string, any>;
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      mod = require(metaPath);
    } catch (err) {
      console.error(`  ❌  Failed to load ${dir.name}.metadata.ts:`, err);
      skipped++;
      continue;
    }

    const meta = resolveMetadata(mod, dir.name);
    if (!meta) {
      console.warn(
        `  ⚠️  Invalid or missing export in ${dir.name}.metadata.ts — skipping`,
      );
      skipped++;
      continue;
    }

    try {
      await upsertLab(prisma, meta);
      console.log(`  ✅  ${dir.name} → slug: "${meta.slug}"`);
      seeded++;
    } catch (err) {
      console.error(`  ❌  DB upsert failed for ${meta.slug}:`, err);
      skipped++;
    }
  }

  console.log(
    `  📊  [${categorySlug}] done — seeded: ${seeded}, skipped: ${skipped}`,
  );
}
