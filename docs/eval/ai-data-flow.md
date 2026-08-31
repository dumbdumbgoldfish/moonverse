# Moonie AI data flow

Moonie is retrieve-first. The language model never searches the open web and never invents catalogue rows.

```
User prompt
  → sanitize + domain guardrail (`src/lib/moonie/guardrails.ts`)
  → heuristic preference extract (always)
  → optional OpenAI Structured Outputs for Zod preferences (only if OPENAI_API_KEY)
  → Postgres hard filters + hybrid retrieval (FTS / pg_trgm / optional JSON embeddings)
  → transparent ranking
  → optional OpenAI explanation polish over candidate IDs only
  → schema + allowlist (drop unknown IDs; never add/reorder cards)
  → RecommendationSession persistence
  → UI cards (Good match / Not for me)
```

## What is sent to OpenAI when the key is set

1. **Preference extract:** the user message plus a system instruction to return JSON preferences. No novel list is sent.
2. **Explanation polish:** the user message, interpreted preferences, and a **candidate list already retrieved from Postgres** (id, title, author, genres, tags, rating, review count).

If `OPENAI_API_KEY` is unset, both steps are skipped. Heuristic extract + template reasons still run.

## What is never sent

- Full novel text or chapter bodies (MoonVerse does not store them)
- Passwords, emails, or DMs
- Other users’ private folders

## Embeddings

Optional `Novel.embedding` JSON is a deterministic hash of title + author + genres + tags + synopsis (not a scraped novel body, and not a paid embedding API). Moonie compares that vector to a hash of the user query with exact cosine. `disableSemantic` turns this term off for ablation. There is no HNSW index. Hosted Postgres without `pgvector` is supported.

## Rate limits

Logged-in users: **30** grounded **discovery** turns per UTC day (`MOONIE_DAILY_DISCOVERY_LIMIT` in `src/lib/moonie/constants.ts`). Quota is tracked in `moonieRecommendationEvent` (`quota_reserved`), not in-memory. Casual chat and quota-free replay paths do not consume this counter when `consumesQuota` is false.

Guests on `/ask-moonie`: a separate demo cap (default **3** turns, admin-configurable via `guestMoonieDemoCap` in system settings).

Local QA may enable `MOONIE_DEV_QUOTA_TOOLS` / `MOONIE_DEV_QUOTA_BYPASS` in `.env` — production behaviour above applies unless those flags are explicitly set.
