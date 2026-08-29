-- Novel-owned reading links with moderation + URL uniqueness
-- (replaces unique(novelId, platform) with unique(novelId, normalizedUrl))

CREATE TYPE "ReadingLinkModerationStatus" AS ENUM ('PENDING', 'NEEDS_REVIEW', 'APPROVED', 'REJECTED');

-- New columns (nullable first so we can backfill)
ALTER TABLE "reading_links"
  ADD COLUMN IF NOT EXISTS "submitted_by_user_id" TEXT,
  ADD COLUMN IF NOT EXISTS "submitted_via_review_id" TEXT,
  ADD COLUMN IF NOT EXISTS "normalized_url" TEXT,
  ADD COLUMN IF NOT EXISTS "label" TEXT,
  ADD COLUMN IF NOT EXISTS "moderation_status" "ReadingLinkModerationStatus" NOT NULL DEFAULT 'APPROVED',
  ADD COLUMN IF NOT EXISTS "is_official" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "is_verified" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "rejection_reason" TEXT,
  ADD COLUMN IF NOT EXISTS "sort_order" INTEGER NOT NULL DEFAULT 0;

-- Backfill normalized_url from existing urls (lowercase host, strip trailing slash)
UPDATE "reading_links"
SET "normalized_url" = lower(rtrim("url", '/'))
WHERE "normalized_url" IS NULL;

-- Catalog/seed links were already public: mark verified official when category is OFFICIAL
UPDATE "reading_links"
SET
  "moderation_status" = 'APPROVED',
  "is_verified" = true,
  "is_official" = CASE WHEN "category" = 'OFFICIAL' THEN true ELSE false END
WHERE "moderation_status" = 'APPROVED';

-- Deduplicate any legacy rows that would collide on (novel_id, normalized_url)
-- Keep the oldest row per pair.
DELETE FROM "reading_links" a
USING "reading_links" b
WHERE a."novel_id" = b."novel_id"
  AND a."normalized_url" = b."normalized_url"
  AND a."created_at" > b."created_at";

ALTER TABLE "reading_links"
  ALTER COLUMN "normalized_url" SET NOT NULL;

-- Drop platform uniqueness; uniqueness is by normalized URL within a novel
DROP INDEX IF EXISTS "reading_links_novel_id_platform_key";

CREATE UNIQUE INDEX "reading_links_novel_id_normalized_url_key"
  ON "reading_links"("novel_id", "normalized_url");

CREATE INDEX "reading_links_submitted_by_user_id_idx"
  ON "reading_links"("submitted_by_user_id");

CREATE INDEX "reading_links_submitted_via_review_id_idx"
  ON "reading_links"("submitted_via_review_id");

CREATE INDEX "reading_links_moderation_status_idx"
  ON "reading_links"("moderation_status");

ALTER TABLE "reading_links"
  ADD CONSTRAINT "reading_links_submitted_by_user_id_fkey"
  FOREIGN KEY ("submitted_by_user_id") REFERENCES "users"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "reading_links"
  ADD CONSTRAINT "reading_links_submitted_via_review_id_fkey"
  FOREIGN KEY ("submitted_via_review_id") REFERENCES "reviews"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
