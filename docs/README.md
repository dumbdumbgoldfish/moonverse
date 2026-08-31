# MoonVerse documentation index

This index separates **historical August 15–18, 2026 technical evaluations** (frozen snapshots in `docs/eval/`) from **August 30, 2026 bounded acceptance evidence** (interpretive pass notes). Raw JSON/CSV in `docs/eval/` are evidence artifacts — do not edit or replace them when reconciling narrative docs.

## Cross-cutting limits (current code)

| Topic | Current behaviour | Where defined |
|-------|-------------------|---------------|
| Logged-in discovery quota | **30** grounded discovery turns per UTC day (`MOONIE_DAILY_DISCOVERY_LIMIT`) | `src/lib/moonie/constants.ts`, `src/lib/moonie/rate-limit.ts` |
| Quota accounting | Persisted in `moonieRecommendationEvent` (`quota_reserved`); not in-memory | `src/lib/moonie/rate-limit.ts` |
| Guest demo cap | Default **3** turns; admin-configurable 1–20 (`guestMoonieDemoCap`) | `src/lib/system-settings.ts`, `/ask-moonie` |
| OpenAI | Optional; heuristic Moonie runs without `OPENAI_API_KEY` | `docs/eval/ai-data-flow.md` |

**Catalogue-ID validation** (unsupported-title rate = 0, allowlist filtering) only proves recommendations reference IDs present in the seeded catalogue. It does **not** establish factual accuracy of titles, synopses, community text, or reader satisfaction.

**OpenAI-disabled evaluation runs** (see Aug 15–17 Moonie eval snapshots: `OpenAI enabled: false`) exercise heuristic extraction, hybrid retrieval, ranking, and allowlisting. They do **not** verify OpenAI Structured Outputs, explanation polish, or any behaviour that only runs when `OPENAI_API_KEY` is set.

**Proposal / IPR / supervisor requirements:** No proposal, IPR, or supervisor feedback documents are stored in this repository. Requirement alignment against those sources is **unverified** unless external documents are supplied and traced in `docs/eval/requirements-traceability.md`.

---

## Historical evaluations — August 15–18, 2026 (`docs/eval/`)

Developer-led technical effectiveness runs against the live local catalogue. These are **not** participant studies and do not claim usability or satisfaction.

| Date (UTC) | Scope | Primary evidence | Notes |
|------------|-------|------------------|-------|
| **2026-08-15** | Moonie scenario eval (15 scenarios) | [`eval/moonie-eval-results-2026-08-15.md`](eval/moonie-eval-results-2026-08-15.md), [`.json`](eval/moonie-eval-results-2026-08-15.json), [`.csv`](eval/moonie-eval-results-2026-08-15.csv) | Earlier metric set (genre baseline overlap) |
| **2026-08-17** | Moonie scenario eval (17 scenarios; OpenAI **off**) | [`eval/moonie-eval-results-2026-08-17.md`](eval/moonie-eval-results-2026-08-17.md), [`.json`](eval/moonie-eval-results-2026-08-17.json), [`.csv`](eval/moonie-eval-results-2026-08-17.csv) | Same aggregates copied to `moonie-eval-results-latest.*` |
| **2026-08-18** | Browse NL parse / polish contracts | [`eval/browse-eval-results-2026-08-18.md`](eval/browse-eval-results-2026-08-18.md), [`.json`](eval/browse-eval-results-2026-08-18.json); [`eval/browse-eval-results-latest.md`](eval/browse-eval-results-latest.md) | 10/10 checks |
| **2026-08-18** | Discover page contracts | [`eval/discover-eval-results-latest.md`](eval/discover-eval-results-latest.md), [`.json`](eval/discover-eval-results-latest.json) | 16/16 checks |

**How to re-run (produces new dated files; does not replace archives above):**

```bash
npm run test:moonie      # unit guardrails
npm run moonie:eval      # full Moonie scenario eval → updates *-latest.* outputs
```

See [`eval/README.md`](eval/README.md) for metrics interpretation, scenario list, and FPR-safe wording.

---

## August 30, 2026 — bounded acceptance evidence

| Document | Scope | Status |
|----------|-------|--------|
| [`MOONIE_SEARCH_ACCEPTANCE_EVIDENCE.md`](MOONIE_SEARCH_ACCEPTANCE_EVIDENCE.md) | Moonie desk + Search service checks; quota-independent vs quota-blocked scenarios separated | Interpretive matrix; several browser checks remain **BLOCKED** or **NOT MEASURED** |

This pass is **acceptance / regression evidence**, not a repeat of the Aug 15–17 Moonie eval script. The five-task Search-vs-Moonie precision table is labeled **preliminary metadata alignment** only.

---

## Supporting documentation

| Document | Purpose |
|----------|---------|
| [`eval/requirements-traceability.md`](eval/requirements-traceability.md) | Distinction upgrades → code paths (implementation evidence) |
| [`eval/functional-test-checklist.md`](eval/functional-test-checklist.md) | Manual FPR checklist — **mostly unfilled** |
| [`eval/ai-data-flow.md`](eval/ai-data-flow.md) | Moonie data flow and rate limits |
| [`migrations.md`](migrations.md) | Prisma migration history notes |

---

## Evidence gaps (documentation only)

- Owner-session browser confirmation of history card persistence after hydration fix (**BLOCKED** in Aug 30 pass).
- New discovery submits while daily quota exhausted (**BLOCKED** by policy; not bypassed in evidence runs).
- Functional checklist FT-01–FT-17: **no Pass/Fail recorded** in repo.
- Participant usability, SUS, click-through, production telemetry: **NOT MEASURED**.
- Proposal/IPR/supervisor requirement mapping: **unverified** (source docs not in repo).
- OpenAI-enabled Moonie behaviour: **NOT MEASURED** in Aug 15–17 eval snapshots.
