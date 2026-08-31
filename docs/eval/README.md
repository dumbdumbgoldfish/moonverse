# Moonie evaluation (technical effectiveness)

This folder stores reproducible evidence for the Final Project Report. Evaluation is **developer-led / technical**. It does **not** claim participant usability, satisfaction, or SUS unless an ethics-approved study is added later.

**Documentation index:** See [`../README.md`](../README.md) for how this folder relates to August 30 acceptance evidence and for cross-cutting limits (quota, OpenAI-off runs, catalogue-ID vs factual accuracy).

## Archived run dates (do not overwrite)

| Period | What was run | Frozen artifacts |
|--------|--------------|------------------|
| **2026-08-15** | Moonie eval, 15 scenarios | `moonie-eval-results-2026-08-15.{md,json,csv}` |
| **2026-08-17** | Moonie eval, 17 scenarios, **OpenAI disabled** | `moonie-eval-results-2026-08-17.{md,json,csv}`; `moonie-eval-results-latest.*` (same 22:49 UTC snapshot) |
| **2026-08-18** | Browse + Discover contract evals | `browse-eval-results-2026-08-18.*`, `browse-eval-results-latest.*`, `discover-eval-results-latest.*` |

Re-running `npm run moonie:eval` updates `*-latest.*` outputs only. Dated files remain the historical record.

**OpenAI-disabled runs:** Aug 15–17 Moonie snapshots record `OpenAI enabled: false`. They validate heuristic extraction, retrieval, ranking, and catalogue allowlisting — **not** OpenAI Structured Outputs or explanation polish when a key is present.

**Unsupported-title rate = 0** means every returned `novelId` exists in the catalogue allowlist. That is **catalogue-ID validation**, not a claim that recommendations are factually correct or that readers would agree they are relevant.

## What is compared

| System | What it is |
|--------|------------|
| **Baseline** | The same keyword/facet **works** search users get (`runSearch` in `src/services/search.service.ts`) |
| **Moonie** | Grounded hybrid retrieval + transparent ranking + allowlisted cards (`buildGroundedRecommendations`) |
| **Ablation** | Moonie with embeddings disabled (`disableSemantic: true`) |

Search stays lexical on purpose so the baseline is the product users already have. Moonie uses FTS, `pg_trgm`, structured overlap, Bayesian quality, taste history, and optional exact cosine on stored JSON embeddings.

## Prerequisites

1. PostgreSQL running with `DATABASE_URL` set (see `.env`).
2. Seeded novel catalogue (`npm run db:seed` or demo seed).
3. Distinction migration applied (`npx prisma migrate deploy`) so `pg_trgm` / `search_document` exist. If those extensions are missing, hybrid retrieval falls back to Prisma filters.

## Commands

```bash
# Unit tests (guardrails, ranking, Zod allowlist, metrics)
npm run test:moonie

# Full scenario evaluation against the live catalogue
npm run moonie:eval

# Fewer consistency repeats (faster)
npm run moonie:eval -- --consistency 2

# Single scenario
npm run moonie:eval -- --scenario S01
```

## Outputs

After `moonie:eval`:

| File | Use in FPR |
|------|------------|
| `moonie-eval-results-latest.md` | Appendix table / narrative |
| `moonie-eval-results-latest.json` | Raw evidence |
| `moonie-eval-results-YYYY-MM-DD.csv` | Spreadsheet appendix |
| `requirements-traceability.md` | Maps requirements to implementation |
| `ai-data-flow.md` | What leaves the app when OpenAI is enabled |

## Scenario set

See [`../../data/moonie-eval-scenarios.json`](../../data/moonie-eval-scenarios.json):

- **clear**: explicit genre/tag requests
- **multi**: multi-constraint preferences
- **vague**: soft prompts
- **off_topic**: domain guardrail checks
- **injection**: “ignore previous instructions / invent a title”
- **fabricated**: named titles that are not in the catalogue

## Interpreting metrics

| Metric | Meaning | Target (technical) |
|--------|---------|-------------------|
| Unsupported-title rate | Share of recs whose `novelId` is not in the catalogue allowlist | **0** target (ID validation only; not factual accuracy) |
| Top-5 relevance | Genre/tag overlap with interpreted prefs | Higher is better |
| Consistency | Jaccard overlap across repeated runs | Stable rankings |
| Diversity | Unique IDs / total IDs in batch | Avoid total homogenisation |
| Explanation grounding | Reasons cite title/genre/tag/status on the candidate | High |
| Off-topic accuracy | Guardrail matches expected label | High |
| Baseline overlap | Overlap with keyword/facet works search | Shows Moonie ≠ plain keyword when tropes/moods differ |
| Latency | Wall-clock for one Moonie turn vs search | Report, do not over-claim |
| Ablation | Relevance with embeddings off | Documents the 40% semantic term |

## FPR claim wording (safe)

> Moonie was evaluated for technical effectiveness using fixed scenarios against the same keyword/facet search users receive. Results show database-grounded recommendations with an unsupported-title rate of X and mean preference relevance of Y. This does not measure reader satisfaction.

## Critical analysis notes (17 August 2026 snapshot)

Use these as report paragraphs, not as extra product claims. Numbers are from `moonie-eval-results-2026-08-17` (OpenAI off, 17 scenarios, catalogue size 1002). Re-run at 22:49 UTC the same day produced the same aggregates (unsupported-title 0, mean relevance 0.651, ablation 0.650, S07 relevance 0, S15 empty). Replace X/Y only if a later snapshot changes.

1. **S07 (vague “cosy”)** returned a five-title slate with relevance 0 and grounding 0. Mood `cosy` did not map onto catalogue tags. The desk chip “Something cosy” now sends a found-family / slice-of-life / hopeful prompt so the product does not repeat that empty mapping. The eval scenario stays vague on purpose. Write this as “Moonie is not magic when the request has no structured overlap.”

2. **S15 (sci-fi space opera, hopeful, strong FL)** returned 0 recommendations. That is an honest empty. Browse cannot invent the book either. Argue whether emptiness is better for the reader than a weak filler list.

3. **S16 / S17** keep unsupported-title rate at 0 under injection and a fabricated title. Their relevance 1.0 is a **metric artifact**: empty interpreted prefs make `recommendationRelevance` treat any catalogue ID as relevant (`src/lib/moonie/eval-metrics.ts`). Do not quote 1.0 as perfect jailbreak recommendations. The real claim is allowlisting.

4. **Ablation.** Embeddings off scored 0.650 vs 0.651 mean relevance on this run. Describe the 40% semantic term as optional lexical-hash overlap that did not move this snapshot. Do not sell it as a breakthrough.

5. **Catalogue composition.** S01 mixed titles such as *Oathbringer* into a revenge-fantasy, strong-FL request. Relevance 0.6 with 0 overlap vs search is interesting, but discuss whether seed genre/tag coverage limits preference match. That is data analysis, not a CSS issue.

6. **No participant study.** `npm run test:moonie`, `npm run moonie:eval`, and the functional checklist are developer-led. Unless you have ethics-approved users, do not claim satisfaction, SUS, or “readers found novels faster.” Claim inspectability, complementarity of ranking, and zero unsupported titles.

The product desk now shows used vs ignored taste, a slate diversity line, a Catalogue only seal, and “See how search ranks this” for the same request. Screenshot those next to the metrics above.
