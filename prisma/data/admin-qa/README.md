# MoonVerse Admin QA extension dataset

**Development/demo only.** Adds synthetic users and content on top of the existing 100-user demo dataset without wiping community tables.

## Safety

1. **Back up Postgres first** (example):
   ```bash
   PGPASSWORD=moonverse pg_dump -h localhost -p 5433 -U moonverse -d moonverse \
     -F p -f prisma/backups/backup-before-admin-qa-$(date +%Y%m%d-%H%M%S).sql
   ```
2. Do **not** run `npm run prisma:seed` (4-user basic seed).
3. Do **not** run `npm run prisma:seed:demo` unless you intend to **wipe and re-import** the full demo JSONL dataset.

## Commands

```bash
# Phase 1 — users, follows, moderation queues, Moonie analytics
npm run demo:seed:admin-qa -- --dry-run
npm run demo:seed:admin-qa -- --confirm

# Phase 2 — novels, reviews, comments, replies, likes (time-spread for charts)
npm run demo:seed:admin-qa-content -- --dry-run
npm run demo:seed:admin-qa-content -- --confirm

# Re-run content extension (only if you need a fresh import)
npm run demo:seed:admin-qa-content -- --confirm --force

# Verify entity counts + admin query sanity
npm run verify:admin-qa
```

Run phase 1 before phase 2. Phase 2 is idempotent via `content-manifest.json`.

## What gets created

### Phase 1 (users)
- **Users:** `@moonverse.qa` synthetic accounts (password: `Password123!`)
- **Activity:** reviews, comments, replies, likes, follows, folders, notifications
- **Moderation:** open/resolved/dismissed reports, auto-flagged content, tag suggestions, pending reading links
- **Moonie:** conversations, messages, recommendation events (for analytics)
- **Audit:** moderation audit log entries

### Phase 2 (content)
- **Novels:** +400 across genres/tags (catalog + synthetic titles)
- **Reviews:** +12,000 with varied ratings, lengths, spoiler flags, moderation states
- **Comments:** +6,000 top-level + 2,500 threaded replies
- **Likes:** +25,000 review likes, +4,000 comment likes
- **Saves / notifications:** +3,000 folder saves, +2,000 notifications
- **Timestamps:** skewed across ~180 days so admin line/bar charts show realistic growth

All Admin dashboard metrics and charts read from these stored records via existing Prisma services — nothing is hard-coded in the UI.

## Idempotency

- Phase 1 skips when `@moonverse.qa` user count already meets the 1,529 extension target.
- Phase 2 skips when `content-manifest.json` exists (use `--force` to re-import).

## Manifests

- `prisma/data/admin-qa/manifest.json` — phase 1 before/after counts
- `prisma/data/admin-qa/content-manifest.json` — phase 2 before/after counts

## Profile presentation refresh

Refreshes **display names**, **avatars**, and **profile backgrounds** for all non-admin users. Usernames, emails, passwords, roles, and relationships are untouched.

```bash
# Generate local SVG assets (public/demo/avatars, public/demo/banners)
npm run demo:generate:profile-assets

# Preview changes (no writes)
npm run demo:refresh:user-profiles -- --dry-run

# Apply (requires backup first + --confirm)
npm run demo:refresh:user-profiles -- --confirm
```

Admin accounts (`role: ADMIN`) are skipped so demo login stays recognizable (e.g. `ivynight75` / Ivy Brennan).
