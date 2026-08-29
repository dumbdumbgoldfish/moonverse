-- Distinction catalogue: taxonomy, provenance, embeddings, recommendation sessions.

CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE TYPE "TagKind" AS ENUM ('TROPE', 'MOOD', 'STYLE');
ALTER TYPE "ReportTargetType" ADD VALUE IF NOT EXISTS 'NOVEL';

ALTER TABLE "tags" ADD COLUMN "kind" "TagKind" NOT NULL DEFAULT 'TROPE';
CREATE INDEX "tags_kind_idx" ON "tags"("kind");

ALTER TABLE "novels"
  ADD COLUMN "chapter_count" INTEGER,
  ADD COLUMN "length_band" TEXT,
  ADD COLUMN "metadata_source" TEXT,
  ADD COLUMN "last_verified_at" TIMESTAMP(3),
  ADD COLUMN "embedding" JSONB,
  ADD COLUMN "search_document" tsvector;

CREATE INDEX "novels_length_band_idx" ON "novels"("length_band");
CREATE INDEX "novels_publication_status_idx" ON "novels"("publication_status");
CREATE INDEX "novels_title_trgm_idx" ON "novels" USING gin ("title" gin_trgm_ops);
CREATE INDEX "novels_search_document_idx" ON "novels" USING gin ("search_document");

CREATE TABLE "novel_aliases" (
    "id" TEXT NOT NULL,
    "novel_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "novel_aliases_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "novel_aliases_novel_id_title_key" ON "novel_aliases"("novel_id", "title");
CREATE INDEX "novel_aliases_novel_id_idx" ON "novel_aliases"("novel_id");
CREATE INDEX "novel_aliases_title_idx" ON "novel_aliases"("title");
CREATE INDEX "novel_aliases_title_trgm_idx" ON "novel_aliases" USING gin ("title" gin_trgm_ops);

ALTER TABLE "novel_aliases" ADD CONSTRAINT "novel_aliases_novel_id_fkey" FOREIGN KEY ("novel_id") REFERENCES "novels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "content_warnings" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "content_warnings_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "content_warnings_name_key" ON "content_warnings"("name");
CREATE UNIQUE INDEX "content_warnings_slug_key" ON "content_warnings"("slug");

CREATE TABLE "novel_content_warnings" (
    "novel_id" TEXT NOT NULL,
    "warning_id" TEXT NOT NULL,

    CONSTRAINT "novel_content_warnings_pkey" PRIMARY KEY ("novel_id","warning_id")
);

CREATE INDEX "novel_content_warnings_warning_id_idx" ON "novel_content_warnings"("warning_id");

ALTER TABLE "novel_content_warnings" ADD CONSTRAINT "novel_content_warnings_novel_id_fkey" FOREIGN KEY ("novel_id") REFERENCES "novels"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "novel_content_warnings" ADD CONSTRAINT "novel_content_warnings_warning_id_fkey" FOREIGN KEY ("warning_id") REFERENCES "content_warnings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "moonie_taste_profiles"
  ADD COLUMN "favourite_moods" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "preferred_platforms" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

CREATE TABLE "recommendation_sessions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "conversation_id" TEXT,
    "query" TEXT NOT NULL,
    "interpreted_preferences" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "recommendation_sessions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "recommendation_sessions_user_id_created_at_idx" ON "recommendation_sessions"("user_id", "created_at");
CREATE INDEX "recommendation_sessions_conversation_id_idx" ON "recommendation_sessions"("conversation_id");

ALTER TABLE "recommendation_sessions" ADD CONSTRAINT "recommendation_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "recommendation_results" (
    "id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "novel_id" TEXT NOT NULL,
    "rank" INTEGER NOT NULL,
    "match_score" DOUBLE PRECISION NOT NULL,
    "score_breakdown" JSONB NOT NULL,
    "reasons" TEXT[],
    "caveat" TEXT,
    "explanation" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "recommendation_results_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "recommendation_results_session_id_novel_id_key" ON "recommendation_results"("session_id", "novel_id");
CREATE INDEX "recommendation_results_novel_id_idx" ON "recommendation_results"("novel_id");

ALTER TABLE "recommendation_results" ADD CONSTRAINT "recommendation_results_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "recommendation_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "recommendation_results" ADD CONSTRAINT "recommendation_results_novel_id_fkey" FOREIGN KEY ("novel_id") REFERENCES "novels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "recommendation_feedback" ADD COLUMN "session_id" TEXT;
CREATE INDEX "recommendation_feedback_session_id_idx" ON "recommendation_feedback"("session_id");

CREATE OR REPLACE FUNCTION novels_search_document_update() RETURNS trigger AS $$
BEGIN
  NEW.search_document :=
    setweight(to_tsvector('simple', coalesce(NEW.title, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(NEW.author, '')), 'B') ||
    setweight(to_tsvector('simple', coalesce(NEW.synopsis, '')), 'C');
  RETURN NEW;
END
$$ LANGUAGE plpgsql;

CREATE TRIGGER novels_search_document_trigger
BEFORE INSERT OR UPDATE OF title, author, synopsis
ON novels
FOR EACH ROW
EXECUTE FUNCTION novels_search_document_update();

UPDATE novels SET search_document =
  setweight(to_tsvector('simple', coalesce(title, '')), 'A') ||
  setweight(to_tsvector('simple', coalesce(author, '')), 'B') ||
  setweight(to_tsvector('simple', coalesce(synopsis, '')), 'C');
