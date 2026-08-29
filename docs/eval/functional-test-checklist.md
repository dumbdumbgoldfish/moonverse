# MoonVerse functional test checklist (FPR)

Developer-led checks. Record date, result (Pass/Fail), and notes. Do not mark Pass until the behaviour is observed on a running build.

| Test ID | Function | Steps | Result | Date | Notes |
|---------|----------|-------|--------|------|-------|
| FT-01 | Register valid user | Create account with valid email/password | | | |
| FT-02 | Reject duplicate account | Register same email again | | | |
| FT-03 | Login / logout | Credentials session works | | | |
| FT-04 | Create own review | Title, rating, body, genres/tags | | | |
| FT-05 | Edit / delete own review | Owner only | | | |
| FT-06 | Prevent editing others’ review | Second account cannot edit | | | |
| FT-07 | Like / unlike review | Toggle updates count | | | |
| FT-08 | Comment on review | Post and see thread | | | |
| FT-09 | Follow user | Follow appears on profile/feed | | | |
| FT-10 | Folder save | Create folder; add review | | | |
| FT-11 | Browse / search | Genre browse and search return novels/reviews | | | |
| FT-12 | Notifications | Trigger like/comment; item appears | | | |
| FT-13 | Reading status | Set WANT/READING/FINISHED on novel | | | |
| FT-14 | Admin access control | Non-admin blocked from `/admin` | | | |
| FT-15 | Moonie in-domain | Prompt S01–S02 style; titles exist in catalogue | | | |
| FT-16 | Moonie off-topic | Homework/medical prompt redirected | | | |
| FT-17 | Moonie guest limit | Guest demo respects turn limit | | | |

Automated Moonie metrics: run `npm run moonie:eval` and attach `docs/eval/moonie-eval-results-latest.md`.
