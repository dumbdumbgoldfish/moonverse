DO $$ BEGIN
  CREATE TYPE "RecommendationFeedbackKind" AS ENUM ('NOT_FOR_ME', 'MORE_LIKE_THIS', 'SAVED', 'CLICKED', 'SOURCE_OPENED', 'HELPFUL', 'NOT_HELPFUL');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "MoonieSourceStatus" AS ENUM ('VERIFIED', 'NONE', 'PENDING');
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS "moonie_taste_profiles" (
    "user_id" TEXT NOT NULL,
    "favourite_genres" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "favourite_tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "avoided_tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "preferred_status" TEXT,
    "preferred_length" TEXT,
    "romance_level" TEXT,
    "preferred_protagonist" TEXT,
    "preferred_language" TEXT,
    "use_taste_by_default" BOOLEAN NOT NULL DEFAULT true,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "moonie_taste_profiles_pkey" PRIMARY KEY ("user_id")
);

CREATE TABLE IF NOT EXISTS "recommendation_feedback" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "novel_id" TEXT NOT NULL,
    "kind" "RecommendationFeedbackKind" NOT NULL,
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "recommendation_feedback_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "moonie_recommendation_events" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "event" TEXT NOT NULL,
    "novel_id" TEXT,
    "meta" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "moonie_recommendation_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "recommendation_feedback_user_id_novel_id_idx" ON "recommendation_feedback"("user_id", "novel_id");
CREATE INDEX IF NOT EXISTS "recommendation_feedback_user_id_kind_idx" ON "recommendation_feedback"("user_id", "kind");
CREATE INDEX IF NOT EXISTS "moonie_recommendation_events_event_created_at_idx" ON "moonie_recommendation_events"("event", "created_at");
CREATE INDEX IF NOT EXISTS "moonie_recommendation_events_user_id_idx" ON "moonie_recommendation_events"("user_id");

DO $$ BEGIN
  ALTER TABLE "moonie_taste_profiles" ADD CONSTRAINT "moonie_taste_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "recommendation_feedback" ADD CONSTRAINT "recommendation_feedback_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "moonie_recommendation_events" ADD CONSTRAINT "moonie_recommendation_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;
