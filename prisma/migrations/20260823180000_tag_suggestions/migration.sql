-- CreateEnum
CREATE TYPE "TagSuggestionStatus" AS ENUM ('PENDING', 'APPROVED', 'MAPPED', 'REJECTED');

-- CreateTable
CREATE TABLE "tag_suggestions" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "normalized_name" TEXT NOT NULL,
    "compact_key" TEXT NOT NULL,
    "status" "TagSuggestionStatus" NOT NULL DEFAULT 'PENDING',
    "suggested_by_user_id" TEXT NOT NULL,
    "novel_id" TEXT,
    "reason" TEXT,
    "reviewed_by_user_id" TEXT,
    "reviewed_at" TIMESTAMP(3),
    "rejection_reason" TEXT,
    "resolved_tag_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tag_suggestions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "tag_suggestions_status_created_at_idx" ON "tag_suggestions"("status", "created_at");

-- CreateIndex
CREATE INDEX "tag_suggestions_compact_key_idx" ON "tag_suggestions"("compact_key");

-- CreateIndex
CREATE INDEX "tag_suggestions_suggested_by_user_id_status_idx" ON "tag_suggestions"("suggested_by_user_id", "status");

-- AddForeignKey
ALTER TABLE "tag_suggestions" ADD CONSTRAINT "tag_suggestions_suggested_by_user_id_fkey" FOREIGN KEY ("suggested_by_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tag_suggestions" ADD CONSTRAINT "tag_suggestions_reviewed_by_user_id_fkey" FOREIGN KEY ("reviewed_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tag_suggestions" ADD CONSTRAINT "tag_suggestions_novel_id_fkey" FOREIGN KEY ("novel_id") REFERENCES "novels"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tag_suggestions" ADD CONSTRAINT "tag_suggestions_resolved_tag_id_fkey" FOREIGN KEY ("resolved_tag_id") REFERENCES "tags"("id") ON DELETE SET NULL ON UPDATE CASCADE;
