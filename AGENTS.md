<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes: APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Moonie client payloads

When building composer or chat request bodies (e.g. `/api/moonie/recommend`), **omit unused optional fields**. Do not send `null` for optional schema fields unless the API Zod schema explicitly allows `.nullable()`. Prefer `buildMoonieRecommendRequestBody` in `src/lib/moonie/recommend-request.ts` for logged-in Moonie chat requests.
