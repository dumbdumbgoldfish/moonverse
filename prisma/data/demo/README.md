# MoonVerse development dataset

Generated files here are **development-only** community data for UI, feature and performance testing.

## Policy

- Novel titles/authors/covers come from the real catalog and Open Library where available.
- Synopses are **original MoonVerse editorial blurbs** (not scraped publisher copy).
- **Reviews and comments are newly composed.** Never scrape Goodreads, NovelUpdates, Reddit, etc.
- **Reading links are verified OFFICIAL publisher URLs only** (Wuxiaworld, Webnovel, Royal Road, etc.).
- Never auto-add NovelUpdates, Open Library or guessed/fake URLs.
- Novels without a verified official source keep an empty reading-link list.

## Commands

```bash
npm run demo:generate
npm run demo:generate -- --batch 1
npm run prisma:seed:demo
```
