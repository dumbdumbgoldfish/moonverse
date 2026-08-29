-- Every Moonie conversation belongs to either a user or a guest, never both.
DELETE FROM "moonie_conversations"
WHERE "user_id" IS NULL AND "guest_key" IS NULL;

UPDATE "moonie_conversations"
SET "guest_key" = NULL
WHERE "user_id" IS NOT NULL AND "guest_key" IS NOT NULL;

-- Normalize historical role casing before enforcing the allowed values.
UPDATE "moonie_messages" SET "role" = LOWER("role");
DELETE FROM "moonie_messages" WHERE "role" NOT IN ('user', 'assistant');

DO $$ BEGIN
  ALTER TABLE "moonie_conversations"
    ADD CONSTRAINT "moonie_conversations_owner_check"
    CHECK (("user_id" IS NOT NULL) <> ("guest_key" IS NOT NULL));
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "moonie_messages"
    ADD CONSTRAINT "moonie_messages_role_check"
    CHECK ("role" IN ('user', 'assistant'));
EXCEPTION WHEN duplicate_object THEN null;
END $$;
