# Moonie & Search — Bounded Acceptance Evidence

**Date:** 2026-08-30
**Dataset:** Live local MoonVerse catalogue (fixed at run time; not reseeded).
**Index:** See [`README.md`](README.md) for separation from August 15–18 eval archives.
**DPP / IPR / supervisor feedback:** Not present in this repository; alignment **unverified** without those source documents.

**Scope:** Bounded acceptance / regression pass (automated tests + selective HTTP/browser checks). This is **not** a repeat of `npm run moonie:eval` (Aug 15–17 snapshots). Catalogue-ID checks in automated tests validate allowlisting, not factual accuracy. No OpenAI-enabled eval was run in this pass.

---

## Automated verification summary

| Check | Result (initial pass) | Result (section 6 retest) |
|-------|----------------------|---------------------------|
| `npm test` | **266/266 pass** (single run; no flakes on this pass) | **274/274 pass** |
| `npm run lint` | Clean | Clean |
| `npm run typecheck` | Clean (after `spoiler-mode.ts` narrowing fix) | Clean |
| `git diff --check` | Clean | Not re-run in this pass |
| `npm run build` | Success (dev server stopped first) | **NOT MEASURED** (dev server active on `:3000`) |

**Prisma flake note (initial pass):** A second immediate `moonie-search-evaluation.ts` run logged `Engine is not yet connected` during `buildCommunityInsight`; the evaluation completed successfully on the recorded run. Full `npm test` did not fail on that pass.

---

## Requirement → scenario matrix

### Successful-response checks (quota-independent or non-discovery)

| Requirement | Scenario | Expected | Observed (initial) | Status (initial) | Observed (retest) | Status (retest) | Evidence |
|-------------|----------|----------|-------------------|------------------|-------------------|-----------------|----------|
| Novel about, no context | `what is this novel about?` empty thread | One clarification; no lookup / arbitrary pick | Reply: "Which novel should I summarize?…"; no `lookupSession` | **PASS** | Covered by existing suite | **PASS** | `moonie-final-acceptance.test.ts` |
| Replay spoiler fail-closed | Stored community refresh fails; none/light | Withhold unverified review-derived text; preserve IDs/order/count | Unfamiliar spoiler prose stripped; card metadata preserved | **PASS** | Covered by existing suite | **PASS** | `spoiler-mode.ts`; tests |
| Top 3 ranking | "Recommend me three fantasy novels with details" | 3 eligible Fantasy cards, ranked | 3 Fantasy IDs; matchPercent monotonic | **PASS** | Covered by existing suite | **PASS** | `moonie-final-acceptance.test.ts` |
| Catalogue best-match | "What is the best match for fantasy?" after shown seed | Shortlist ranking; may reuse shown eligible titles | 1 Fantasy pick; shortlist wording | **PASS** | Covered by existing suite | **PASS** | `moonie-final-acceptance.test.ts` |
| DB failure vs zero-match | Unknown reviewer vs missing profile | Different reply classes | "couldn't find…matching" vs "couldn't load that reviewer profile" | **PASS** | Covered by existing suite | **PASS** | `moonie-final-acceptance.test.ts` |
| Search title lookup | `runSearch({ q: culpa, type: works })` | Title hits with novel links | 1+ Culpa match | **PASS** | 1+ Culpa match | **PASS** | `search-acceptance.test.ts` |
| Search genre filter | `genreSlug: fantasy` | Fantasy works only | All hits Fantasy genre | **PASS** | All hits Fantasy genre | **PASS** | `search-acceptance.test.ts` |
| Search tag filter | `tagSlugs: slow-burn` | Tag-matched works | Not run in initial pass | — | Slow-burn tag facet; tagged hits | **PASS** | `search-acceptance.test.ts` |
| Search review filter | `type: reviews`, fantasy query | Review rows with novel ids | Not run in initial pass | — | Review hits with `id` + `novelId` | **PASS** | `search-acceptance.test.ts` |
| Search combined filters | genre + tag + text | Facets and filtered totals | Partial (genre+text only) | **PASS** | Fantasy + slow-burn + magic facets | **PASS** | `search-acceptance.test.ts` |
| Search sorting | `sort: highest-rated` | Rating-descending works | Not run in initial pass | — | Monotonic `averageRating` order | **PASS** | `search-acceptance.test.ts` |
| Search pagination / totals | limit 4, offset 0/4 | Totals ≥ page size; disjoint pages | Disjoint IDs when page full | **PASS** | Totals ≥ returned rows; disjoint page-2 IDs | **PASS** | `search-acceptance.test.ts` |
| Search result navigation ids | Work hits return catalogue ids | Non-empty cuid-style ids | Not run in initial pass | — | All work hits have catalogue ids | **PASS** | `search-acceptance.test.ts` |
| Search no-match | Nonsense query | Honest empty totals | All totals 0 | **PASS** | All totals 0 | **PASS** | `search-acceptance.test.ts` |
| Auth: existing → new chat → refresh×2 | Browser `xianxian` session | Clean new chat survives reloads | `?new=1`, 0 cards after each refresh | **PASS** | Not re-run | **NOT MEASURED** | Browser (initial only) |
| Auth: draft while pending | Submit + type follow-up during wait | Draft survives response | Draft `tell me more about the first one` kept | **PASS** | Not re-run | **NOT MEASURED** | Browser (initial only) |
| Auth: outgoing spoiler mode | Toggle to Light → submit | `spoilerMode: light` in POST body | Captured in fetch hook | **PASS** | Not re-run | **NOT MEASURED** | Browser (initial only) |
| History hydration (server) | Replay row nested-only meta | 16 recs + `responseKind` on load | Cards missing in UI on reopen; nested-only DB rows identified later | **FAIL** (root cause) | `hydrateStoredAssistantMeta` restores 16 recs; IDs stable across simulated reload | **PASS** | `moonie-history-hydration.test.ts`; fixture `cmtfqdkne01893dkxyr46jnvw` |
| Replay sequence context | Nested-only replay in sequence | `collectSequenceRecommendationsForReplay` includes nested recs | Not diagnosed in initial pass | — | 16 IDs from nested-only replay row | **PASS** | `conversation-context-replay.test.ts` |
| Guest `/ask-moonie` | Unsigned HTTP GET | Guest shell, no auth redirect | Automation tabs authenticated; `/ask-moonie` redirects to `/moonie` | **BLOCKED** | `GET /ask-moonie` → 200; guest markup; no redirect | **PASS** | `curl` without session cookie |

### Quota-blocked or incomplete browser checks

| Requirement | Scenario | Expected | Observed (initial) | Status (initial) | Observed (retest) | Status (retest) | Evidence |
|-------------|----------|----------|-------------------|------------------|-------------------|-----------------|----------|
| Auth: replay / card persistence (browser UI) | Reopen **owned** conversation while discovery quota exhausted | Stable card IDs/counts in desk UI | Automation did not confirm cards; `xianxian` at **30/30** discovery quota; initial notes mentioned "hydration overlay" | **BLOCKED** | Server history path fixed; browser tab was `pansaru` (not owner `yuexian`) — empty desk | **BLOCKED** | Wrong-session browser; owner-session UI not re-verified |
| Auth: new recommendation submit | Slice-of-life discovery request | Cards returned | `xianxian` discovery quota exhausted (**30/30** used) | **BLOCKED** | Not re-run (no quota bypass) | **BLOCKED** | Quota policy unchanged |

**Initial pass interpretation (recorded):** Card persistence was **BLOCKED** in automation when `xianxian` had no remaining discovery quota. That blocked **new** discovery submits, not history reload by itself.

**Reconciliation (2026-08-30 docs pass):** Missing cards on reopen for conversation `cmtfqdkne01893dkxyr46jnvw` were traced to **nested-only** `meta.response.recommendations` without top-level `meta.recommendations` — a history hydration gap, **not** discovery quota exhaustion. The desk `isRestoring` state was mistaken for a quota overlay in initial notes; retest found no rate-limit panel on history reload.

**Daily discovery quota (code):** `MOONIE_DAILY_DISCOVERY_LIMIT = 30` per UTC day (`src/lib/moonie/constants.ts`). UI badge shows **remaining** turns (e.g. "16/30 left" means 16 remaining, not 16 used).

---

## Search vs Moonie evaluation (developer-led)

**Label:** **Preliminary metadata alignment** — precision against catalogue constraints in `scripts/moonie-search-evaluation.ts`, not independent human relevance labels or user-satisfaction metrics.

| Task | Moonie precision (n) | Search precision (n) | Notes |
|------|----------------------|----------------------|-------|
| Top 3 fantasy | 1.0 (3/3) | 1.0 (8/8 shown) | Moonie enforces genre constraint; Search genre filter + keyword |
| Completed slice-of-life | 1.0 (5/5) | 1.0 (6/6) | Moonie adds completed hard constraint |
| Reviewer ezraink76 | 1.0 (profile) | 1.0 (1/1 people) | Moonie returns authored reviews, not novel cards |
| Culpa Tuya overview | 1.0 (1/1) | 1.0 (1/1) | Both ground on same catalogue row |
| Found-family paraphrase | 1.0 (5/5) | 0.375 (3/8) | Search keyword "found family" is broader; Moonie OR-tag constraint stricter |

**Retest:** Five-task evaluation script **not re-run** in section 6 (review guidance only).

**NOT MEASURED:** User satisfaction, discovery latency, click-through to novel pages, cross-session Moonie recall, production quota telemetry, independent human relevance labels, OpenAI-enabled behaviour.

**Dataset limitations:** Genre/tag coverage is uneven; Search lexical match can surface catalogue rows that lack explicit tag proof of "found family" semantics. Moonie constraint satisfaction is verified against hard-constraint helpers, not independent human relevance labels. Catalogue-ID allowlisting does not prove factual accuracy.

---

## Changed paths (reference)

### Initial pass

```
src/lib/moonie/spoiler-mode.ts
src/services/moonie-novel-lookup.service.ts
src/services/moonie-final-acceptance.test.ts (new)
src/services/search-acceptance.test.ts (new)
scripts/moonie-search-evaluation.ts (new, reproducibility harness)
docs/MOONIE_SEARCH_ACCEPTANCE_EVIDENCE.md (new)
```

### Section 6 retest (application fixes; see git diff)

```
src/lib/moonie/persist-assistant-turn.ts
src/actions/moonie.actions.ts
src/lib/moonie/conversation-context.ts
src/lib/moonie/moonie-history-hydration.test.ts
src/lib/moonie/conversation-context-replay.test.ts
src/services/search-acceptance.test.ts
```

---

## Server state (last recorded)

- Dev server **running** on `localhost:3000` during section 6 retest (`npm run build` not re-run).
- Authenticated user `xianxian` hit **30/30 discovery quota used** (0 remaining) during initial browser pass — blocks new discovery, not documented history hydration.
- Conversation fixture `cmtfqdkne01893dkxyr46jnvw` owned by `yuexian`; nested-only replay rows confirmed in DB.

---

## Aug 30 evening — bounded Moonie repair batch (appended)

| Bug | Confirmed cause | Fix | Automated verification |
|-----|-----------------|-----|------------------------|
| No-match box missing on history reopen | `state: "no_results"` stored only under `meta.response`; history mapping read top-level `meta.state` only | Hydrate `state` via `pickStoredMoonieMetaField`; persist `state` at top level in `buildPersistedAssistantMeta` | **PASS** `moonie-history-hydration.test.ts`, `persist-assistant-turn.test.ts` |
| Refresh leaves conversation blank until sidebar re-click | Hydration fired before session ready → auth failure dismissed conversation; stale `?new=1` intent blocked URL hydration; `isRestoring` hid transcript while messages empty | Gate hydration on `sessionReady`; clear new-chat intent when URL has `conversation=`; only dismiss on not-found | **NOT MEASURED** (browser); logic fix in `use-moonie-chat.ts` |
| “All previous recommendations again” returns wrong/unseen IDs | Replay used sequence-scoped collector; phrase without “Show” not recognized | `collectAllConversationRecommendationsForReplay` + extended `isRecommendationReplayRequest` | **PASS** `conversation-context-replay.test.ts`, `recommend-request.test.ts`, `moonie-recommendation-path.test.ts` |
| Reviewer follow-up “how about pan” → novel guidance | `extractReviewerLookupQuery` did not parse “how/what about …” continuations | `REVIEWER_CONTINUATION_RE` in `reviewer-intent.ts` | **PASS** `moonie-response-routing.test.ts` (routes to reviewer search, not generic discovery text) |

**Short + completed no-match:** Reply text “could not find… completed, short length” reflects hard-constraint filtering. Unknown `lengthBand` is not treated as short (`hard-constraints.ts`). **NOT MEASURED** in this pass: exact eligible count in live catalogue.

**Preserved regressions:** 16-card nested replay hydration and new-chat blank-after-refresh behavior unchanged by these fixes.

**Browser:** Owner-session UI checks for no-match box persistence and refresh hydration remain **NOT MEASURED** in this pass.

---

