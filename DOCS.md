# Unmasked Notes

## Current Stack

- Next.js pages router app
- Single-page homepage in `pages/index.tsx`
- Scoring API in `pages/api/score.ts`
- Anthropic SDK-backed score generation

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
