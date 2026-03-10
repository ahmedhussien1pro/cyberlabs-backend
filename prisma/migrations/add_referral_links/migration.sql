-- Migration: Add ReferralLink and ReferralClick tables
-- Run: npx prisma migrate dev --name add_referral_links
-- OR apply manually on production: psql $DATABASE_URL -f this_file.sql

CREATE TABLE IF NOT EXISTS "referral_links" (
  "id"             TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "label"          TEXT NOT NULL,
  "slug"           TEXT NOT NULL,
  "source"         TEXT NOT NULL,
  "url"            TEXT NOT NULL,
  "targetUserId"   TEXT,
  "targetUserName" TEXT,
  "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "referral_links_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "referral_links_slug_key" ON "referral_links"("slug");
CREATE INDEX IF NOT EXISTS "referral_links_source_idx"       ON "referral_links"("source");
CREATE INDEX IF NOT EXISTS "referral_links_targetUserId_idx" ON "referral_links"("targetUserId");
CREATE INDEX IF NOT EXISTS "referral_links_createdAt_idx"    ON "referral_links"("createdAt");

ALTER TABLE "referral_links"
  ADD CONSTRAINT "referral_links_targetUserId_fkey"
  FOREIGN KEY ("targetUserId") REFERENCES "users"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- ──────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "referral_clicks" (
  "id"                TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "linkId"            TEXT NOT NULL,
  "ip"                TEXT,
  "userAgent"         TEXT,
  "convertedAt"       TIMESTAMP(3),
  "registeredUserId" TEXT,
  "createdAt"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "referral_clicks_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "referral_clicks_linkId_idx"    ON "referral_clicks"("linkId");
CREATE INDEX IF NOT EXISTS "referral_clicks_createdAt_idx" ON "referral_clicks"("createdAt");

ALTER TABLE "referral_clicks"
  ADD CONSTRAINT "referral_clicks_linkId_fkey"
  FOREIGN KEY ("linkId") REFERENCES "referral_links"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
