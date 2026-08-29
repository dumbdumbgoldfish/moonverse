-- CreateEnum
CREATE TYPE "ReadingLinkCategory" AS ENUM ('OFFICIAL', 'COMMUNITY', 'FREE_LEGAL');

-- CreateTable
CREATE TABLE "reading_links" (
    "id" TEXT NOT NULL,
    "novel_id" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "category" "ReadingLinkCategory" NOT NULL,
    "country" TEXT,
    "language" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reading_links_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "reading_links_novel_id_idx" ON "reading_links"("novel_id");

-- CreateIndex
CREATE UNIQUE INDEX "reading_links_novel_id_platform_key" ON "reading_links"("novel_id", "platform");

-- AddForeignKey
ALTER TABLE "reading_links" ADD CONSTRAINT "reading_links_novel_id_fkey" FOREIGN KEY ("novel_id") REFERENCES "novels"("id") ON DELETE CASCADE ON UPDATE CASCADE;
