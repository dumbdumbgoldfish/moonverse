-- Phase 4: personalization privacy controls + LESS_LIKE_THIS feedback kind
ALTER TYPE "RecommendationFeedbackKind" ADD VALUE IF NOT EXISTS 'LESS_LIKE_THIS';

ALTER TABLE "moonie_taste_profiles"
  ADD COLUMN IF NOT EXISTS "use_saved_novels" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS "use_saved_reviews" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS "use_reading_list" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS "use_likes" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS "use_followed_reviewers" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS "use_search_history" BOOLEAN NOT NULL DEFAULT true;
