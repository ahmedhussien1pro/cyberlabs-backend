-- ============================================================
-- fix-shadow-db.sql
-- Run this ONCE to fix the broken shadow database migration
-- that prevents `prisma migrate dev` from working.
--
-- Usage:
--   npx prisma db execute --file ./prisma/fix-shadow-db.sql
-- ============================================================

-- Mark the failed migration as rolled back so Prisma stops
-- trying to replay it against the shadow database.
UPDATE "_prisma_migrations"
SET    "finished_at"    = NOW(),
       "rolled_back_at" = NOW()
WHERE  "migration_name" = '20260310233252_add_referral_links'
  AND  "rolled_back_at" IS NULL
  AND  "finished_at"    IS NULL;
