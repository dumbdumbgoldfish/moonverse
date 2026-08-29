-- Expand reading-source categories: replace FREE_LEGAL with FAN_TRANSLATION,
-- and add an `active` flag so inactive sources can be hidden without deleting.

-- 1. Rebuild enum without FREE_LEGAL
CREATE TYPE "ReadingLinkCategory_new" AS ENUM ('OFFICIAL', 'COMMUNITY', 'FAN_TRANSLATION');

ALTER TABLE "reading_links"
  ALTER COLUMN "category" DROP DEFAULT;

ALTER TABLE "reading_links"
  ALTER COLUMN "category" TYPE "ReadingLinkCategory_new"
  USING (
    CASE
      WHEN "category"::text = 'FREE_LEGAL' THEN 'OFFICIAL'::"ReadingLinkCategory_new"
      ELSE "category"::text::"ReadingLinkCategory_new"
    END
  );

DROP TYPE "ReadingLinkCategory";

ALTER TYPE "ReadingLinkCategory_new" RENAME TO "ReadingLinkCategory";

-- 2. Active flag for soft-disabling sources without schema churn
ALTER TABLE "reading_links"
  ADD COLUMN IF NOT EXISTS "active" BOOLEAN NOT NULL DEFAULT true;

CREATE INDEX IF NOT EXISTS "reading_links_active_idx" ON "reading_links"("active");
