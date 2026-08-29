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

Logged-in users: 10 grounded recommendation turns per day. Guests: a smaller cap on `/ask-moonie`.