## Aug 30 late — cultivation metadata, review references, confirmation loop

**Scope:** Three bounded repairs from screenshot reproductions (`cmtg16a0i00093dd3du7z7agw`, `cmtg1yx9t000f3d1k5qp3rj24`). Generator fix + runtime eligibility; no reseed, commit, push, or quota reset.

### Root cause (confirmed)

| Issue | Cause |
|-------|--------|
| Literary titles match “cultivation” / “completed” | `generate-demo-dataset.ts` randomly assigned `WEB_NOVEL_GENRE_CYCLE` secondary genres and `Ongoing/Completed/Hiatus` to Open Library rows; existing DB rows retain `secondaryGenreSlug: cultivation` etc. |
| “reviews of these novels” → verify “these” | `extractReviewNovelQuery` stripped trailing “novels”, leaving pronouns as literal catalogue titles |
| “This one” confirmation loop | UI sent text-only confirmation; unresolved lookup cards shown whenever `recommendations.length === 0` (including confirmed review responses) |

### Fix summary

| Area | Change |
|------|--------|
| Metadata eligibility | `metadata-eligibility.ts` strips unsupported progression genres and synthetic status on `seed-catalog` / `open-library-demo` rows without web-novel origin evidence; wired through hard constraints, hybrid retrieval, pipeline reasons, and Search genre filter |
| Generator | `generate-demo-dataset.ts` no longer random-assigns web-novel secondary genres or publication status on Open Library imports |
| Review references | Plural/ambiguous phrasing routes to `buildBatchNovelReviewsResponse`; pronouns blocked from title extraction; batch review groups with spoiler protection |
| Confirmation | `confirmLookupNovelId` through API/UI; `isUnresolvedLookupSession`; `buildSingleNovelReviewsFromConfirmation`; persist/hydrate `novelReviewGroups` |

### Automated verification (this batch)

| Check | Result |
|-------|--------|
| `npm run typecheck` | **PASS** |
| `npm run lint` | **PASS** (warnings only) |
| `npm test` | **290/292 pass** on last full run; **2 intermittent Prisma `Engine is not yet connected` flakes** in `moonie-response-routing.test.ts` more-like-this cases (same class as prior eval note) |
| `metadata-eligibility.test.ts` | **PASS** — contaminated cultivation/completed cannot satisfy hard constraints; web-novel-origin rows preserved |
| `review-reference.test.ts` | **PASS** — plural/ambiguous/no-pronoun-title extraction |
| `presentation-lookup.test.ts` | **PASS** — confirmed lookup sessions not unresolved |
| `moonie-response-routing.test.ts` | **PASS** — plural batch reviews + ambiguous “that novels” clarification (when DB connected) |
| Prior regressions (replay, hydration, spoiler, reviewer continuation) | **PASS** on same run |

### Live DB repair — **PENDING APPROVAL**

Idempotent script: `scripts/repair-contaminated-catalogue-metadata.ts`

```bash
npx tsx --env-file=.env scripts/repair-contaminated-catalogue-metadata.ts --dry-run
# After approval only:
npx tsx --env-file=.env scripts/repair-contaminated-catalogue-metadata.ts --apply
```

Dry-run (local DB): **242** candidate rows with unsupported progression genre disconnects and/or cleared synthetic `publicationStatus` on low-trust rows where progression genres were stripped. Example actions:
- `cmtdgrieh00rp3d452mq7afpi` **Turtles All the Way Down** — remove Cultivation genre; clear `publicationStatus`
- `cmtdgrinf00wk3d45439ltcjl` **Catch-22** — remove Cultivation genre
- `cmtdgrhu200gv3d45lp7n109w` **Destroy Me** — remove Cultivation genre
- `cmtdgriei00s23d45mierbkn2` **The Woman Who Rides Like a Man** — remove Cultivation genre

**Runtime eligibility already prevents false Moonie/Search matches without `--apply`**; persisted repair is still needed for catalogue accuracy outside Moonie constraint paths.

**Do not apply without explicit approval.** Rollback: re-connect removed genre relations and restore `publicationStatus` from dry-run JSON evidence.

### Handoff package (read-only)

ZIP: `/Applications/moonverse /docs/handoff/metadata-repair-2026-08-30-handoff.zip`

Contains full 242-record `metadata-repair-dry-run-rollback.json` (before/after + rollback), `public-metadata-export.jsonl`, `DATA_PROVENANCE.md`, and script snapshots. Regenerate via `scripts/export-metadata-repair-handoff.ts`.

**Serial flaky-test rerun (isolated):** `routes the card more-like-this…` and `repeating more-like-this…` each **PASS**, exit **0** when run alone; failures in full suite are parallel Prisma `Engine is not yet connected` flakes.


### User verification / browser — **NOT MEASURED**

- Owner session (`luffy`) cultivation recommendation cards after repair
- Plural review reference UI (`cmtg16a0i00093dd3du7z7agw`)
- Cultivation Chat Group confirmation → review cards → reopen/refresh (`cmtg1yx9t000f3d1k5qp3rj24`)
- `npm run build` (dev server on `:3000` — not interrupted)

---

## Aug 30 acceptance pass — Search/Moonie eligibility alignment (appended)

**Scope:** Bounded acceptance after demo-fixture migration. No reseed, `--apply`, commit, push, or quota reset.

### Confirmed defects fixed

| Defect | Fix |
|--------|-----|
| Moonie `countNovelsMatchingPreferences` counted low-trust RNG `Completed` while runtime hard constraints null it | `prismaConstraintEligibleCompletedStatus` / `Ongoing` in `metadata-eligibility.ts`; wired into `hybrid-retrieval.service.ts` `hardFilters` |
| Search cultivation facet showed sprayed literary rows (e.g. Shanna) | Post-filter progression genre facets via `novelMatchesSearchGenreFacet` in `search.service.ts` |
| Integration tests seeded “completed slice-of-life” against demo DB where low-trust status is ineligible | `demo-acceptance-fixtures.ts` documents fixtures; integration seeds use `MOONIE_SLICE_OF_LIFE_SEED_MESSAGE` / `MOONIE_INTEGRATION_SEED_MESSAGE` |

### New regressions

- `src/services/search-moonie-eligibility.test.ts` — literary vs curated xianxia eligibility + live Search cultivation facet
- `src/lib/moonie/demo-acceptance-fixtures.ts` — documented constraint fixtures
- Updated `moonie-recommendation-path.test.ts` for catalogue-scale unseen batches

### Automated verification (this pass)

| Check | Result | Exit |
|-------|--------|------|
| `npm run typecheck` | **PASS** | 0 |
| `npm run lint` | **PASS** (3 warnings, pre-existing) | 0 |
| `npm test` (full suite) | **303/304 pass** | 1 (parallel Prisma flake) |
| `npm test` (isolated `moonie-recommendation-path.test.ts`) | **8/8 pass** | 0 |
| `npm test` (isolated `search-moonie-eligibility.test.ts`) | **3/3 pass** | 0 |
| `git diff --check` | **PASS** | 0 |
| `npm run build` | **NOT RUN** (dev server active on `:3000`) | — |

**Full-suite flake (not PASS):** `keeps slice-of-life through retrieval and explanations on demo catalogue` fails under parallel load with `PrismaClientUnknownRequestError: Engine is not yet connected` in `buildCommunityInsight`. **Isolated rerun: PASS** (exit 0).

### Live DB repair — still **PENDING APPROVAL**

Dry-run plan unchanged (~1000 low-trust candidates). Runtime eligibility + Search facet filtering already block false cultivation/completed matches. Persisted repair still needed for catalogue display outside constraint paths.

### Browser — **NOT RUN**

Dev server running (`npm run dev` on `:3000`). Owner-session (`luffy`) UI checks for cultivation cards, plural reviews, confirmation→reviews loop, and reopen/refresh were **not performed** in this pass (no automated owner login; quota/auth not bypassed).

### Submission-critical blocker

**Smallest next action:** Owner-session browser smoke on Moonie cultivation query + plural review reference + confirmation loop; then approve or reject `scripts/repair-contaminated-catalogue-metadata.ts --apply` for persisted catalogue cleanup.

---

## Aug 30 — review interaction UI/auth repair (appended)

**Scope:** Bounded fixes for guest access, community overlay, nested Save → Create folder, and detail layout stretch. No metadata repair, dataset changes, commit, or push.

### Confirmed causes fixed

| Regression | Cause | Fix |
|------------|-------|-----|
| Guest Continue reading / Comment showed full review in overlay | `LiteraryReviewCard` opened overlay without auth; modal used `forceExpanded` for all users | Guest handlers prompt sign-in with `/reviews/:id` (+ `#comments`); overlay/detail/API cap body via `guestReviewPreviewBody` |
| Create folder unusable inside review overlay | `FolderFormDialog` at `z-50` rendered behind `CommunityReviewModal` (`z-[80]`); Escape on overlay closed parent first | `NESTED_DIALOG_Z_CLASS` (`z-[100]`) on folder + sign-in dialogs; overlay Escape defers when nested dialog present; focus returns to Save on close |
| Stretched review-detail columns | `lg:items-stretch` + `flex-1`/`lg:h-full` forced aside to match article height | `lg:items-start`; removed height-stretch classes on detail grid |
| `#comments` deep link on detail page | `subscribeDiscussionHash` was a no-op | Subscribes to `hashchange` |

### Automated verification

| Check | Result | Exit |
|-------|--------|------|
| `npm run typecheck` | **PASS** | 0 |
| `npm run lint` | **PASS** (3 warnings, pre-existing) | 0 |
| `npm test` (full suite, 309 tests) | **308/309 pass** | 1 (Prisma flake in Moonie routing test) |
| `review-interaction.test.ts` + `review-dialog-layering.test.ts` | **PASS** | 0 |
| `git diff --check` | **PASS** | 0 |

**Isolated flake (not PASS):** `resolves reviews of these novels from the latest recommendation batch` — intermittent Prisma `Engine is not yet connected` under parallel load.

### Browser — **NOT RUN**

Dev server on `:3000`. Guest sign-in prompt, overlay Continue reading/Comment, nested Create folder, and signed-in action consistency were **not** manually verified in this pass (no automated guest session).

### Smallest next action

Manual browser pass: guest `/community` → Continue reading + Comment (sign-in prompt, no full body); signed-in overlay → Save → Create new folder; confirm Like/Save counts match feed vs overlay vs detail URL.

---

## Aug 30 — guest Moonie quota + preference routing repair (appended)

**Scope:** Screenshot-confirmed `/ask-moonie` guest quota mismatch and recommendation-starter misrouting. Continues review/auth/dialog repairs; no quota resets, metadata repair, commits, or pushes.

### Confirmed causes fixed

| Regression | Cause | Fix |
|------------|-------|-----|
| Guest transcript showed “30 / 30 discovery requests used today” | `rate_limit` assistant messages rendered `MoonieRateLimit` with member `quotaRemaining` (undefined → 30/30 default) | `MoonieGuestRateLimit` + guest copy in `quota-copy.ts`; render branches on `quotaAudience` / `isGuestDemo` in `MoonieAssistantView` and `MoonieMessageList` |
| Badge/footer agreed on exhaustion but transcript used member wording | Header/footer used guest state; transcript card used shared member component | Guest limit card now shows `used/cap free turns used` + signup CTAs; no daily-reset copy |
| `"A completed slow-burn romance with a clever heroine."` → title verify error | `isBareCatalogueTitleQuery` treated taste sentence as catalogue title | `isCataloguePreferenceDescription()` excludes taste/preference starters (incl. `MOONIE_QUICK_PROMPTS`) from bare-title lookup; routes to `RECOMMEND` |
| Exhausted guest could run chargeable work before 429 | Guest quota checked after `handleMoonieRequest` | Pre-check via `moonieRequestLikelyConsumesQuota` before pipeline when cookie exhausted |
| `?prompt=` auto-submit before quota loaded | Initial `guestTurnsRemaining` assumed cap; auto-submit did not wait | Start at `null`; block submit/auto-submit until quota fetch resolves; block when `null` or `<= 0` |

### Automated verification

| Check | Result | Exit |
|-------|--------|------|
| `npm run typecheck` | **PASS** | 0 |
| `npm run lint` | **PASS** (3 warnings, pre-existing) | 0 |
| `guest-quota-display.test.ts` + `intent-correctness.test.ts` | **21/21 pass** | 0 |
| `git diff --check` | **PASS** | 0 |

### Browser — **PARTIAL / NOT RUN for guest**

Dev server on `:3000`. Browser session was **signed in** (`pansaru`); `/ask-moonie` redirects to `/moonie`. Guest `/ask-moonie` quota UI, floating widget, and `?prompt=` deep links were **not** manually verified without a guest session.

Signed-in `/moonie` desk loads for owner session (composer + sidebar visible).

### Server vs UI enforcement

