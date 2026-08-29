-- CreateEnum
CREATE TYPE "ReadingLinkHealthStatus" AS ENUM ('UNKNOWN', 'HEALTHY', 'BROKEN', 'REDIRECTED', 'STALE');

-- CreateEnum
CREATE TYPE "NovelSeriesRelationType" AS ENUM ('MAIN', 'PREQUEL', 'SEQUEL', 'SIDE_STORY', 'SPINOFF');

-- AlterTable
ALTER TABLE "reading_links" ADD COLUMN "last_checked_at" TIMESTAMP(3),
ADD COLUMN "health_status" "ReadingLinkHealthStatus" NOT NULL DEFAULT 'UNKNOWN',
ADD COLUMN "last_status_code" INTEGER;

-- CreateTable
CREATE TABLE "novel_series" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "reading_order_verified" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "novel_series_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "novel_series_entries" (
    "id" TEXT NOT NULL,
    "series_id" TEXT NOT NULL,
    "novel_id" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "relation_type" "NovelSeriesRelationType" NOT NULL DEFAULT 'MAIN',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "novel_series_entries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "novel_series_name_idx" ON "novel_series"("name");

-- CreateIndex
CREATE INDEX "novel_series_entries_series_id_order_idx" ON "novel_series_entries"("series_id", "order");

-- CreateIndex
CREATE INDEX "novel_series_entries_novel_id_idx" ON "novel_series_entries"("novel_id");

-- CreateIndex
CREATE UNIQUE INDEX "novel_series_entries_series_id_novel_id_key" ON "novel_series_entries"("series_id", "novel_id");

-- AddForeignKey
ALTER TABLE "novel_series_entries" ADD CONSTRAINT "novel_series_entries_series_id_fkey" FOREIGN KEY ("series_id") REFERENCES "novel_series"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "novel_series_entries" ADD CONSTRAINT "novel_series_entries_novel_id_fkey" FOREIGN KEY ("novel_id") REFERENCES "novels"("id") ON DELETE CASCADE ON UPDATE CASCADE;
