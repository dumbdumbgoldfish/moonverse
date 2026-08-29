# MoonVerse

MoonVerse is a web novel review community platform built for an MSc project. Members discover, write, and discuss web novel reviews, organise saves into folders, follow each other, receive notifications, and get AI-powered recommendations from **Moonie**: a floating assistant that suggests novels based on MoonVerse data (not a general chatbot).

## Stack

- **Next.js 16** (App Router) + **TypeScript**
- **Tailwind CSS v4** + **shadcn/ui**
- **PostgreSQL** + **Prisma**
- **NextAuth v5** (credentials)
- **OpenAI** (optional, for Moonie live recommendations)

## Prerequisites

- Node.js 20+
- Docker (for local PostgreSQL) or an existing PostgreSQL instance

## Run locally

> **Before `npm run dev`:** copy `.env.example` to `.env` and set **`DATABASE_URL`** and **`AUTH_SECRET`**. 
> Without them you will see **Prisma `DATABASE_URL` missing** or **Auth.js `MissingSecret`** at runtime. 
> Restart the dev server after creating or editing `.env`.

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Copy the example env file and edit values:

```bash
cp .env.example .env
```

Required variables (the app will not run without these):

```env
DATABASE_URL="postgresql://moonverse:moonverse@localhost:5432/moonverse?schema=public"
AUTH_SECRET="your-secret-here" # openssl rand -base64 32
AUTH_URL="http://localhost:3000"
```

| Symptom | Fix |
|---------|-----|
| `MissingSecret` / Auth.js secret error | Set `AUTH_SECRET` in `.env` (generate with `openssl rand -base64 32`) |
| Prisma `Environment variable not found: DATABASE_URL` | Set `DATABASE_URL` in `.env` to your PostgreSQL connection string |
| Changes not applied | Stop `npm run dev`, save `.env`, then start again |

Optional (Moonie live AI):

```env
OPENAI_API_KEY="sk-..."
OPENAI_MODEL="gpt-5.6-luna"
OPENAI_VISION_MODEL="gpt-5.6-terra"
```

### 3. Start PostgreSQL

```bash
docker compose up -d
```

### 4. Migrate and seed the database

```bash
npm run prisma:migrate
npm run prisma:seed
```

### 5. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Useful scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build (local; no DB migration) |
| `npm run vercel-build` | Vercel build: generate client, run migrations, build Next.js |
| `npm run lint` | ESLint |
| `npm run postinstall` | Generate Prisma Client (runs automatically after `npm install`) |
| `npm run prisma:migrate` | Create/apply migrations in development |
| `npm run prisma:migrate:deploy` | Apply migrations in production |
| `npm run prisma:seed` | Seed demo data |
| `npm run db:studio` | Open Prisma Studio |

## Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `AUTH_SECRET` | Yes | Auth.js session secret (`openssl rand -base64 32`) |
| `AUTH_URL` | Yes (production) | Canonical app URL, e.g. `https://your-app.vercel.app` |
| `OPENAI_API_KEY` | No | Enables live Moonie AI; mock mode used when unset |
| `OPENAI_MODEL` | No | OpenAI text model (default: `gpt-5.6-luna`) |
| `OPENAI_VISION_MODEL` | No | OpenAI vision model (default: `gpt-5.6-terra`) |
| `NEXTAUTH_URL` | No | Legacy alias for `AUTH_URL`; set both if auth issues occur |

Copy `.env.example` to `.env` locally. **Never commit `.env`**: it is gitignored.

## Deploy to Vercel

MoonVerse is configured for **Vercel** + **hosted PostgreSQL** (Neon, Supabase, Vercel Postgres, Railway, etc.).

### 1. Create a hosted PostgreSQL database

Choose a provider and create a database. Copy the connection string.

**Tips for serverless (Vercel):**

- Prefer a **pooled** connection string (Neon “Pooled”, Supabase “Transaction pooler”) for `DATABASE_URL`.
- Add `?sslmode=require` if SSL is required.
- For `prisma migrate deploy`, some providers need a **direct** (non-pooled) URL once; run migrations locally against that URL if the pooled URL fails during migrate.

### 2. Push code to GitHub

Ensure the repo includes `prisma/migrations/` (initial migration is committed).

See [docs/migrations.md](./docs/migrations.md) for known historical migration notes (Aug 18 browse placeholders, checksum drift).

### 3. Import project in Vercel

