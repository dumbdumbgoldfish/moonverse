-- Remove invalid historical feedback before enforcing catalogue integrity.
DELETE FROM "recommendation_feedback" AS feedback
WHERE NOT EXISTS (
  SELECT 1
  FROM "novels"
  WHERE "novels"."id" = feedback."novel_id"
);

-- Events are retained for aggregate analytics when their novel was removed.
UPDATE "moonie_recommendation_events" AS event
SET "novel_id" = NULL
WHERE event."novel_id" IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM "novels"
    WHERE "novels"."id" = event."novel_id"
  );

CREATE INDEX IF NOT EXISTS "moonie_recommendation_events_novel_id_idx"
ON "moonie_recommendation_events"("novel_id");

DO $$ BEGIN
  ALTER TABLE "recommendation_feedback"
    ADD CONSTRAINT "recommendation_feedback_novel_id_fkey"
    FOREIGN KEY ("novel_id") REFERENCES "novels"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "moonie_recommendation_events"
    ADD CONSTRAINT "moonie_recommendation_events_novel_id_fkey"
    FOREIGN KEY ("novel_id") REFERENCES "novels"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;
