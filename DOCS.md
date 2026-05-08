# Unmasked Notes

## Current Stack

- Next.js pages router app
- Single-page homepage in `pages/index.tsx`
- Scoring API in `pages/api/score.ts`
- OpenAI SDK-backed score generation with fallback handling

## Task History

### 2026-05-07 — API `/api/score` debugging

- Confirmed the Vercel production project is `unmasked` with primary production alias `unmasked-co.vercel.app`
- Confirmed the latest production deployment (`dpl_EiT2aFYMvcK3TnHE9gctuHTKFfzU`) built successfully with no Vercel build errors
- Confirmed `OPENAI_API_KEY` is not present in the Vercel project env list; the only AI secret configured is `ANTHROPIC_API_KEY` for `preview` and `production`
- Verified the app is not using `OPENAI_API_KEY`; the route imports `@anthropic-ai/sdk` and reads `process.env.ANTHROPIC_API_KEY`
- Reproduced the production failure:
  - `POST /api/score` with `{"company":"Apple"}` returns `500 {"error":"Failed to generate report. Please try again."}`
  - `POST /api/score` with `{"companyName":"Apple"}` returns the same `500`
- Root cause:
  - The app was never wired to OpenAI, so adding `OPENAI_API_KEY` could not fix the route
  - `pages/api/score.ts` used `@anthropic-ai/sdk@0.24.0` with an unsupported built-in tool payload (`type: "web_search_20250305"`), which causes the Anthropic request to fail at runtime
- Fix applied:
  - `pages/api/score.ts` keeps support for both `company` and `companyName`
  - Removed the unsupported Anthropic built-in web-search tool call
  - Switched the default model path to `ANTHROPIC_MODEL ?? "claude-3-5-sonnet-20240620"` for compatibility with the installed SDK/API contract
  - Added explicit missing-key handling and cleaner JSON extraction/logging for runtime diagnostics
  - Added a non-500 fallback scorecard response when the Anthropic call fails, so the live API and UI stay functional while the upstream provider issue is repaired

### 2026-05-08 — OpenAI migration for `/api/score`

- Confirmed the target repo is `loretoalegre2-bot/unmasked` and the relevant route is `pages/api/score.ts`
- Replaced the Anthropic SDK integration with the `openai` package and `new OpenAI({ apiKey: process.env.OPENAI_API_KEY })`
- Switched the provider/model to `gpt-4o`
- Updated the route prompt to request a JSON scorecard with:
  - `company`
  - `overall`
  - `categories.environment|labor|governance|controversies|transparency`
  - `summary`
  - `sources`
- Added response normalization so malformed or partial model output is repaired instead of crashing the route
- Kept a logged fallback response for provider and parsing failures; only fallback responses include `fallback: true`
- Updated the homepage fetch payload to send `company` while preserving server support for legacy `companyName`
- Updated homepage category typing/labels from `community` to `controversies` to match the new scorecard contract
- Added `.gitignore`, `tsconfig.json`, `next-env.d.ts`, and `package-lock.json` so the TypeScript Next.js app builds reproducibly on Vercel
- Verified locally that:
  - `POST /api/score` accepts both `{"company":"Nestle"}` and `{"companyName":"Nestle"}`
  - missing `OPENAI_API_KEY` now returns a logged `200` fallback scorecard instead of a `500`
- Verified production after push to `main`:
  - deployment with commit `99e0f21` reached `READY`
  - `https://unmasked-co.vercel.app/api/score` is serving the new OpenAI-based code path
  - production still returns the fallback payload because the Vercel project env list contains `ANTHROPIC_API_KEY` and `GEMINI_API_KEY`, but no `OPENAI_API_KEY`
