-- AlterTable
ALTER TABLE "users" ADD COLUMN "onboarding_completed_at" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "user_preferred_genres" (
    "user_id" TEXT NOT NULL,
    "genre_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_preferred_genres_pkey" PRIMARY KEY ("user_id","genre_id")
);

-- CreateIndex
CREATE INDEX "user_preferred_genres_genre_id_idx" ON "user_preferred_genres"("genre_id");

-- AddForeignKey
ALTER TABLE "user_preferred_genres" ADD CONSTRAINT "user_preferred_genres_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_preferred_genres" ADD CONSTRAINT "user_preferred_genres_genre_id_fkey" FOREIGN KEY ("genre_id") REFERENCES "genres"("id") ON DELETE CASCADE ON UPDATE CASCADE;
