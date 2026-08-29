-- AlterTable
ALTER TABLE "reviews" ADD COLUMN "contains_spoilers" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "reviews_contains_spoilers_idx" ON "reviews"("contains_spoilers");
