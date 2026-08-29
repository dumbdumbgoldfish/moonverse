# Prisma migrations — developer notes

## Known historical issue: Aug 18 browse migrations

Three migrations were applied to some local/staging databases on 2026-08-18, but their original `migration.sql` files were **never committed** and **cannot currently be recovered** from git, branches, backups, or other repo sources.

**Affected migrations:**

- `20260818120000_browse_lab_recipes`
- `20260818120000_user_browse_recipes`
- `20260818133000_browse_analytics_events`

**Current repo state:** Each folder contains a comment-only placeholder so Prisma can resolve the migration history. Fresh environments intentionally treat these as **no-ops** (no DDL runs).

**Checksum drift:** Environments that previously ran the original SQL may report checksum mismatches against the placeholders. This is expected. Do **not** manually edit `_prisma_migrations` or run `prisma migrate reset` to “fix” this.

**Orphan tables:** On databases where the originals ran, `browse_lab_recipes`, `user_browse_recipes`, and `browse_analytics_events` may still exist. They are **not** in `schema.prisma` and are **unused** by current application code (browse lab recipes use `systemSetting` JSON instead). Do not invent replacement migration SQL for the lost files.

## Verified migration: tag suggestions

`20260823180000_tag_suggestions` is valid, committed, and checksum-matched. Tag Suggestion / taxonomy governance is complete — do not modify that migration or related feature code unless explicitly scoped.