- **UI:** Guest rate-limit cards, badge, and footer now use guest allowance copy; member cards unchanged.
- **Server:** Guest 429 returns `buildGuestRateLimitApiError()` + `guestTurnsRemaining: 0`; chargeable requests blocked before pipeline when cookie exhausted (conservative intent pre-check).
- **Untested:** Live guest turns 1–3 progression without resetting cookies; login/logout mid-flight with concurrent requests; floating guest widget limit card.

### Smallest next action

Guest browser pass on `/ask-moonie` (exhausted + turns remaining), `?prompt=` with slow-burn starter when quota permits, then review interaction browser pass from prior repair.

---

## Aug 30 — review preview + overlay interaction sync (appended)

**Scope:** Signed-in collapsed preview on `/reviews/:id`; overlay must reflect feed like/save state.

### Confirmed causes fixed

| Regression | Cause | Fix |
|------------|-------|-----|
| Signed-in detail showed full body on outer card | `forceExpanded={isLoggedIn}` on `ReviewDetailBodyPanel` | Collapsed preview + `Continue reading` opens community overlay; inner modal still `forceExpanded` |
| Overlay stale after feed like/save | Prefetch cache + no `liked` sync in modal | Cache invalidation + client-state patches merged into modal load |
| Feed bar lost liked state on sync | Only counts synced, not `liked` | `likedByMe` tracked in feed, detail host, and modal |

### Automated verification

| Check | Result |
|-------|--------|
| `typecheck` | **PASS** |
| `lint` | **PASS** (3 pre-existing warnings) |
| `review-interaction.test.ts` | **3/3 pass** |

### Browser — **NOT RUN**

Signed-in Continue reading on `/reviews/:id` and feed → overlay interaction parity were **not** manually verified.

---

## Aug 30 — folder save counts, share URL, logo tagline (appended)

### Folder save / create

| Issue | Cause | Fix |
|-------|-------|-----|
| Overlay Saved 3 vs feed Saved 2 | `handleCreateFolder` auto-added review + optimistic/client save math treated first folder only; sync omitted `saveCount` | Create folder no longer adds review; membership-delta optimism; `saveCount` always published on sync |
| Implicit save on "Create folder" | `addReviewToFolderAction` called after every folder create | Removed; menu reopens for explicit checkbox save |

**`saveCount` metric:** total `FolderReview` memberships (documented in `src/lib/review-share.ts`).

### Share

- `buildReviewSharePayload` puts absolute `/reviews/{id}` URL in both `url` and `text` fields.
- Share count only after successful share/copy (not on AbortError).
- Telegram delivery: **NOT VERIFIED**.

### Logo tagline

- Light nav: tagline `#4c2a67` (plum), hover `#6e46c7`.
- Inverse/dark: light gold tint retained for contrast.

### Automated

| Check | Result |
|-------|--------|
| `typecheck` | **PASS** |
| `lint` | **PASS** (pre-existing warnings) |
| `review-share.test.ts` + `review-interaction.test.ts` | **6/6 pass** |

### Browser — **NOT RUN**

Folder create → explicit save → overlay/feed count parity on both Community and detail paths was **not** manually verified.

### Outer preview flash on refresh (appended)

**Cause:** `ReviewStructuredBody` initialized `overflowing` to `false`; `max-height` clip applied only after `useLayoutEffect` measurement, so SSR and first client paint rendered the full body.

**Fix:** `reviewBodyNeedsPreviewClamp()` sync heuristic initializes `overflowing` on server and first client frame for long bodies (`src/lib/review-body.ts`, `ReviewStructuredBody.tsx`).

**Browser (loading transition):**
- Signed-in SSR HTML includes `max-height:260px` on outer preview container (fetch with session).
- Guest SSR HTML includes `max-height:180px`.
- Settled signed-in page: `clientHeight` 260, gradient + Continue reading visible.
- Hard-refresh frame-by-frame capture: **not automated**; SSR + settled state consistent with collapsed first paint.

### Review-detail desktop equal-height columns (appended)

**Change:** `lg:items-stretch` grid + flex column chain in `ReviewDetailView` / `ReviewRelatedInfoAside`; middle section (`Community pulse` + `Reading sources`) uses `lg:flex-1` with equal-height flex children at `xl`.

**Browser (1400px):** left/right column heights 585px; `Open novel page` bottom aligned with review card; insight cards both 400px; preview still `max-height:260px`.

**Mobile (390px):** single-column stack, natural heights (705 vs 781px), no forced equal height.

---

## Aug 31 — guest landing page covers, genre previews, hero fit (appended)

### Issue 1 — Missing book covers

| Title | DB `coverUrl` | Root cause | Fix / status |
|-------|---------------|------------|--------------|
| Lord of the Mysteries | `null` | Curated Wikimedia URL was **404** (`Lord_of_Mysteries_web_serial_cover.jpg`) | Fixed to working print-cover URL in `CURATED_COVERS`; loads (`naturalWidth` 250) |
| The Three-Body Problem | `null` | No DB cover; not in curated map | Added Open Library URL; loads after lazy scroll (`naturalWidth` 36 thumbnail) |
| Sovereign of the Three Realms | `null` | Resolved via Wuxiaworld curated map | Already working |
| Dungeon Crawler Carl, LitRPG doors | `null` | Genre picker filtered on raw DB URL only | Fixed + Wikipedia OL entries in curated map |
| **Necropolis** | `null` | Royal Road `og:image` is `nocover-new-min.png`; no verified alternate | **Missing source data** — branded placeholder correct |
| **The Butcher of Gadobhra** | `null` | Same RR nocover | **Missing source data** — branded placeholder correct |

**Code fixes:** `landingNovelDisplayCover()` uses `resolveCoverUrl()` for genre-door art selection (was checking raw `novel.coverUrl` only). Expanded verified entries in `prisma/lib/open-library-covers.ts`.

### Issue 2 — Browse-by-genre previews (landing `#doorways`)

