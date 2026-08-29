# Requirements traceability (Distinction upgrades)

Maps the five research upgrades to code. This is implementation evidence, not a claim of user satisfaction.

| Requirement | Implementation | Eval / test |
|-------------|----------------|-------------|
| Explainable, grounded Moonie cards | `src/services/moonie-pipeline.service.ts`, `src/components/moonie/MoonieLuxuryCard.tsx` | `npm run test:moonie`; unsupported-title rate |
| Zod preference extraction + schema-validated explanations | `src/lib/moonie/preference-schema.ts`, OpenAI merge in `src/app/api/moonie/recommend/route.ts` | `preference-schema.test.ts` |
| Hybrid retrieval (FTS + pg_trgm + optional embeddings) | `src/services/hybrid-retrieval.service.ts` | Ablation in `npm run moonie:eval` |
| Transparent 40/25/15/10/10 ranking + Bayesian quality | `src/lib/moonie/ranking.ts` | `ranking.test.ts` |
| Recommendation sessions | `RecommendationSession` / `RecommendationResult` in Prisma; persist in pipeline | Schema + migrate |
| Trustworthy novel page (platform CTA, warnings, aggregates, provenance, report metadata) | `src/components/novels/NovelDetailView.tsx` and related | Manual checklist in `functional-test-checklist.md` |
| 3-step skippable taste onboarding | `src/components/onboarding/TasteOnboardingWizard.tsx` | Cards show `influencedBy` |
| Keyword/facet search as baseline vs Moonie | `runSearch` vs `buildGroundedRecommendations` in `scripts/moonie-eval.ts` | `docs/eval/moonie-eval-results-latest.md` |
| Prompt injection / fabricated titles stay catalogue-only | Allowlist in pipeline + scenarios S16–S17 | Unsupported-title rate = 0 |
| Cosmic Editorial + skip link + reduced motion | `src/app/globals.css`, `AppChrome`, `MoonieCharacter` | Keyboard: skip link, 44px targets |

Search (`src/services/search.service.ts`) remains lexical so the evaluation baseline matches the product.
