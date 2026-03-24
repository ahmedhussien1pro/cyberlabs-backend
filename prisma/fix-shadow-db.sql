-- ============================================================
-- fix-shadow-db.sql
-- Run ONCE to fix the broken migration that blocks prisma migrate dev.
--
-- The migration 20260310233252_add_referral_links failed to apply
-- cleanly to the shadow database because the referral_clicks table
-- didn't exist yet at that point.
--
-- This marks it as rolled-back so Prisma stops replaying it.
--
-- Usage (pass your DATABASE_URL explicitly):
--
--   $env:DB_URL = (Get-Content .env | Select-String 'DATABASE_URL').ToString().Split('=',2)[1]
--   npx prisma db execute --url $env:DB_URL --file ./prisma/fix-shadow-db.sql
--
-- Or on Linux/Mac:
--   source .env
--   npx prisma db execute --url "$DATABASE_URL" --file ./prisma/fix-shadow-db.sql
-- ============================================================

UPDATE "_prisma_migrations"
SET    "finished_at"    = NOW(),
       "rolled_back_at" = NOW()
WHERE  "migration_name" = '20260310233252_add_referral_links'
  AND  "rolled_back_at" IS NULL
  AND  "finished_at"    IS NULL;
