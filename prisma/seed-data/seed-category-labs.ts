// prisma/seed-data/seed-category-labs.ts
import * as fs from 'fs';
import * as path from 'path';
import { PrismaClient } from '@prisma/client';
import type { LabMetadata } from '../../src/modules/practice-labs/types/lab-metadata.type';

// ──────────────────────────────────────────────────────────────────────────────
// upsertLab — نفس المنطق الموجود في seed.ts مركّز في مكان واحد
// ──────────────────────────────────────────────────────────────────────────────
async function upsertLab(
  prisma: PrismaClient,
  meta: LabMetadata,
): Promise<void> {
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
    imageUrl: meta.imageUrl ?? null,
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
}

// ──────────────────────────────────────────────────────────────────────────────
// resolveMetadata
// يجرب: labNMetadata  →  default  →  أول export في الملف
// ──────────────────────────────────────────────────────────────────────────────
function resolveMetadata(
  mod: Record<string, any>,
  labDirName: string, // e.g. "lab1"
): LabMetadata | null {
  const namedExport = mod[`${labDirName}Metadata`]; // lab1Metadata
  const candidate = namedExport ?? mod['default'] ?? Object.values(mod)[0];

  if (!candidate || typeof candidate !== 'object' || !candidate.slug) {
    return null;
  }
  return candidate as LabMetadata;
}

// ──────────────────────────────────────────────────────────────────────────────
// seedCategoryLabs — الدالة الرئيسية
//
// categorySlug: اسم فولدر الثغرة كما هو في src/modules/practice-labs/
//               مثال: 'sql-injection'
// ──────────────────────────────────────────────────────────────────────────────
export async function seedCategoryLabs(
  prisma: PrismaClient,
  categorySlug: string,
): Promise<void> {
  // المسار المطلق لفولدر اللابات
  const labsDir = path.resolve(
    __dirname,
    '../../src/modules/practice-labs',
    categorySlug,
    'labs',
  );

  // تحقق من وجود الفولدر
  if (!fs.existsSync(labsDir)) {
    console.warn(`  ⚠️  Directory not found — skipping: ${labsDir}`);
    return;
  }

  // جمع كل فولدرات labN بالترتيب الرقمي
  const labDirs = fs
    .readdirSync(labsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && /^lab\d+$/i.test(entry.name))
    .sort((a, b) => {
      const n = (name: string) => parseInt(name.replace(/\D/g, ''), 10);
      return n(a.name) - n(b.name);
    });

  if (labDirs.length === 0) {
    console.warn(`  ⚠️  No lab directories in: ${labsDir}`);
    return;
  }

  console.log(
    `\n🧪 [${categorySlug}] — found ${labDirs.length} lab(s): ${labDirs.map((d) => d.name).join(', ')}`,
  );

  let seeded = 0;
  let skipped = 0;

  for (const dir of labDirs) {
    const metaPath = path.join(labsDir, dir.name, `${dir.name}.metadata.ts`);

    // تحقق من وجود ملف الـ metadata
    if (!fs.existsSync(metaPath)) {
      console.warn(`  ⚠️  Missing metadata — skipping: ${dir.name}/`);
      skipped++;
      continue;
    }

    let mod: Record<string, any>;
    try {
      // require() مع ts-node --transpile-only يدعم TypeScript مباشرة
      // tsconfig-paths/register يحل الـ path aliases تلقائياً
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