| Genre | Titles | Covers after fix |
|-------|--------|------------------|
| Xianxia | 65 | 4 (Martial World, Wu Dong Qian Kun, …) |
| Comedy | 59 | 2 (A Will Eternal, Beware of Chicken) |
| Action | 31 | **0** — eligible pool has no resolvable art (King's Avatar, Magical Girl Maniac) |
| LitRPG | 39 | 4 (Dungeon Crawler Carl, Azarinth Healer, …) |
| Sci-fi | 135 | 4 (The Three-Body Problem, …) |

`loadLandingDoorNovels` now orders by review count and takes 48 candidates. Destroy Me on Cultivation door: eligible via `readingLinks` + `cultivation` genre tag (not a bypass).

### Issue 3 — Hero laptop viewport fit

Reduced `.mv-land` padding, headline/CTA spacing, Moonie size (228→188), cover fan scale in `LandingHero.tsx`.

| Viewport | Hero bottom | Fits without scroll |
|----------|-------------|---------------------|
| 1366×768 | ~614px | **Yes** (`#doorways` not visible) |
| 1440×900 | verified | **Yes** |

### Automated

| Check | Result |
|-------|--------|
| `typecheck` | **PASS** |
| `lint` | **PASS** (pre-existing warnings) |
| `git diff --check` | **PASS** |
| `landing-covers.test.ts` + `discovery.service.test.ts` + related | **18/18 pass** |

### Browser

Guest `/ ?public=1`: Lord of the Mysteries, Lord of the Mysteries shelf rail, genre doors (xianxia/litrpg/sci-fi), Three-Body lazy load verified. Necropolis/Butcher remain placeholders (data gap). Action door still empty (no verified covers in eligible pool).

**Not run:** true guest logout session (used `?public=1` with signed-in browser); hard refresh frame capture; mobile hero scroll behavior.

---

## Aug 31 (follow-up) — hero viewport fill + Action genre previews

### Hero fills initial laptop viewport (not merely fits inside)

- Added `mv-land-hero-fill` on `#night`: `lg:min-h-[calc(100dvh-var(--mv-nav-h))]` with flex column + `justify-center` on shell.
- Navbar spacer (`--mv-nav-h`) + hero min-height = one full viewport; next section starts below the fold.

| Viewport | Hero bottom | Shelves top | Peek |
|----------|-------------|-------------|------|
| 1366×768 | 768 | 768 | **0px** |
| 1440×900 | 900 | 900 | **0px** |
| Mobile 390×844 | natural (`min-height: 0`) | — | grows with content |

### Action genre door previews

- Root cause: `pickLandingDoorCovers` dropped eligible Action titles when cover art was missing (`withArt` filter).
- Fix: `src/lib/landing-door-covers.ts` — eligibility separate from cover availability; placeholders via `CoverImage` when resolved URL is empty.
- Genre door cover stacks link to `/novels/:id`.
- Live `getLandingGenreDoors()`: Action shows King's Avatar, Magical Girl Maniac, A Step into the Past, Joy of Life (31 titles count unchanged — full genre catalogue).

### Automated

| Check | Result |
|-------|--------|
| `typecheck` | **PASS** |
| `lint` | **PASS** (pre-existing warnings) |
| `git diff --check` | **PASS** |
| `landing-door-covers.test.ts` + related | **13/13 pass** |

---

## Aug 31 — Moonie + Search reliability pass

### 1. Completed recommendations returning no results

**Exact query:** `Show me completed found family or slice-of-life novels`

| Check | Result |
|-------|--------|
| Parsed prefs | tags `found family`, `slice-of-life`; status `completed`; genres `[]` |
| Hard constraints | same tags; `inclusionMatch: "any"`; status `completed` |
| Intended logic | completed AND (found-family OR slice-of-life) — **confirmed, not AND-both** |
| Raw `publicationStatus` contains `complet` | **336** |
| Constraint-eligible completed | **0** |
| Low-trust `seed-catalog` completed | **336** (100% of raw completed) |
| Trusted / null-source completed | **0** |
| Combined eligible count | **0** |
| `Recommend completed novels` eligible count | **0** |

**Cause:** not a query mismatch and not unseen-filter exhaustion. Every live Completed row is `metadataSource: seed-catalog`. Earlier eligibility correctly treats that generated status as unknown, so hard `completed` matches nothing.

**Fix:** keep eligibility unchanged. Empty-state copy now distinguishes unverified generated status from catalogue absence / unseen exhaustion (`buildHardConstraintUnknownStatusCopy`). Persisted-status repair still requires a separate approved plan.

Positive/negative fixtures remain in `hard-constraints.test.ts` and `demo-acceptance-fixtures.ts` (eligible completed, ongoing, unknown/low-trust, either theme, unrelated).

### 2. “Finding matches” in unrelated chats

**Cause:** `isLoading` was a single hook flag. Sidebar/guest/widget switches did not scope it to the originating conversation. `startNewConversation` for guests/widget also failed to abandon the in-flight request.

**Fix:** `src/lib/moonie/pending-request.ts` + `use-moonie-chat.ts`

- Pending request stores `requestId` + originating `conversationId`.
- Loading is visible only when the active conversation owns that pending request.
- Late apply is refused for conversation B, New chat, and mismatched request IDs.
- New chat / widget clear abandons the in-flight client apply (server persist + quota already recorded; no second charge).
- Sidebar switch does **not** abandon: returning to A can still receive the late apply; otherwise A hydrates from persisted turns.

### 3. Latency (samples, not percentiles)

`disableSemantic` grounded path, n=2 unless noted. Prisma engine flake on a later fantasy community-insight aggregate aborted the remaining script.

| Path | Cold ms | Warm ms | Notes |
|------|---------|---------|-------|
| Grounded `Recommend completed novels` | 142 | 78 | 0 cards; unknown-status copy |
| Grounded combined OR query | 112 | 177 | 0 cards; unknown-status copy |
| Grounded `Recommend fantasy novels` | 438 | — | 5 cards; script then hit pre-existing `Engine is not yet connected` |

**Optimisations applied:** lexical retrieval in parallel with the candidate pool; review averages via `groupBy` instead of loading every OK review; one batched reading-link query instead of per-card `findMany`. Community insight stays serial to avoid the Prisma parallel-aggregate flake. Optional OpenAI polish is unchanged.

Client submit→visible loading, auth/quota HTTP, and browser render timings: **NOT MEASURED** (no quota-consuming desk submit).

### 4. Search alignment

- Search has **no completion-status facet**. `q=completed` is text, not a verified status filter.
- Tag filters `found-family` and `slice-of-life` are independent (not AND-both). Genre/tag/totals/pagination coverage extended in `search-acceptance.test.ts`.

### 5. Search-to-Moonie buttons

**Not added.** Search results (`/search`) have no query/filter/novel-ID handoff control. Observed: result Peek/Open links + global floating Moonie widget (empty chat, query not preserved). Browse mood chips still use `moonieEntryHref`. No stub or comment in Search components indicates a recent accidental deletion of a result-level handoff. Treat as **absent entry point**, not restored in this batch.

Any later handoff must pass the query/filters or selected novel ID, honour guest `/ask-moonie` vs member `/moonie`, and must not auto-submit or consume quota.

### Verification

| Check | Result |
|-------|--------|
| `npm test` | **345/345 PASS**, exit 0, ~101s |
| `npm run typecheck` | **PASS** |
| `npm run lint` | **PASS** (4 pre-existing warnings) |
| `git diff --check` | **PASS** |
| Focused Moonie/Search tests | **65/65 PASS** |
| Browser `/moonie` (`pansaru`) | Desk loads; empty history; **no submit** (quota not consumed) |
| Browser `/search?q=fantasy&type=works` | Works results + widget; no result-level Moonie handoff |

**User verification still required:** A→B / A→New chat / return-to-A while a request is in flight; guest 3-turn vs member 30/day live submits; lookup/replay/review follow-ups in an authorised session with remaining quota.

**Blocked:** quota-consuming Moonie submits in this pass.

**Unmeasured:** client loading paint; HTTP auth/quota; OpenAI-enabled path; production build (dev server left running).

---

## Aug 31 — Review routing, relaxation continuity, empty-reason, navigation latency

**Condition:** Local `next dev --webpack` on `:3000`. Timings below were taken **without a concurrent full-suite run**. Webpack compile of a newly edited route inflates the first hit; those samples are labelled compile, not product latency. Production was **not** compared (dev server left running; no coordinated stop).

### Code-fixed

| Item | What changed | Tests |
|------|----------------|-------|
| Review / ranking routing | Exact phrases resolve entity + metric **before** recommendation. `give me top 5 reviews` / `give me top 5 novel reviews` → ranking-basis clarification (`count=5`), then public reviews (reviewer, novel, `/reviews/:id`, spoiler sanitization). `what novel has the most reviews` → `review.groupBy` over the authorised public catalogue (`moderationStatus !== HIDDEN`). `among these` is the only silent scope restrictor. Highest-rated **novels** stay novel cards. | `catalogue-task.test.ts`; `moonie-catalogue-routing.test.ts` (exact phrases, with/without prior recs; asserts `responseKind`, IDs, `rankingMetric`, `requestedCount`) |
| Constraint-relaxation continuity | “Same request, but drop the strictest constraint.” persists current hard constraints. Bare `romance` in that pending context is a genre answer (or a change-genre vs drop-completion clarify), never a title lookup. | `moonie-relaxation-continuity.test.ts` (full multi-turn) |
| Unknown-status UI | `emptyReason` on the response; reply, panel, and actions share `moonieNoMatchCopy`. Hydration persists the reason so reopen does not rewrite historical rows. | `persist-assistant-turn.test.ts`; `moonie-history-hydration.test.ts` |
| Navbar / layout latency | AppShell loads unread **count** only. Navbar polls `getNotificationUnreadCountAction` (not pathname-triggered). Full bell snapshot only on open. | Browser: 5 unread badge still present; no 20-item snapshot on each nav |
| Moonie return blank | History load moved **inside** Suspense. New chat (`?new=1`) skips restore copy. Returning to an existing conversation can show “Restoring this conversation…” instead of a blank transcript. | `pansaru` empty desk: greeting / `?new=1`; restore path not owner-verified |
| Community TTFB | `getTasteInsightSnapshot` now runs in the same `Promise.all` as desk/enrichment. `src/app/community/loading.tsx` streams honest “Loading the community feed…” | Warm TTFB 271ms (n=1) vs prior 1020ms |
| Parallel Prisma flake | `buildBatchNovelReviewsResponse` loads novel bundles **serially** (same workaround as pipeline community insight). | Full suite then isolated that test; see verification |

Demo-status **plan only** (not applied): [`docs/handoff/demo-status-verification-plan-2026-08-31.md`](handoff/demo-status-verification-plan-2026-08-31.md). Field `publicationStatus` only; exact clear/confirm/must-not IDs; +/− cases; rollback from the 2026-08-30 JSONL. No `--apply`, no bulk repair, no seed trust.

No Search-to-Moonie buttons. No reseed, quota reset, commit, or push.

### Browser-verified (`pansaru` on `:3000`; **not** `@dada`)

| Flow | Sample | TTFB | DCL | Load | Notes |
|------|--------|------|-----|------|-------|
| Community first after `loading.tsx` edit | 1 | 6960ms | 8325 | 8516 | Webpack compile of `/community` |
| Community warm | 1 | 271ms | 1451 | 1481 | Feed usable after DCL; earlier 1020ms TTFB was pre-streaming |
| Discover warm | 1 | 124ms | 307 | 856 | Second warm this session (prior warm 261ms) |
| Discover (earlier pass) | 1 | 209ms | 425 | 1032 | Before this edit |
| Moonie first after desk-page edit (earlier) | 1 | 8339ms | 8404 | 9255 | Compile `/moonie` |
| Moonie warm (earlier) | 1 | 98ms | 221 | 723 | Empty history |
| Moonie return after novel (earlier) | 1 | 197ms | 238 | 790 | `?new=1`; not a history restore |
| Moonie this pass | 1 | 243ms | 277 | 838 | Greeting desk; `Restoring…` **not** shown (correct for empty/`?new=1`) |
| Novel LOTM (earlier) | 1 | 4914ms | 5034 | 5583 | Compile-inflated; not re-timed |
| Search `q=fantasy` (earlier) | 1 | 247ms | 350 | 3129 | Results + review hits present |
| Search toggle (this pass) | 1 | — | — | — | Click-to-panel: navbar search expanded immediately (client); no network |

Navbar tabs (Community → Discover → Moonie) stay interactive. Search results still open works/reviews. Recents for `pansaru`: “No chats here yet.”

These are **end-to-end Navigation Timing** (`responseStart − requestStart` = TTFB). They are **not** service-only handler times. Service-only grounded path from the earlier Aug 31 note (n=2): completed unknown-status ~78–177ms; fantasy recommend 438ms cold then Prisma abort.

### Pending-data-approval

- Completed / unknown-status **data** gap unchanged. Eligibility still refuses `seed-catalog` status. Plan is reviewable; **do not apply** without approval.
- Screenshot phrases were **not** submitted as `@dada` in conversation `cmtgjd4ep006x3d7jujahc0be`. Browser session is `pansaru` (empty Recents). Quota was **not** reset or consumed for live desk submits.

### Unmeasured / blocked

| Item | Why |
|------|-----|
| `@dada` live phrases + multi-turn Completed → drop constraint → `romance` in the recorded conversation | Wrong browser identity; no quota bypass |
| Recents conversation switching | `pansaru` has no saved chats |
| Click-to-feedback instrumentation for tab navigations | URL Navigation Timing only; search **toggle** observed as immediate |
| Moonie history restore vs new generation in an owned thread | Empty desk; restore fallback code not owner-UI verified |
| Widget vs desk isolation this turn | Not re-checked |
| Production / `next start` | Would require a coordinated stop of `:3000` |
| Percentiles / n>2 | Samples are n=1 unless noted |
| OpenAI-enabled path | Not run |

### Verification

| Check | Result |
|-------|--------|
| Targeted routing / continuity / hydration | **57/57 PASS**, ~28s (first isolated batch) |
| `npm test` (first full run this turn) | **359/360**, exit 1, ~123s. Fail: `resolves reviews of these novels from the latest recommendation batch` — `PrismaClientUnknownRequestError: Engine is not yet connected` in `db.review.aggregate` (`moonie-novel-lookup.service.ts`). Same fail on isolated file rerun. |
| After serial batch-review bundles | Isolated test **PASS**. Second `npm test`: **360/360 PASS**, exit 0, ~108s |
| `npx tsc --noEmit` | **PASS** |
| eslint on touched files | **PASS** (pre-existing unused-var warning in `conversation-context-replay.test.ts` when that file is included) |
| `git diff --check` | **PASS** |
| `npm run build` | **NOT RUN** (dev server on `:3000`) |

**Do not treat the earlier 345-test count as this batch.** Isolated passes did not replace the first full-suite fail; the second full suite is the current recorded result after the serial-bundle change.

---

## Aug 31 — recording repair pass (4m45s / @dada observations)

**Constraint:** Existing `:3000` webpack server kept. No reseed, metadata `--apply`, quota reset, commit, or push. Browser session was **`pansaru`**, not `@dada`. Fixture results are separate from browser.

### Per-issue status

| Issue | Confirmed | Fixed | Verified | Pending |
|-------|-----------|-------|----------|---------|
| P0 NotificationDropdown render-phase Server Action | Yes — `onOpen` must not run inside `setOpen` updater | Yes — `resolveBellOpenToggle` then `setOpen(next)` then `onOpen?.()` | **Partial.** Unit tests (bell-preview / dropdown wiring). Browser: bell opened for `pansaru` (Mark all / See all). No `@dada` console capture this pass | `@dada` console / ChunkLoadError not re-logged |
| 1. Starter routing (“Find a novel” / “Where can I read it?”) | Yes — catalogue-scope leftover treated as title; pronoun reading-link searched the full question | Yes — generic discovery → `RECOMMEND`; post-normalize title reject; bare reading-link asks which novel unless target is unambiguous | **Fixture:** exact widget payloads + typed equivalents. **Browser (desk, `pansaru`):** Find-a-novel → recommendations in 3.6s, no `couldn't verify "…catalogue"`; Where-to-read after 5 cards → “Which novel…”, no Crimson Ember / Luminous Covenant | Widget **chip click** (overlay intercept / chips hidden on existing thread). `@dada` widget on `/home` |
| 2. Compare substitution + no-results panel | Yes — `candidates[0]` fallback; `state: no_results` on missing titles; cards used raw seed status | Yes — per-title resolve + alignment gate; clarification is not `no_results`; compare cards inherit eligible status only | **Fixture:** starter has `state !== no_results`; suggested compare IDs `cmtdgrhdb006x3d4576i42373` (Lord of the Mysteries) + `cmtdgrhbu00653d45py9jr8ts` (Reverend Insanity); no Locke Lamora; row/card status both `null` (low-trust). **Browser desk** `cmtglze49003l3dm4z0gctf2h`: same titles; second turn + reopen: latest cards omit Hiatus/Ongoing | First persist in that thread still shows Hiatus/Ongoing on **old** cards. Recorded thread `cmtgkultz001h3dm4szfh39vd` not reopened (`pansaru` ≠ owner) |
| 3. Library Continue reading repeats | Yes — rail is novels; `folderReview` join returned multiple reviews of the same `novelId` | Yes — `uniqueContinueReadingByNovelId` display dedupe; memberships / `saveCount` unchanged | **Fixture** only | `@dada` `/folders` Number of the Beast. `pansaru` library empty |
| 4. Loading / white flashes | Yes — `loading.tsx` + Moonie fallback used large standalone copy; AppShell was `bg-white` | Yes — compact/sr-only loaders; literary / `#1A1224` destinations; AppClientChrome dynamic import kept | **Browser filmstrip (Home→Community click):** body stayed `rgb(250, 248, 255)` (~166ms to `/community`); “Loading the community feed” **sr-only only**; `visibleLoading: []`. Navbar persisted. Discover + Search settled with navbar. Moonie restore of `cmtglze49003l3dm4z0gctf2h` showed comparison, not a white “Restoring…” page. Back: `/search` → `/discover` | Hard-refresh compile vs warm not re-timed as n>1. Widget blank/restore race not separately instrumented |

### Automated checks (this pass)

| Check | Result |
|-------|--------|
| Isolated starter/compare/loading/bell | **52/52 PASS** (~35s), then compare retest **9/9 PASS** after card-status patch |
| `npm test` | **386/386 PASS**, exit **0** (~103s) twice (before and after compare-card status patch) |
| `npm run lint` | Exit **0** — 0 errors, 4 pre-existing warnings |
| `npm run typecheck` | Exit **0** |
| `git diff --check` | Exit **0** |
| `npm run build` | **NOT RUN** (dev server pid ~7241 on `:3000`) |

### Browser notes (`pansaru` on `:3000`)

- Find-a-novel desk typed payload used **one** discovery quota turn; compare clarification did not show the empty-criteria panel.
- Widget auto-opened an existing For You prompt on `/home` (not a starter chip). Chip buttons were not visible on a non-empty widget.
- Loading improvement is **visual** (no oversized white intermediate copy). Request latency was not reduced by removing truthful pending states.

---

## Aug 31 — compare continuation + screenshot inconsistencies (bounded)

**Constraint:** Fixtures first. `@dada` remaining discovery quota recorded as **0/30**. No quota reset, account switch, metadata `--apply`, history rewrite, commit, or push. Existing `:3000` server left running.

### User-observed output evidence (not proof of link clicks or refresh)

These owner screenshots are **visible assistant output** only. They do **not** prove reading-link clicks, conversation reopen, or widget refresh.

| Observed output | What it shows | What it does not prove |
|-----------------|---------------|------------------------|
| Explicit `Compare The road to forever and Cultivation Chat Group` resolves both titles | Working COMPARE prefix path | Reopen / refresh / widget chip click |
| Suggested LoTM vs Reverend Insanity comparison cards | Working suggested-compare path (IDs `cmtdgrhdb006x3d4576i42373`, `cmtdgrhbu00653d45py9jr8ts`) | Link clicks |
| The road to forever reading-link card shows **Ongoing**; comparison shows **unknown / Not listed** | Same-title status inconsistency on newly generated payloads | That the rows are different novels without an ID check |
| Generic discovery card copy: “Similar to a novel you asked for more like.” | Misleading explanation risk if no current more-like seed | That personalisation ranking was wrong |

### Repair recorded this pass

- Pending `compare_titles` is stored on the compare-ask turn and consumed before bare-title `FIND_NOVEL`. Title-only “The Road to forever and cultivation chat gp” must resolve two catalogue IDs.
- “And” splits are scored against the unsplit phrase so genuine titles are not discarded; one resolved target is kept and the other is clarified.
- Newly generated reading-link and compare payloads use `constraintEligiblePublicationStatus`.
- “Similar to a novel you asked for more like” is cited only when the current request has `similarToNovelId`. Historical `MORE_LIKE_THIS` feedback still ranks.
- Compare panel → card group uses `MOONIE_COMPARE_ATTACHMENT_STACK` (`gap-4` / 16px) on desk and widget.

### Unresolved checklist (unchanged unless separately verified)

- **CoverCarousel hydration** — still unresolved; not re-verified this pass.
- `@dada` live desk/widget clicks — blocked (0/30 remaining; no bypass).
- Browser reopen / mobile compare spacing — report after fixture run.

---

## Aug 31 — nav click latency vs Moonie continuity (not a loading-copy pass)

**Constraint:** Existing `:3000` webpack server (pid 7241) kept. No reseed, metadata `--apply`, quota reset/bypass, production build, commit, or push. Browser session **`pansaru`**. Full `npm test` was run **after** latency samples, not concurrently.

### Diagnosed causes (before this pass)

| Failure | Evidence | Not the cause |
|---------|----------|----------------|
| Navbar Browse/Search feel dead | `Navbar`/`NavInlineSearch` used `useSearchParams`, so AppChrome `<Suspense fallback={null}>` hid the bar. Search fallback was `readOnly`/`tabIndex=-1`. Browse hover had a 70ms open delay. | Destination TTFB / catalogue query time |
| White / purple blank after nav starts | Missing `browse/loading.tsx`; Moonie `loading.tsx` used `h-full min-h-0` and collapsed inside AppChrome’s purple slot (`#1A1224`) | Background colour alone |
| Answer-completion purple flash | Next.js 16 patches `history.replaceState` and dispatches `ACTION_RESTORE` unless state has `__NA`. `router.replace` / unpatched `replaceState` remounted `page.tsx` through `moonie/loading.tsx`. Desk lived in the page, not the layout. | Thinking-bubble CSS |
| Generic full-desk buttons resume latest | Bare `/moonie` and `shouldRestoreLatestMoonieConversation` loaded latest. Navbar Ask Moonie was `/moonie`. | Quota / guest routing |

### Latency fixes (click → first visible feedback)

These do **not** make `/browse` or `/search?q=` data fetches faster.

- Search field is a live input immediately (`readOnly: false`, `tabIndex: 0`). `NavInlineSearch` no longer uses `useSearchParams` (cannot hide the navbar).
- Browse trigger opens the dropdown immediately; “Open full catalogue” is the `/browse` navigation. Prefetch `/browse` when the menu opens.
- `AppShell` still does **not** await a full bell list on navigation (unread stays `0` + existing poll).
- Signed-in `openMoonie` fallback goes to `/moonie?new=1` (no `/ask-moonie` hop).

**Warm samples (`pansaru`, already-compiled `:3000`, n=3):**

| Action | First visible feedback | Notes |
|--------|------------------------|--------|
| Browse dropdown open | **31.2 / 33.3 / 36.7 ms** to `aria-expanded=true` + `[role=menu]` | Distinct from `/browse` |
| Search focus | **1.4 / 0.3 / 0.4 ms**; not read-only | Suggests (`Culpa Tuya`, `Culpa mía`) appeared on type, before results page |
| Search submit | Suggestion click reached `/search?q=culpa` with navbar + “culpa” results | Automation Enter on the open listbox did **not** navigate; click-to-submit did. Honest: Enter-from-automation unmeasured for users |
| Browse destination | Settled catalogue (“Open the stacks”) + navbar; `bodyBg rgb(250, 248, 255)` | Client-nav filmstrip of the in-flight loading shell was **not** captured at 32ms (Next `Link.click()` is not trusted). Two additional warm `browser_navigate` samples settled with the same catalogue shell |

**Cold (hard-refresh) samples:** **NOT MEASURED.**

### Visual continuity fixes (destination shell, not a fade)

- Desk lives in `src/app/moonie/layout.tsx` (`MoonieDeskRoute`). Conversation-ID URL updates remount only the hidden `page.tsx` slot, not the desk.
- `replaceMoonieDeskUrl` writes `{ ...history.state, __NA: true }` so Next does not `ACTION_RESTORE` the desk.
- New-chat intent clears once a `conversationId` exists (`urlNewChat && !conversationId`).
- Moonie desk loading uses a **sized** sidebar + composer placeholder (`min-h-[calc(100dvh-nav)]`), not a collapsed purple viewport.
- `browse/loading.tsx` + `browse/[genre]/loading.tsx` keep a catalogue-sized placeholder.

**Moonie entry / history (`pansaru`):**

| Step | Observed |
|------|----------|
| Navbar Ask Moonie | `href=/moonie?new=1` |
| Discover → desk | `/moonie?new=1`, empty greeting, composer mounted, **0** result cards (not latest). Navbar stayed. First-arrival filmstrip: Discover → desk+composer on `#1A1224` at 1008px height (not a 0-height purple pane). |
| Warm repeat | Second `/moonie?new=1` again empty desk; Recents still listed existing chats after hydrate |
| Recents reopen | `Help me find a novel…` → `/moonie?conversation=cmtglxysu002z3dm4by81pkkk` with that transcript; greeting gone |

**First reply / follow-up reply in the browser:** **NOT MEASURED** (no quota charge this pass; fixtures + source regressions only).

### New-chat rule

- Shared helper: `moonieLoggedInEntryHref()` → `/moonie?new=1` (+ optional prompt).
- Generic app CTAs (feed, For You, notifications, widget empty “Open full desk”) use that helper.
- Widget “Open full desk” with an active `conversationId` uses `buildMoonieDeskHref({ conversationId })`.
- `shouldRestoreLatestMoonieConversation` remains **always false**. Opening a desk does not POST `/api/moonie/recommend`.

### Automated checks (this pass)

| Check | Result |
|-------|--------|
| Isolated continuity / URL / loading | **27/27 PASS**, then **9/9 PASS** after search lint fix |
| `npm test` | **413/413 PASS**, exit **0** (~101s then ~107s after lint-only `useSyncExternalStore` swap) |
| `npm run lint` | Exit **0** — 0 errors, 4 pre-existing warnings |
| `npm run typecheck` | Exit **0** (re-run after search snapshot swap) |
| `git diff --check` | Exit **0** |
| `npm run build` | **NOT RUN** (dev server left on `:3000`) |

### Unmeasured / unresolved

- **CoverCarousel hydration** — still unresolved; not re-verified.
- Browser first-message and follow-up completion flash — fixtures only; no live recommend.
- Hard-refresh / cold chunk compile vs warm.
- `@dada` session and quota-exhausted live desk.
- Automation Enter on the open search listbox.

---

## Aug 31 — navigation gap closure (History API, filmstrip, carousel, Enter)

**Constraint:** Existing `:3000` webpack server kept. No quota reset/bypass, metadata `--apply`, history rewrite, commit, push, or production build. Browser session **`pansaru`**. First reply / follow-up used a **labelled client fetch fixture** (`window.__MOONIE_ANSWER_FIXTURE = labelled-browser-fixture`); `/api/moonie/recommend` was not charged.

### 1. `replaceMoonieDeskUrl` — installed Next.js 16.3.3, not canary docs

`node_modules/next/dist/client/components/app-router.js`:

- `history.replaceState` / `pushState` skip `ACTION_RESTORE` only when `data.__NA` or `data._N`.
- Otherwise `copyNextJsInternalHistoryState` copies `__NA` and `__PRIVATE_NEXTJS_INTERNALS_TREE` from the current entry, then `ACTION_RESTORE`.
- `popstate` without `__NA` reloads the document.

**Change:** pass `null` to the public History API. Do not manufacture `__NA`. Next copies internals. Desk stays in `/moonie` layout.

User-initiated Recents / New chat **push**; first conversation-ID assignment **replace**.

| Check | Result |
|-------|--------|
| First fixture reply assigns ID | **PASS** — `/moonie?new=1` → `/moonie?conversation=fixture-conv-answer-complete-1`. `history.state` keys `__NA` + `__PRIVATE_NEXTJS_INTERNALS_TREE` (copied by Next, not written by app). |
| Follow-up | **PASS** — same URL, second fixture reply, `data-moonie-desk-mount` stayed **2**. |
| Recents A → B | **PASS** — fixture → `/moonie?conversation=cmtglxysu002z3dm4by81pkkk`, mount stayed **2**. |
| Back / Forward | **PARTIAL** — `history.back()` reached `/moonie?new=1` (not the fixture entry, because first-ID used replace). Forward / second Back not re-measured after the New-chat sync fix. |
| Hard refresh | **NOT MEASURED** (would drop the in-page fixture intercept). |
| Direct conversation URL | **PARTIAL** — client nav to `?conversation=cmtglxysu002z3dm4by81pkkk` after a New-chat session could be rewritten by durable `?new=1` intent. Intent is now cleared when the address bar has `conversation=`. Not re-tested after that one-liner. |
| Generic Ask Moonie / New chat | **PASS** after location-subscribe fix — `/moonie?new=1`, greeting, no leftover B cards, mount **2**. Before the fix, Ask Moonie updated the address bar while Verdant/Gilded cards stayed (desk listened to `popstate` only). |
| Logout / account change | **SOURCE ONLY** — `signOutAndReload` full `location.assign`; hook `sessionOwnerRef` clears the desk when `sessionUserId` changes. Live logout / account switch **NOT MEASURED**. |

### 2. Answer-completion filmstrip (labelled fixture, not source-only)

`data-moonie-desk-mount` stayed **2**; desk height **1008px**; no `Opening Moonie` loading copy; body background stayed `rgb(250, 248, 255)` (navbar chrome). Screenshots: `moonie-empty-before-send.png`, `moonie-thinking.png`, `moonie-after-follow-up.png`.

| Frame | href | mount | deskH | loading |
|-------|------|-------|-------|---------|
| empty-desk | `?new=1` | 2 | 1008 | false |
| before-send | `?new=1` | 2 | 1008 | false |
| thinking | `?conversation=fixture-conv-answer-complete-1` | 2 | 1008 | false |
| after-first-reply | same | 2 | 1008 | false |
| after-follow-up | same (2 fixture replies) | 2 | 1008 | false |

Live quota recommend **NOT MEASURED**. Fixture hits: **2**.

### 3. CoverCarousel hydration

**Captured SSR vs live (before fix), `/home` as `pansaru`:**

- SSR right arrow: `disabled=""` + `hidden`, **no** `md:inline-flex`.
- Live after measure: `disabled=false` + `md:inline-flex`.
- Every scroller had `[content-visibility:auto]`.
- In-page console hook did **not** persist across document loads; no React warning string was captured from `console.error`.

**Fix (no `suppressHydrationWarning`, SSR kept):** arrows always use `hidden md:inline-flex disabled:opacity-40`; only `disabled` changes after measure. `content-visibility: auto` removed.

**After fix:** home SSR HTML contains `md:inline-flex disabled:opacity-40`; `content-visibility:auto` absent.

**Separate overlay (not CoverCarousel):** Next.js issues badge still named `src/components/brand/BrandLogo.tsx (156:5)` with the generic hydration-error help text (`typeof window` / `Date.now()` / locale). BrandLogo itself has none of those; likely a child (`MoonieMascot`). **Unresolved**, not this carousel pass.

### 4. Search Enter and Browse click → usable destination

| Action | Result | Data latency (honest) |
|--------|--------|------------------------|
| Real keyboard Enter on open listbox (`enterkeyprobe`, Search-all selected) | **PASS** — `/search?q=enterkeyprobe`, navbar stayed, “Matches for enterkeyprobe”, “No matches found” | URL at ~7.2s from probe-arm (includes type/setup). Main text empty ~1.3s after URL change (`blank:true` heuristic). Viewport height **1008**, bg `rgb(250, 248, 255)` — **not** a collapsed white pane. Catalogue query time unchanged. |
| Search field after submit | First pass left the input empty (`useSyncExternalStore` only heard `popstate`). Now notifies via `moonverse:search-location` + pathname effect. Later snapshot showed `value: enterkeyprobe`. |
| Browse → usable catalogue | **PASS** — `/browse`, “Open the stacks”, genre shelves, navbar. In-flight loading filmstrip **not** captured on this click (settled page). |

A History `pushState` wrap in Search was tried and **reverted** — it threw `History.pushStateAndNotify` in the Next overlay. Search now uses an event + pathname notify, not a History patch.

### Automated checks (this pass)

| Check | Result |
|-------|--------|
| Isolated URL / continuity / search / carousel / logout | **33/33 PASS** |
| `npm test` | **417/417 PASS**, exit **0** (~103s) |
| `npm run lint` | Exit **0** — 0 errors, 4 pre-existing warnings |
| `npm run typecheck` | Exit **0** |
| `git diff --check` | Exit **0** |
| `npm run build` | **NOT RUN** |

### Unmeasured / remaining

- Hard refresh / cold compile.
- Live (non-fixture) recommend with remaining quota.
- Live logout / account switch.
- BrandLogo / MoonieMascot hydration overlay.
- Direct conversation URL immediately after New chat (retest after intent-clear).
- Browse in-flight loading filmstrip on this click.

---

## Aug 31 — remaining four-gap close (history identity, salon routing, nav filmstrip, hydration)

**Constraint:** Existing `:3000` webpack server kept. No quota reset/bypass, metadata `--apply`, history rewrite, commit, push, or production build. Browser session **`pansaru`**. Do not treat all four gaps as closed.

Persisted conversation used for history identity:

`cmtglxysu002z3dm4by81pkkk`
User turn: “Help me find a novel in the MoonVerse catalogue.”
Assistant cards include **Verdant Threshold of Obsidian**, Gilded Spire, Crimson Spire of Crimson, Midnight Covenant of Crimson, Ashen Crown.

### 1. History identity (same conversation ID + transcript)

**Confirmed cause (this pass):** Desk location listeners called `setState` on the same stack as Next.js 16 `Navigation.handlePopState` (`useInsertionEffect must not schedule updates` at `use-moonie-chat.ts` `setIsRestoring(false)`). Recents / New chat `pushState` notified those listeners immediately.

**Fix:** `subscribeMoonieDeskLocation` defers with `queueMicrotask`. `MoonieDeskRoute` remains the only React subscription (`useSyncExternalStore`). `MoonieAssistantView` and `use-moonie-chat` no longer subscribe to the desk URL. Address-bar conversation still wins over `?new=1`. `writeMoonieDeskUrl` still no-ops off `/moonie`.

| Case | Automated | Browser (`pansaru`) | Status |
|------|-----------|---------------------|--------|
| Recents A click (from New chat) | Source: hook does not subscribe; URL helpers | **PASS** — `?new=1` → `?conversation=cmtglxysu002z3dm4by81pkkk`; greeting gone; same user text + Verdant cards | **PASS** |
| View novel | — | `/novels/cmtdr5g42008x3dg6fvkd1x1u` (Verdant) | **PASS** |
| Real `history.back()` | URL guard tests | Same ID + same transcript; no greeting | **PASS** |
| Real `history.forward()` | Must not rewrite novel URL | Novel URL stayed `/novels/…`; `conversation` param absent | **PASS** |
| Second Back | — | Same ID + same transcript | **PASS** |
| Refresh | — | Same ID + same transcript; no overlay | **PASS** |
| Direct `?conversation=` immediately after New chat | Intent-clear when URL has conversation | `browser_navigate` after New chat: first paint greeting, then same ID + Verdant transcript; URL stayed `?conversation=` | **PASS** |
| New chat itself | Continuity source tests | `?new=1`, greeting, no leftover cards; no insertion-effect overlay | **PASS** |

Live logout / account switch: **PENDING** (not authorised this pass).

### 2. Salon spoiler-aware reviews (not “Which reviewer?”)

**Confirmed cause (prior + this pass):** `REVIEWER_AUTHORED_REVIEWS_RE` matched “reviews **from**” in the salon chip. Routed to `REVIEWER_OVERVIEW` → “Which reviewer do you mean?”

**Fix kept:** `isPublicSalonReviewRequest()`; authored-review regex no longer treats salon “from”; `resolveCatalogueTask` / `classifyMoonieIntents` send this prompt to `TOP_REVIEWS` (ranking clarification, `consumesQuota: false`) even with `hasPriorReviewerResults`.

Exact prompt:

`Recommend spoiler-aware novel reviews from the MoonVerse salon that match what I might binge next.`

| Case | Automated | Browser | Status |
|------|-----------|---------|--------|
| Empty intents | **PASS** `reviewer-intent.test.ts`, `catalogue-task.test.ts`, `moonie-catalogue-routing.test.ts` (`handleMoonieRequest`) | Typed in empty New chat — live POST, **`consumesQuota: false`**, `pendingClarification.kind = review_ranking`. Reply: “I can show the top 5 public MoonVerse reviews. How should I rank them…”. Chips: Highest rated / Most recent / Most helpful. Not “Which reviewer?” | **PASS** |
| After reviewer-related context | **PASS** `classifyMoonieIntents(..., { hasPriorReviewerResults: true })` | Recents “Recommend novel reviews that match my For You shelves.” (`cmtglvbuz002h3dm43nwx89hx`) then typed the same prompt — same ranking clarification, `consumesQuota: false` | **PASS** |
| Actual Discover/salon chip | Chip copy matches `ReviewsSalonMasthead` `ASK_MOONIE_PROMPT` | Chip destination `/moonie?new=1&prompt=…` auto-submitted — same ranking clarification (`cmtgr70nw000b3dwjm3dyknem`). In-page Discover button click stayed on `/discover` (widget `openMoonie` path); destination URL is what signed-in `openMoonie` assigns when the widget cannot submit | **PASS** (destination + typed); Discover button navigation **PARTIAL** |

These live posts are **non-quota ranking clarifications**, not fixture intercepts and not discovery generation. Fixture answer-completion evidence from earlier sections stays **fixture-only**.

### 3. Search / Browse click → usable content

**Data bottleneck (already slimmed, re-measured):** Browse hub uses slim cover queries (5 covers + counts), not 6× full ranking. Search overlaps `searchParams` + `redirectIncompleteOnboarding()` before `runSearch`.

**Warm document GET (no cookies; TTFB of the RSC document):**

| Route | Samples | Notes |
|-------|---------|--------|
| `GET /search?q=culpa` | **120.1 / 103.3 / 98.9 ms** | HTML includes “Matches for”; not a 1.3s query |
| `GET /browse` | **188.7 / 186.4 / 180.3 ms** | HTML includes “Open the stacks”; browse document ~311 KB |

**Client click filmstrip (`pansaru`, warm `:3000`):**

| Action | First visible destination title | Usable results | Empty main? |
|--------|--------------------------------|----------------|-------------|
| Browse dropdown → `/browse` (from Search) | “Open the stacks” at **1658 ms** | Same frame (title is the hub heading) | `mainEmpty` not observed on the browse URL |
| Catalog suggestion → `/search?q=culpa` (from Browse) | Loading title “Search” at **2001 ms** (`PageRouteLoading`, `mainEmpty: false`) | Matches / Culpa at **3002 ms** | The old ~1.3s empty-main interval is **not** reproduced once the URL updates; the remaining wait is **before** the search URL commits (~2s on this sample) |

Unchanged background/height is **not** used as proof. The remaining client delay is RSC/navigation commit, not catalogue query time on warm GET. Cold compile **NOT MEASURED**.

### 4. Hydration around BrandLogo

**Captured overlay (this pass), `/moonie` desk after history restore:**

```
A tree hydrated but some attributes of the server rendered HTML didn't match the client properties.
src/components/moonie/MoonieAssistantView.tsx (926:5) @ FilterChip
MoonieLayout → MoonieDeskRoute → MoonieAssistantView → MoonieDeskComposer → FilterChip → <button>
```

The only `+ Client / − Server` attribute diffs in that overlay are `data-cursor-ref="e12"` … `e17` / `e27` on composer controls and the sr-only label. **`data-cursor-ref` is not in the application source** (Cursor browser instrumentation). The `+ Tell Moonie what you feel like reading` child on `<label htmlFor="moonie-composer">` appears only next to that injected attribute; `MoonieDesk.tsx` always renders that label text.

Navbar BrandLogo uses `mark="none"` (no MoonieMascot). On `/home`, the in-nav lockup is `href="/home"`; a second `aria-label="MoonVerse home"` lockup with `href="/"` is not inside the nav. Opening the `/home` issues badge did not yield a BrandLogo component stack in this capture.

**Not fixed in app code:** do not `suppressHydrationWarning`; do not treat MoonieMascot as the cause. A hydration failure **without** `data-cursor-ref` was **not** captured. Gap **not closed**.

The earlier New-chat overlay (`useInsertionEffect must not schedule updates` at `use-moonie-chat.ts:654`) is a **separate** console error; it is addressed by the deferred location subscription (item 1).

### 5. Restoration vs live generation

| Check | Label | Result |
|-------|-------|--------|
| Restore `cmtglxysu002z3dm4by81pkkk` | Real persisted records; no recommend POST | **PASS** (Recents, Back/Forward, refresh, direct URL) |
| Salon ranking clarification | Live POST, `consumesQuota: false` | **PASS** (empty, chip URL, after For You recents) |
| Earlier answer-completion filmstrip | **Fixture-only** (`window.__MOONIE_ANSWER_FIXTURE`) | Unchanged; not re-run |
| Live discovery generation | Chargeable | **PENDING** |
| Live logout / account switch | Authorised session change | **PENDING** |

### Automated checks (this pass)

| Check | Result |
|-------|--------|
| Isolated URL / continuity / reviewer / catalogue-task | **32/32 PASS**, then **24/24 PASS** after lint fix |
| `moonie-catalogue-routing.test.ts` + intent + PageRouteLoading | **38/38 PASS** (includes live `handleMoonieRequest` salon chip) |
| `npm test` | **426/426 PASS**, exit **0** (~94s) |
| `npm run lint` | Exit **0** — 0 errors, 4 pre-existing warnings |
| `npm run typecheck` | Exit **0** |
| `git diff --check` | Exit **0** |
| `npm run build` | **NOT RUN** (dev server left on `:3000`) |

### Remaining gaps (do not close the contract)

- Hydration overlay still appears in the Cursor browser; the captured mismatch is `data-cursor-ref` on `FilterChip`, not a confirmed BrandLogo/MoonieMascot app bug.
- Client Search/Browse still takes ~2s to commit the destination URL on the measured click; warm document TTFB is ~100–190ms.
- Discover in-page salon **button** click did not leave `/discover` (widget `openMoonie`); chip **destination URL** was verified.
- Live discovery generation and live logout remain **PENDING**.

---

## 2026-08-31 contract continuation (Search & Moonie acceptance)

**Account / environment:** signed-in `pansaru` on existing webpack `npm run dev` `:3000`. Not `luffy`. Recording IDs were not treated as owned. No DB apply, reseed, quota reset, commit, push, or production build.

### Handoff table

| Case IDs | Current source path / cause | Expected | Actual IDs / behaviour | Automated result + exit | Browser account / environment | Evidence status | Remaining action |
|---|---|---|---|---|---|---|---|
| P0 history T04 | Off-desk empty search was read as `?new=1`. `readMoonieDeskRouteFromLocation` + replace guard. | Back from novel restores the same conversation | `cmtglxysu002z3dm4by81pkkk` → Verdant `cmtdr5g42008x3dg6fvkd1x1u` → Back → same conversation + Verdant/Gilded/Crimson cards, not `?new=1`. Refresh kept the same URL and cards. First paint can still show greeting ~0.5s. | URL/continuity tests in `conversation-url.test.ts` **PASS** (included in 61/61 targeted run) | `pansaru`, `:3000` | **BROWSER-PASS** (Back + refresh). Forward after this refresh **NOT-MEASURED**. `luffy` recording **NOT-MEASURED**. | Optional Forward sample; owner `luffy` only if session is that account |
| P0 widget-to-desk | `Open full desk` uses `buildMoonieDeskHref({ conversationId })` | Continue that conversation | Widget salon thread `cmtgtjqra000r3dwjnnobnhpi` restored mood clarification after ~499ms, not `?new=1` | **AUTOMATED-PASS** href helper | `pansaru` | **BROWSER-PASS** | None for this path |
| P0 R01 chip | Chip is `AskMoonieButton` → `openMoonie(ASK_MOONIE_PROMPT)` into the widget | Reviews or one reading-preference clarification, not Which reviewer | In-page widget: exact salon prompt + “What are you in the mood to read—cozy fantasy, romance, or something darker?” Chips Cozy fantasy / Romance / Something darker. Not Which reviewer / rank-them. `consumesQuota: false` clarification. | **AUTOMATED-PASS** `moonie-catalogue-routing.test.ts` + `moonie-contract-acceptance.test.ts` (masthead prompt + `openMoonie` dispatch) | `pansaru` Discover masthead button (visible copy; hidden SSR duplicate exists) | **BROWSER-PASS** (chip). Romance follow-up **NOT-MEASURED** (would charge) | Do not rewrite historical ranking replies |
| P0 T01/T02 | Navbar `aria-busy` / `data-nav-pending` + prefetch. Destination still RSC/dev | Immediate click feedback; usable content measured separately | Discover from Community: link `busy` while still on `/community`; later `/discover` h1 “Discover reads worth finishing…” at **446ms** on this one warm sample after the click snapshot. Navbar stayed. Body `rgb(250, 248, 255)`. Browse dropdown did not expand on the sample click. | Warm GET timings remain historical (~99–189ms). This is **not** p95. | `pansaru`, webpack **dev** | Discover: click-feedback **BROWSER-PASS**; destination **one sample**. Browse hub / Search submit / Ask Moonie nav **NOT-MEASURED** this turn | Repeat Browse “Open full catalogue”, Search submit, Ask Moonie; do not claim prod latency |
| N16 | `Is Cultivation Chat Group completed?` was RECOMMEND (cultivation + completed signals) | Factual lookup of that title | Now `NOVEL_OVERVIEW` / `novel_bundle` for exact title `cmtdgrhej00803d45kg4ybzsc`. Status reply uses eligible `publicationStatus` or explicit unknown evidence. | **AUTOMATED-PASS** after intent + `emphasizeStatus` | Not re-typed in browser | **FIXED-IN-CODE** + **AUTOMATED-PASS**. Browser **NOT-MEASURED** | Browser type once if quota allows |
| S01 | `parseSearchQuery` stole `cultivation` as a genre facet from the title | Exact title hit | Search now returns Cultivation Chat Group. Standalone `cultivation` and `fantasy slow-burn` still facets. | **AUTOMATED-PASS** `search.test.ts` + `search-acceptance.test.ts` | Search UI **NOT-MEASURED** | **FIXED-IN-CODE** + **AUTOMATED-PASS** | Browser Search typeahead/Enter |
| N01 / desk chips / C16 / R02 / U08 | Existing pipeline + new contract file | Chip text and honest private-data refusal | Desk chips → RECOMMEND. Widget find-a-novel chip not title lookup. Polite salon paraphrase → `salon_reviews`. R02 review cards for CCG. U08 no email/private payload. | **AUTOMATED-PASS** `moonie-contract-acceptance.test.ts` | Chip clicks except R01 **NOT-MEASURED** | **AUTOMATED-PASS** | Remaining N/R/U/C rows |
| T11 hydration | Overlay at Navbar / MoonieDesk | No app mismatch | Captured `data-cursor-ref` from Cursor snapshot instrumentation (`Navbar.tsx` Primary nav; earlier `MoonieDesk.tsx:510`). Not CoverCarousel. | CoverCarousel source tests still forbid `suppressHydrationWarning` | Overlay visible during this pass | **NOT-MEASURED** as an app bug; do not suppress | Capture a mismatch without `data-cursor-ref` |
| N/R/U/C remainder | Existing tests cover many; not a full contract matrix | Applicable cases | Many rows still fixture-only or unrun in browser | Targeted **61/61 PASS** (`search.test.ts`, `desk.test.ts`, `intent-correctness.test.ts`, `moonie-contract-acceptance.test.ts`, `search-acceptance.test.ts`). Full `npm test` **NOT-MEASURED** this turn (tsx IPC / runner flake). `npm run lint` **0 errors / 4 warnings**. `npm run typecheck` **NOT-MEASURED** this turn after later edits. `npm run build` **NOT RUN**. | — | **NOT-MEASURED** for most browser rows | Full suite + typecheck + coordinated production build |

### Automated checks (this continuation)

| Check | Result |
|-------|--------|
| Targeted contract/search/intent/desk | **61/61 PASS**, exit **0** (~13s) |
| `npm run lint` | Exit **0** — 0 errors, 4 pre-existing warnings |
| `npm run typecheck` | **NOT-MEASURED** after N16/S01 patches (runner returned no status) |
| Full `npm test` | **NOT-MEASURED** this turn (`tsx` IPC `EPERM` in sandbox; later runner had no status) |
| `git diff --check` | **NOT-MEASURED** this turn |
| `npm run build` | **NOT RUN** (do not stop the current server) |

Do not mark the overall pass complete: destination latency is one Discover sample in webpack dev; most N/R/U/C/S/T browser rows remain unmeasured; full suite and typecheck were not confirmed after the last patches; production build is uncoordinated.

---

## 2026-08-31 contract continuation (second pass — T04 full history, hydration fix, SSR route)

**Account / environment:** signed-in `pansaru` on webpack `npm run dev` `:3000`. No quota reset, DB apply, commit, push, or production build.

### Code fixes (this pass)

| Area | Change | Purpose |
|------|--------|---------|
| `BrandLogo.tsx` | Tagline `<span>` always in DOM; visibility via `hidden` classes | Stable SSR/client tree around nav lockup |
| `Navbar.tsx` | `scrollReady` gate before applying `navScrolled` | Avoid scroll-restoration class drift on first paint |
| `moonie/page.tsx` + `layout.tsx` | `MoonieDeskRoute` moved to page with `serverRoute` from `searchParams` | SSR matches `?conversation=` / `?new=1` before client hydration |
| `MoonieDeskRoute.tsx` | `getServerSnapshot` uses `serverRoute` prop | Fixes `MoonieDeskEmpty` greeting vs restoring mismatch |
| `PageRouteLoading.test.ts` | Expect `MoonieDeskRoute` on page, not layout | Aligns static contract with route move |

### P0 history T04 — **BROWSER-PASS** (full sequence)

Persisted conversation **`cmtglxysu002z3dm4by81pkkk`** (“Help me find a novel…”), Verdant novel **`cmtdr5g42008x3dg6fvkd1x1u`**.

| Step | URL | Transcript |
|------|-----|------------|
| Direct open / reload | `?conversation=cmtglxysu002z3dm4by81pkkk` | Verdant, Gilded, Crimson, Midnight, Ashen cards |
| View novel | `/novels/cmtdr5g42008x3dg6fvkd1x1u` | — |
| `history.back()` | same conversation URL | same five cards |
| `history.forward()` | novel URL | Verdant h1 |
| `history.back()` | same conversation URL | same five cards |
| `location.reload()` | same conversation URL | same five cards |
| New chat → direct `?conversation=` | after `?new=1`, navigate to conversation URL | cards after ~3s hydrate; brief greeting flash on first paint only |

**Not measured:** `luffy` recording IDs; Recents sidebar click (URL navigation used; click on Recents row did not navigate in one sample while `?new=1` was active).

### P0 R01 salon prompt

| Path | Automated | Browser |
|------|-----------|---------|
| Discover masthead chip → widget | **PASS** `moonie-contract-acceptance.test.ts` + routing tests | Prior pass: mood clarification chips, not “Which reviewer?” |
| Desk typed empty chat | **PASS** `moonie-catalogue-routing.test.ts` (live `handleMoonieRequest`) | **NOT-MEASURED** this pass (hydration overlay blocked composer on `?new=1` after hot reload) |
| Desk after reviewer context | **NOT-MEASURED** | **NOT-MEASURED** |
| Romance follow-up | — | **NOT-MEASURED** (would charge quota) |

### Nav filmstrip (webpack dev, warm)

| Transition | Click feedback | Destination | Usable content |
|------------|----------------|-------------|----------------|
| Community → Discover | Discover link `busy` immediately | `/discover` within ~1.5s sample | Discover page with rails loaded (h1 present in snapshot) |
| Browse dropdown → hub | Click did not expand dropdown in sample | — | **NOT-MEASURED** |
| Search submit (Enter) | — | — | **NOT-MEASURED** |

### Hydration

| Capture | Component stack | Status |
|---------|-----------------|--------|
| Before fixes | `BrandLogo.tsx (156:5)` | Addressed: stable tagline DOM + `scrollReady` |
| After `?conversation=` SSR fix | SSR shows “Restoring this conversation” (not greeting + vibe chips) | **FIXED-IN-CODE** |
| After hot reload on `?new=1` | `AppChrome.tsx (63:7)` skip link; `MobileBottomNav.tsx (141:13)` | Overlay still appears in Cursor browser after HMR; **needs clean cold load to re-verify** |
| `MoonieDeskEmpty` mismatch on New chat → conversation URL | Root cause: server snapshot lacked `conversationId` | **FIXED-IN-CODE** via `serverRoute` |

Do **not** use `suppressHydrationWarning`. `MoonieMascot` was not the confirmed stack in this pass.

### Automated checks (this pass)

| Check | Result |
|-------|--------|
| `moonie-desk-continuity.test.ts` | **5/5 PASS** |
| `moonie-contract-acceptance.test.ts` | **14/14 PASS** (includes salon masthead + routing) |
| `PageRouteLoading.test.ts` | **6/6 PASS** (after layout→page update) |
| `npm run typecheck` | Exit **0** |
| `npm run lint` | 1 unused-var warning fixed; remaining warnings pre-existing |
| Full `npm test` | Background run **438/438 PASS**, exit **0** (~98s, terminal `600224.txt`). Re-run after layout→page + `PageRouteLoading` fix **NOT-MEASURED** this continuation. |
| `npm run build` | **NOT RUN** |

### Remaining gaps (contract **not** closed)

- Desk **typed** salon prompt and **after-reviewer-context** browser matrix for R01
- Browse hub dropdown → `/browse` filmstrip; Search Enter filmstrip; empty-main interval quantification
- Hydration overlay on cold load after all fixes (post-HMR captures are unreliable)
- `luffy` recording / logout / live discovery generation
- Coordinated production build

---

## 2026-08-31 contract continuation (third pass — latency, hydration, salon browser, Discover widget)

**Account / environment:** signed-in `pansaru` on webpack `npm run dev` `:3000`. No quota reset, DB apply, commit, push, or server restart. `npm run build` succeeded; `PORT=3001 npm run start` **blocked** (`EADDRINUSE` — prior process on `:3001`; restart forbidden). Prod HTTP probe to `:3001` timed out at 5s (no smoke on fresh build).

### Search / Browse latency (measured)

**HTTP probe** (`scripts/nav-latency-probe.ts`, 5 samples):

| Target | Dev doc TTFB (ms) | Dev RSC prefetch (ms) |
|--------|-------------------|------------------------|
| `/community` | ~3600 | ~82 |
| `/discover` | ~3717 | ~10 |
| `/browse` | ~3714 | ~13 |
| `/search?q=cultivation` | ~3714 | ~13 |

Interpretation: **full document** fetches in dev reflect route compilation (~3.7s). **RSC prefetch** is ~10–82ms — client navigation is not blocked by RSC generation once routes are warm.

**Warm client navigation** (CDP, repeated samples from `/community`):

| Transition | Route commit | Usable content |
|------------|--------------|----------------|
| Discover link (×3) | ~99–112ms | ~436–479ms (h1 present) |
| Search Enter `cultivation` | ~26ms | ~27ms (search results / filmstrip) |
| Browse → Fantasy hub | Navigated to `/browse/fantasy` with works grid + facet chips | Usable (Fantasy h1, 188 works) |

Nav links show immediate `aria-busy` / pending mark on click; `discover/loading.tsx` shows titled skeleton during wait. **No additional product bottleneck fix** beyond prior `pendingHref` cleanup + loading shells — perceived delay on **cold** dev hits is compilation, not missing client nav.

### Hydration

| Check | Result |
|-------|--------|
| Cold load `/community` after fixes | **No** hydration overlay; **no** issues badge |
| Cursor instrumentation | **355** `data-cursor-ref` nodes on page — instrumentation present in Cursor browser only |
| Post-HMR `/search?q=culpa` | Transient overlay cited `BrandLogo.tsx (155:5)` in one sample; **not reproduced** on cold `/community` load |
| Application markup | **Not changed** to accommodate `data-cursor-ref`; no `suppressHydrationWarning` added |

**Distinction:** Cold loads pass; overlays after HMR or with Cursor DOM refs are **not** treated as open app defects without a normal-browser repro.

### Salon review task — **BROWSER-PASS** (widget + desk)

**Discover masthead “Ask Moonie”** (`AskMoonieButton`):

- Stays on `/discover` (widget open — correct for widget-mounted surfaces).
- Prompt submitted **once**: `Recommend spoiler-aware novel reviews from the MoonVerse salon that match what I might binge next.`
- Mood clarification chips (cozy fantasy / romance / darker) — **not** “Which reviewer?”

**Ranking continuation** (widget):

| Step | Observed |
|------|----------|
| `give me the top 5 novel reviews` | Ranking clarification: highest rated / **most recent** / most helpful |
| Chip **Most recent** | Top 5 public review cards; spoiler-marked entries gated (“Spoiler-marked review — open the novel page…”) |
| Sample review IDs | `cmtgaqx4p00113dj3ql2sysc1`, `cmtdqx70i07nm3dbm6ou0seat`, `cmtdqx5ao02e43dbmnriydozo`, … |
| **Open full desk** | `/moonie?conversation=cmth2uudr003j3dwjb2ahj2hc` with same top-5 / most-recent transcript + review links |
| Reload `?conversation=` | Cards + IDs restored after hydrate |

**Automated (same pass):**

| Test | Result |
|------|--------|
| `moonie-catalogue-routing.test.ts` | **17/17 PASS** (includes `most recent` after ranking + binge w/ `tastePrefs`) |
| `moonie-contract-acceptance.test.ts` | **14/14 PASS** |
| `moonie-desk-continuity.test.ts` | **5/5 PASS** |
| `PageRouteLoading.test.ts` | **6/6 PASS** |

**Personalization note:** Automated binge prompt with explicit `tastePrefs` (`romance`, `action`) returns personalised review cards without mood ask (**PASS**). Browser widget for `pansaru` showed mood ask — consistent with server-side taste load when onboarding/taste profile lacks genre signal; **not** evidence that ranking alone proves personalised recommendations.

**“Most helpful”** ranking option is backed by `review_helpful` in `moonie-top-reviews.service.ts` (not invented copy).

### Discover entry — **BROWSER-PASS**

| Control | Expected | Observed |
|---------|----------|----------|
| Masthead **Ask Moonie** | Open widget on `/discover` | **PASS** — URL unchanged; widget + prompt once |
| Aside **Find my next binge** | Desk handoff (`AskMoonieLink` / `moonieEntryHref`) | Uses link to desk — **not** forced widget (by design) |
| Navbar **Ask Moonie** | Desk entry for logged-in | Link to `/moonie` — separate from masthead widget |

### T04 history (preserved)

Prior pass **BROWSER-PASS** on `cmtglxysu002z3dm4by81pkkk` — **not re-run** this pass; code fixes retained.

### Build / checks

| Check | Result |
|-------|--------|
| `npm run typecheck` | **PASS** |
| `npm run build` | **PASS** |
| `npm run start` on `:3001` | **BLOCKED** (`EADDRINUSE`; no restart) |
| Full `npm test` | Prior **438/438 PASS**; not re-run entire suite this pass |

### Still pending (by policy or environment)

- Live discovery generation with quota
- Logout flow
- `luffy` recording IDs
- Production smoke on **fresh** build (needs `:3001` free or allowed restart)
- Cold hydration repro in **normal browser** without Cursor instrumentation
- Desk typed empty-chat salon path if HMR overlay recurs

**Contract status:** Bounded acceptance **substantially complete** for scoped Search/Moonie nav, salon review ranking flow, Discover widget entry, and T04 history. Remaining items are environment/policy blockers or normal-browser hydration confirmation—not open functional defects in the measured paths above.

---

## Aug 31 — shared parsing/routing repair + navbar active-state (bounded)

**Constraint:** No reseed, metadata `--apply`, quota reset, commit, push, or server restart. Salon review flow and T04 history fixes preserved.

### Screenshot failures → shared repair (not per-prompt exceptions)

| ID | Input | Before | After (automated) |
|----|-------|--------|-------------------|
| S1 | `Find novels like Queen of Shadows with beginner friendly vibes, but easier on the angst.` | Title lookup on `s like Queen of Shadows…` | `MORE_LIKE_THIS`; seed `Queen of Shadows`; prefs separate; `extractNovelQuery` null |
| S2 | `Recommend novels like Taggart's Woman with verified reading links` | Reading-link clarify for seed | `MORE_LIKE_THIS` + `requireOfficialReadingLink`; no `FIND_READING_SOURCE` |
| S3 | Shelf prompt with `with a short why` | `short length` hard filter | `length` null; output-format cue only |

**Shared modules:** `similarity-request.ts`, `output-format.ts`, intent prefix `\b(?:novels?|books?)\b` + optional novel word in lookup patterns, `hard-constraints` link requirement, hybrid SQL `officialReadingLinkWhere`.

### Navbar stale highlight (separate from nav latency)

**Repro:** Community → Ask Moonie → `/moonie?new=1` while Community stayed purple/underlined.

**Cause:** `data-nav-pending="true"` shared active CSS; `pendingHref=/community` could persist while Moonie was displayed.

**Fix:** `nav-route-active.ts` — `isNavPending` clears when Moonie is active; Navbar/MobileBottomNav use shared active matchers + pending helper. Pending feedback kept for Discover→Browse in-flight nav.

### Taggart's Woman 4.1/11 vs 4.0/10 (secondary)

**Not filed as defect from screenshots alone.** Moonie recommendation cards use `review.groupBy` with `moderationStatus: OK` (same gate as review-page community pulse). Screenshot mismatch occurred on a **reading-link lookup** card for the seed novel, not a verified similarity slate. Needs same `novelId` + timestamp check before calling aggregation wrong.

### Automated regressions (this pass)

| Suite | Result |
|-------|--------|
| `similarity-request.test.ts` | **5/5 PASS** |
| `output-format.test.ts` | **4/4 PASS** |
| `nav-route-active.test.ts` | **5/5 PASS** |
| `moonie-contract-acceptance.test.ts` (S1–S3 + salon) | **26/26 PASS** |
| `hard-constraints.test.ts` | **20/20 PASS** |
| `npm run typecheck` | **PASS** |

**Browser re-verify:** Widget/desk typed equivalents for S1–S3 and Community→Moonie nav styling — **NOT RUN** this pass (automated contract only).

### Bounded verification closure (Aug 31 afternoon)

**Execution provenance (read-only, Aug 31 ~11:56 UTC+1)**

| Field | `:3000` dev (browser target) | `:3001` hung listener |
|-------|------------------------------|------------------------|
| **Canonical repo** | `/Applications/moonverse ` (trailing space — **only** moonverse directory under `/Applications`) | Same cwd on child process |
| **Path without trailing space** | `/Applications/moonverse` — **does not exist** (earlier reports truncated the space) | — |
| **`moonverse copy` path** | — | Parent argv references `/Applications/moonverse copy/node_modules/.bin/next` — **path not on disk** (deleted copy; orphaned launcher) |
| **PID** | 69395 `next-server (v16.3.3)` | 85073 `next-server (v16.2.9)` |
| **Parent PID / argv** | 7445 — `node /Applications/moonverse /node_modules/.bin/next dev --webpack` | 85072 — `node /Applications/moonverse copy/node_modules/.bin/next dev --webpack` |
| **cwd** | `/Applications/moonverse ` | `/Applications/moonverse ` |
| **Resolved Next** | package + `node_modules/next` → **16.3.3** | **16.2.9** (stale binary from missing copy install) |
| **Build output dir** | `/Applications/moonverse /.next` | Same dir on disk (shared `.next`; dev does not imply prod artifact served) |
| **`.next/BUILD_ID`** | `tuqbvfev4iWHva6oE59LS` @ **2026-08-31T10:05:26Z** | Same file on disk — **not** proven served by either listener |
| **HTTP** | **200** (~2.5s, `connect-timeout 2s`) | **Headers timeout** (5s `max-time`; 0 bytes) |
| **Same tree as edits/tests?** | **Yes** — dev compiles from canonical cwd source | **No** — wrong Next version, hung, not usable for acceptance |

**Build correspondence:** A passing test suite validates **source** on the canonical tree. It does **not** prove the **10:05** `.next` production artifact contains post-10:05 edits (including navbar lint repair). **Current-build correspondence: UNVERIFIED** until an isolated fresh `next build` + `next start` smoke succeeds.

**Test run reconciliation**

| When | Count | Tree state |
|------|-------|------------|
| Earlier session (historical) | **438/438** | Pre–similarity/nav acceptance expansion |
| Mid-pass (duplicate table) | **471/471** | Stale duplicate entry — superseded |
| Aug 31 post-parsing repair | **476/476** | Full suite incl. `moonie-similarity-acceptance`, `nav-route-active` |
| Aug 31 post lint repair | **476/476** | Navbar/MobileBottomNav `useSyncExternalStore` + path-keyed pending |

### Reconciled status (Aug 31 ~12:00 UTC+1)

| Item | Code-fixed | Automated-pass | Browser-pass | Blocked / pending |
|------|------------|----------------|--------------|-------------------|
| **S1 similarity** | `similarity-request`, intent, response routing | `moonie-similarity-acceptance` + contract | Desk only (`pansaru`, `:3000` dev): conv `cmth4a76h00013djn27wc6ffp` | Widget not run (quota) |
| **S2 verified links** | `requireOfficialReadingLink` on alts | Fixture: seed 0 links; 5 verified alts | — | **FIXTURE-ONLY** (not browser) |
| **S3 short why** | `output-format.ts` | Fixture: no `short length`; real short-novel still works | — | **FIXTURE-ONLY** (not browser) |
| **Navbar active/pending** | `nav-route-active` + path-keyed pending | `nav-route-active.test.ts` **7/7** | Prior multi-route pass on `:3000` dev (not re-run post lint repair) | Back/Forward automation; re-browser after lint fix |
| **Lint** | `useSyncExternalStore`; path-keyed pending (no rule disable) | `npm run lint` **0 errors** (warnings only) | — | — |
| **Salon / T04 history** | (prior) | In **476** suite | Prior evidence | Not re-run |
| **Prod smoke** | — | — | — | **BLOCKED** — hung `:3001`; shared `.next`; no kill without approval |
| **Build ↔ source** | — | Tests pass on source | — | **UNVERIFIED** until isolated build + start |
| **Hydration (normal browser)** | — | — | — | **PENDING** |
| **Owner-session** | — | — | — | **PENDING** |

### Controlled production verification (requires approval before any stop)

1. **Stop only** PIDs **85072** + **85073** (`:3001` hung `moonverse copy` launcher + `next-server` 16.2.9). **Do not** stop **7445** / **69395** (`:3000` dev) unless owner wants a single-server window.
2. **Isolated build output:** `NEXT_DIST_DIR=.next-prod-verify npx next build` (or one-off `distDir` in env-driven config) so **`.next` used by `:3000` dev is not overwritten**.
3. **Start:** `npx next start -p 3001 -d .next-prod-verify` from `/Applications/moonverse ` using **canonical** `node_modules/.bin/next` (**16.3.3**).
4. **Smoke once:** `curl --connect-timeout 2 --max-time 15 http://127.0.0.1:3001/` → expect **200** + `X-Powered-By: Next.js`; record new `BUILD_ID` and compare to source timestamp.
5. **Stop** prod smoke server after smoke; leave `:3000` dev untouched.

**Final automated gate (lint repair pass):** `npm test` **476/476**, `npm run typecheck` **PASS**, `npm run lint` **0 errors**, `git diff --check` **PASS**. Fresh `next build` + prod smoke **not run** (shared output + hung `:3001` — awaiting approval above).

### Production verification (approved Aug 31 ~12:12 UTC+1)

**Stale `:3001` cleanup (identity re-checked before stop)**

| PID | Role | Command | Port |
|-----|------|---------|------|
| 85072 | launcher | `node …/moonverse copy/node_modules/.bin/next dev --webpack` | — |
| 85073 | listener | `next-server (v16.2.9)` | 3001 |

Graceful `SIGTERM` on 85073 then 85072 → port free. **`:3000` dev untouched** (still 200; shared `.next/BUILD_ID` unchanged `tuqbvfev4iWHva6oE59LS`).

**Isolation mechanism (verified)**

| Mechanism | Result |
|-----------|--------|
| `__NEXT_PRIVATE_STANDALONE_CONFIG` | **Rejected** — `next build` failed (`generate is not a function`) |
| `NEXT_MOONVERSE_DIST_DIR` + conditional `distDir` in `next.config.ts` | **Works** — unset → default `.next`; set → `.next-prod-verify` |
| Script | `node scripts/prod-verify-isolated.mjs build\|start [port]` |

**Build**

| Field | Value |
|-------|--------|
| Command | `node scripts/prod-verify-isolated.mjs build` |
| Exit | **0** |
| Next | **16.3.3** (canonical `node_modules`) |
| Output dir | `/Applications/moonverse /.next-prod-verify` |
| `BUILD_ID` | **`naVXakO4hyqOFGhA1zj5s`** (new; shared `.next` still `tuqbvfev4iWHva6oE59LS`) |

**Prod start**

| Field | Value |
|-------|--------|
| Command | `NEXT_MOONVERSE_DIST_DIR=.next-prod-verify node scripts/prod-verify-isolated.mjs start 3001` |
| PID | 7244 `next-server (v16.3.3)` |
| Ready | ~111ms |

**HTTP smoke (`:3001` prod)**

| Route | HTTP | Notes |
|-------|------|-------|
| `/` | 200 | HTML embeds `naVXakO4hyqOFGhA1zj5s` |
| `/search` | 200 | Public search UI + catalogue rails |
| `/browse` | 200 | Full browse hub |
| `/home` | **307** | Expected auth redirect (not failure) |
| `/moonie` | 200 | Guest page (no quota-consuming submit) |
| JS chunks (5 sampled) | 200 | From prod HTML |

**Browser smoke (Cursor browser, `:3001` prod)**

| Route | Render |
|-------|--------|
| `/` | Landing + nav + catalogue content |
| `/search` | Search hub + ranked list |
| `/browse` | Browse hub + genre index |

Prod server stopped gracefully after smoke; **`:3000` dev final 200**.

| Hydration normal browser | **PENDING** — prod smoke used Cursor browser; not confirmed outside instrumentation |
