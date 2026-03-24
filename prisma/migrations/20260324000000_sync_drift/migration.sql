-- =============================================================
-- 20260324000000_sync_drift
-- Reconciles all drift detected between migration history and
-- the actual DB schema. Safe to apply on existing data.
-- =============================================================

-- 1. New ENUMs
-- -------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE "FlagPolicyType" AS ENUM (
    'PER_USER_PER_ATTEMPT',
    'PER_USER_PER_LAB',
    'PER_SESSION',
    'STATIC'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "HintPenaltyMode" AS ENUM (
    'PERCENTAGE',
    'FIXED_XP'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "LabEnvironmentType" AS ENUM (
    'DEFAULT',
    'BROWSER_SIM',
    'API_CONSOLE',
    'BANKING_DASHBOARD',
    'BLOG_CMS',
    'PORTAL_AUTH',
    'ECOMMERCE',
    'SOCIAL_SIM',
    'TERMINAL'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 2. New columns on existing tables
-- -------------------------------------------------------------

-- enrollments
ALTER TABLE "enrollments"
  ADD COLUMN IF NOT EXISTS "status" TEXT DEFAULT 'active';

-- user_lab_progress
ALTER TABLE "user_lab_progress"
  ADD COLUMN IF NOT EXISTS "status" TEXT DEFAULT 'in_progress';

-- lab_hints
ALTER TABLE "lab_hints"
  ADD COLUMN IF NOT EXISTS "penaltyPercent" INTEGER NOT NULL DEFAULT 0;

-- labs
ALTER TABLE "labs"
  ADD COLUMN IF NOT EXISTS "canonicalConceptId" TEXT,
  ADD COLUMN IF NOT EXISTS "environmentType"    "LabEnvironmentType" NOT NULL DEFAULT 'DEFAULT',
  ADD COLUMN IF NOT EXISTS "flagPolicyType"     "FlagPolicyType"     NOT NULL DEFAULT 'PER_USER_PER_LAB',
  ADD COLUMN IF NOT EXISTS "hintPenaltyMode"    "HintPenaltyMode"    NOT NULL DEFAULT 'PERCENTAGE',
  ADD COLUMN IF NOT EXISTS "immersiveAssets"    JSONB,
  ADD COLUMN IF NOT EXISTS "labInfo"            JSONB,
  ADD COLUMN IF NOT EXISTS "missionBrief"       JSONB,
  ADD COLUMN IF NOT EXISTS "scenarioAdmin"      JSONB,
  ADD COLUMN IF NOT EXISTS "targetRole"         TEXT,
  ADD COLUMN IF NOT EXISTS "variantOfLabId"     TEXT;

-- labs indexes
CREATE INDEX IF NOT EXISTS "labs_canonicalConceptId_idx" ON "labs"("canonicalConceptId");
CREATE INDEX IF NOT EXISTS "labs_environmentType_idx"   ON "labs"("environmentType");

-- 3. New tables
-- -------------------------------------------------------------

CREATE TABLE IF NOT EXISTS "lab_hint_usages" (
  "id"        TEXT        NOT NULL,
  "userId"    TEXT        NOT NULL,
  "labId"     TEXT        NOT NULL,
  "hintId"    TEXT        NOT NULL,
  "hintOrder" INTEGER     NOT NULL,
  "xpCost"    INTEGER     NOT NULL,
  "usedAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "lab_hint_usages_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "lab_hint_usages_userId_labId_hintOrder_key"
  ON "lab_hint_usages"("userId", "labId", "hintOrder");
CREATE INDEX IF NOT EXISTS "lab_hint_usages_userId_labId_idx"
  ON "lab_hint_usages"("userId", "labId");
CREATE INDEX IF NOT EXISTS "lab_hint_usages_labId_idx"
  ON "lab_hint_usages"("labId");

ALTER TABLE "lab_hint_usages"
  ADD CONSTRAINT "lab_hint_usages_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "lab_hint_usages_labId_fkey"
    FOREIGN KEY ("labId") REFERENCES "labs"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "lab_hint_usages_hintId_fkey"
    FOREIGN KEY ("hintId") REFERENCES "lab_hints"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- -------------------------------------------------------------

CREATE TABLE IF NOT EXISTS "lab_flag_records" (
  "id"        TEXT         NOT NULL,
  "userId"    TEXT         NOT NULL,
  "labId"     TEXT         NOT NULL,
  "attemptId" TEXT         NOT NULL,
  "flagHash"  TEXT         NOT NULL,
  "used"      BOOLEAN      NOT NULL DEFAULT false,
  "usedAt"    TIMESTAMP(3),
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "lab_flag_records_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "lab_flag_records_userId_labId_attemptId_key"
  ON "lab_flag_records"("userId", "labId", "attemptId");
CREATE INDEX IF NOT EXISTS "lab_flag_records_flagHash_idx"
  ON "lab_flag_records"("flagHash");
CREATE INDEX IF NOT EXISTS "lab_flag_records_userId_labId_idx"
  ON "lab_flag_records"("userId", "labId");

ALTER TABLE "lab_flag_records"
  ADD CONSTRAINT "lab_flag_records_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "lab_flag_records_labId_fkey"
    FOREIGN KEY ("labId") REFERENCES "labs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 4. Remove legacy refreshToken column from users (if still present)
-- -------------------------------------------------------------
ALTER TABLE "users" DROP COLUMN IF EXISTS "refreshToken";
