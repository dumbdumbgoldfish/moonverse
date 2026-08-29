-- Optional catalog metadata for richer novel detail pages (development + production).
ALTER TABLE "novels"
  ADD COLUMN IF NOT EXISTS "synopsis" TEXT,
  ADD COLUMN IF NOT EXISTS "original_language" TEXT,
  ADD COLUMN IF NOT EXISTS "publication_status" TEXT,
  ADD COLUMN IF NOT EXISTS "publisher" TEXT;
