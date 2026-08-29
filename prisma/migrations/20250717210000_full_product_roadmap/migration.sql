-- AlterEnum NotificationType
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'MOONIE_DAILY_PICK';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'REPORT_UPDATE';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'DIGEST';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'DIRECT_MESSAGE';

-- CreateEnum
DO $$ BEGIN
  CREATE TYPE "AuthTokenType" AS ENUM ('EMAIL_VERIFY', 'PASSWORD_RESET');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "ReportTargetType" AS ENUM ('REVIEW', 'COMMENT', 'USER');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "ReportStatus" AS ENUM ('OPEN', 'RESOLVED', 'DISMISSED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "ContentModerationStatus" AS ENUM ('OK', 'AUTO_FLAGGED', 'HIDDEN');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "ReadingStatusValue" AS ENUM ('WANT', 'READING', 'FINISHED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "DigestCadence" AS ENUM ('OFF', 'DAILY', 'WEEKLY');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- User columns
ALTER TABLE "users" ALTER COLUMN "password_hash" DROP NOT NULL;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "email_verified" TIMESTAMP(3);

-- Folder featured
ALTER TABLE "folders" ADD COLUMN IF NOT EXISTS "is_featured" BOOLEAN NOT NULL DEFAULT false;

-- Review moderation
ALTER TABLE "reviews" ADD COLUMN IF NOT EXISTS "moderation_status" "ContentModerationStatus" NOT NULL DEFAULT 'OK';

-- Comment spoilers + moderation
ALTER TABLE "comments" ADD COLUMN IF NOT EXISTS "contains_spoilers" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "comments" ADD COLUMN IF NOT EXISTS "moderation_status" "ContentModerationStatus" NOT NULL DEFAULT 'OK';

CREATE TABLE IF NOT EXISTS "accounts" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "provider_account_id" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,
    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "auth_tokens" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" "AuthTokenType" NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "used_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "auth_tokens_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "notification_preferences" (
    "user_id" TEXT NOT NULL,
    "email_enabled" BOOLEAN NOT NULL DEFAULT true,
    "digest_cadence" "DigestCadence" NOT NULL DEFAULT 'WEEKLY',
    "moonie_daily_email" BOOLEAN NOT NULL DEFAULT true,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "notification_preferences_pkey" PRIMARY KEY ("user_id")
);