1. Go to [vercel.com](https://vercel.com) → **Add New Project** → import your GitHub repo.
2. Framework preset: **Next.js** (auto-detected).
3. Build command: leave default: Vercel runs the `vercel-build` script automatically when present.
4. Install command: `npm install` (default).

### 4. Add environment variables in Vercel

In **Project → Settings → Environment Variables**, add for **Production** (and Preview if desired):

| Name | Example value |
|------|---------------|
| `DATABASE_URL` | `postgresql://user:pass@host/db?sslmode=require` |
| `AUTH_SECRET` | *(output of `openssl rand -base64 32`)* |
| `AUTH_URL` | `https://your-app.vercel.app` |
| `OPENAI_API_KEY` | *(optional)* |
| `OPENAI_MODEL` | `gpt-5.6-luna` *(optional)* |
| `OPENAI_VISION_MODEL` | `gpt-5.6-terra` *(optional)* |

Redeploy after adding variables.

### 5. Deploy

Trigger a deploy (push to main or **Deploy** in Vercel). The `vercel-build` script will:

1. `prisma generate`
2. `prisma migrate deploy` (apply migrations to production DB)
3. `next build`

### 6. Seed the novel catalog

Migrations create empty tables. Seed once to load real web novel titles, authors, covers and reading links (no fake users or reviews):

```bash
# Option A: pull production env (requires Vercel CLI)
vercel env pull .env.production.local
DATABASE_URL="..." AUTH_SECRET="..." npm run prisma:seed

# Option B: paste production DATABASE_URL directly (use direct URL if pooled fails)
DATABASE_URL="postgresql://..." npm run prisma:seed
```

Register a real account after seeding. Promote an admin from `/admin` once you have an account (or set `role` in the database).

### 7. Verify

- Open `https://your-app.vercel.app`
- Register or log in with your own account
- Browse the real novel catalog and write reviews
- Test Moonie (heuristic mode without `OPENAI_API_KEY` still uses only real community reviews)

## Production security notes

- **Do not commit `.env`**: secrets belong only in Vercel environment variables or local `.env`.
- **Use a strong, unique `AUTH_SECRET`** for production: generate with `openssl rand -base64 32`.
- **Use a hosted PostgreSQL URL** with SSL; do not expose the database publicly without credentials.
- **Set `AUTH_URL`** to your exact production domain (including `https://`).
- **Moonie** ranks real community reviews without `OPENAI_API_KEY`; add the key only if you want live AI.
- Re-running `prisma:seed` **wipes users and reviews** and reloads the novel catalog: only run intentionally.

## Development dataset (optional)

For a large realistic production-load dataset with **original** (non-scraped) reviews:

```bash
npm run demo:load # generate full + seed Postgres (auto)
npm run demo:generate -- --batch 1 # 20 users / 200 novels / 400 reviews
npm run demo:generate -- --batch full
npm run prisma:seed:demo
```

- ~100 users, ~1000 real novels, ~2000 long-form original reviews (~800–1100 words)
- Every novel gets multiple reviews; verified official reading links only
- Do not scrape Goodreads, Amazon, NovelUpdates or Reddit review text
- Catalog-only seed remains: `npm run prisma:seed`

Demo admin login is printed at the end of `prisma:seed:demo` (password `Password123!`).

## Getting started locally

1. **Register** an account at `/register`
2. **Browse novels**: search and filter by genre
3. **Create a review**: `/reviews/new`
4. **Like & comment** on a review detail page
5. **Save to folder**: use the bookmark button on a review
6. **Follow a user**: open any profile
7. **Notifications**: bell icon or `/notifications`
8. **Moonie**: click the moon FAB (bottom-right)
9. **Settings**: `/settings` to edit profile

## Testing Moonie

- **Without `OPENAI_API_KEY`:** Moonie ranks real MoonVerse reviews (likes, saves, ratings). No invented novels.
- **With `OPENAI_API_KEY`:** Moonie calls OpenAI with user context (profile, likes, saves, genres, tags).
- **Rate limit:** 30 discovery requests per user per day (server-enforced). Casual chat is quota-free.
- Moonie only recommends novels: it does not write reviews.

## Testing folders

1. Log in and open **Folders** in the nav
2. Create a folder (name, description, public/private)
3. On any review, click **Save to Folder** and toggle folders
4. Open a folder to view saved reviews and remove items

## Testing notifications

Notifications are created when someone:

- Comments on your review
- Replies to your comment
- Likes your review
- Saves your review to a folder
- Follows you

Check the **bell icon** (latest 5) or **Notifications** page for the full list.

## Admin dashboard

Admins can open **`/admin`** from the navbar (Admin link) or directly.

Promote the first admin by setting a user’s `role` to `ADMIN` in the database (or via an existing admin in `/admin/users`).
| Route | Purpose |
|-------|---------|
| `/admin` | Overview stats, latest reviews/users, quick links |
| `/admin/users` | Search, promote/demote, suspend, safe delete |
| `/admin/reviews` | Search, filter by rating, delete |
| `/admin/comments` | Search, delete comments/replies |
| `/admin/novels` | CRUD novels, genres/tags on novel |
| `/admin/genres` | CRUD genres (delete if unused) |
| `/admin/tags` | CRUD tags (delete if unused) |
| `/admin/notifications` | Read-only notification log |
| `/admin/settings` | App name, DB status, environment |

Non-admins see a forbidden message. All admin mutations re-check role on the server. After promote/demote, affected users must sign in again for JWT role to update.

Apply schema changes locally:

```bash
npm run prisma:migrate
npm run prisma:seed
```

## Project structure (high level)

```
src/
├── app/ # Routes (pages, API)
├── actions/ # Server actions
├── components/ # UI components
├── lib/ # Auth, validation, Moonie helpers
├── services/ # Database access layer
└── types/ # Shared TypeScript types
```

## Known limitations

- No AI moderation, payments, or direct messages
- No activity feed or real-time admin updates
- Moonie uses context injection, not vector search / RAG
- Notification and Moonie rate limits are in-memory (reset on server restart)
- Email/username cannot be changed after registration
- Avatar URLs must be external links (no file upload)

## Licence

Academic project: see course submission requirements.
