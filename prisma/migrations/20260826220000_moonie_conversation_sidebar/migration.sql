-- AlterTable
ALTER TABLE "moonie_conversations" ADD COLUMN "title" VARCHAR(80),
ADD COLUMN "pinned_at" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "moonie_conversations_user_id_pinned_at_idx" ON "moonie_conversations"("user_id", "pinned_at");