CREATE TABLE IF NOT EXISTS "reports" (
    "id" TEXT NOT NULL,
    "reporter_id" TEXT NOT NULL,
    "target_type" "ReportTargetType" NOT NULL,
    "target_id" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "details" TEXT,
    "status" "ReportStatus" NOT NULL DEFAULT 'OPEN',
    "resolved_by_id" TEXT,
    "resolution" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "reports_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "moderation_audit_logs" (
    "id" TEXT NOT NULL,
    "actor_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "meta" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "moderation_audit_logs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "novel_reading_statuses" (
    "user_id" TEXT NOT NULL,
    "novel_id" TEXT NOT NULL,
    "status" "ReadingStatusValue" NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "novel_reading_statuses_pkey" PRIMARY KEY ("user_id","novel_id")
);

CREATE TABLE IF NOT EXISTS "featured_novels" (
    "id" TEXT NOT NULL,
    "novel_id" TEXT NOT NULL,
    "slot" INTEGER NOT NULL DEFAULT 0,
    "starts_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ends_at" TIMESTAMP(3),
    "created_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "featured_novels_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "review_drafts" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "novel_id" TEXT,
    "payload" JSONB NOT NULL,
    "scheduled_publish_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "review_drafts_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "moonie_conversations" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "guest_key" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "moonie_conversations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "moonie_messages" (
    "id" TEXT NOT NULL,
    "conversation_id" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "meta" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "moonie_messages_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "conversations" (
    "id" TEXT NOT NULL,
    "user_a_id" TEXT NOT NULL,
    "user_b_id" TEXT NOT NULL,
    "last_message_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "conversations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "direct_messages" (
    "id" TEXT NOT NULL,
    "conversation_id" TEXT NOT NULL,
    "sender_id" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "read_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "direct_messages_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "system_settings" (
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "system_settings_pkey" PRIMARY KEY ("key")
);

CREATE UNIQUE INDEX IF NOT EXISTS "accounts_provider_provider_account_id_key" ON "accounts"("provider", "provider_account_id");
CREATE INDEX IF NOT EXISTS "accounts_user_id_idx" ON "accounts"("user_id");
CREATE UNIQUE INDEX IF NOT EXISTS "auth_tokens_token_hash_key" ON "auth_tokens"("token_hash");
CREATE INDEX IF NOT EXISTS "auth_tokens_user_id_type_idx" ON "auth_tokens"("user_id", "type");
CREATE INDEX IF NOT EXISTS "reports_status_created_at_idx" ON "reports"("status", "created_at");
CREATE INDEX IF NOT EXISTS "reports_target_type_target_id_idx" ON "reports"("target_type", "target_id");
CREATE INDEX IF NOT EXISTS "reports_reporter_id_idx" ON "reports"("reporter_id");
CREATE INDEX IF NOT EXISTS "moderation_audit_logs_created_at_idx" ON "moderation_audit_logs"("created_at");
CREATE INDEX IF NOT EXISTS "moderation_audit_logs_entity_type_entity_id_idx" ON "moderation_audit_logs"("entity_type", "entity_id");
CREATE INDEX IF NOT EXISTS "novel_reading_statuses_novel_id_idx" ON "novel_reading_statuses"("novel_id");
CREATE INDEX IF NOT EXISTS "novel_reading_statuses_user_id_status_idx" ON "novel_reading_statuses"("user_id", "status");
CREATE INDEX IF NOT EXISTS "featured_novels_starts_at_ends_at_idx" ON "featured_novels"("starts_at", "ends_at");
CREATE INDEX IF NOT EXISTS "featured_novels_slot_idx" ON "featured_novels"("slot");
CREATE INDEX IF NOT EXISTS "review_drafts_user_id_idx" ON "review_drafts"("user_id");
CREATE INDEX IF NOT EXISTS "review_drafts_scheduled_publish_at_idx" ON "review_drafts"("scheduled_publish_at");
CREATE INDEX IF NOT EXISTS "moonie_conversations_user_id_idx" ON "moonie_conversations"("user_id");
CREATE INDEX IF NOT EXISTS "moonie_conversations_guest_key_idx" ON "moonie_conversations"("guest_key");
CREATE INDEX IF NOT EXISTS "moonie_messages_conversation_id_created_at_idx" ON "moonie_messages"("conversation_id", "created_at");
CREATE UNIQUE INDEX IF NOT EXISTS "conversations_user_a_id_user_b_id_key" ON "conversations"("user_a_id", "user_b_id");
CREATE INDEX IF NOT EXISTS "conversations_last_message_at_idx" ON "conversations"("last_message_at");
CREATE INDEX IF NOT EXISTS "direct_messages_conversation_id_created_at_idx" ON "direct_messages"("conversation_id", "created_at");
CREATE INDEX IF NOT EXISTS "direct_messages_sender_id_idx" ON "direct_messages"("sender_id");
CREATE INDEX IF NOT EXISTS "folders_is_featured_is_public_idx" ON "folders"("is_featured", "is_public");
CREATE INDEX IF NOT EXISTS "reviews_moderation_status_idx" ON "reviews"("moderation_status");
CREATE INDEX IF NOT EXISTS "comments_moderation_status_idx" ON "comments"("moderation_status");

DO $$ BEGIN
  ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "auth_tokens" ADD CONSTRAINT "auth_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "reports" ADD CONSTRAINT "reports_reporter_id_fkey" FOREIGN KEY ("reporter_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "reports" ADD CONSTRAINT "reports_resolved_by_id_fkey" FOREIGN KEY ("resolved_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "moderation_audit_logs" ADD CONSTRAINT "moderation_audit_logs_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "novel_reading_statuses" ADD CONSTRAINT "novel_reading_statuses_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "novel_reading_statuses" ADD CONSTRAINT "novel_reading_statuses_novel_id_fkey" FOREIGN KEY ("novel_id") REFERENCES "novels"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "featured_novels" ADD CONSTRAINT "featured_novels_novel_id_fkey" FOREIGN KEY ("novel_id") REFERENCES "novels"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "featured_novels" ADD CONSTRAINT "featured_novels_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "review_drafts" ADD CONSTRAINT "review_drafts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "review_drafts" ADD CONSTRAINT "review_drafts_novel_id_fkey" FOREIGN KEY ("novel_id") REFERENCES "novels"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "moonie_conversations" ADD CONSTRAINT "moonie_conversations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "moonie_messages" ADD CONSTRAINT "moonie_messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "moonie_conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "conversations" ADD CONSTRAINT "conversations_user_a_id_fkey" FOREIGN KEY ("user_a_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "conversations" ADD CONSTRAINT "conversations_user_b_id_fkey" FOREIGN KEY ("user_b_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "direct_messages" ADD CONSTRAINT "direct_messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "direct_messages" ADD CONSTRAINT "direct_messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;
