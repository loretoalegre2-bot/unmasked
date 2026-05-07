# Unmasked Notes

## Current Stack

- Next.js pages router app
- Single-page homepage in `pages/index.tsx`
- Scoring API in `pages/api/score.ts`
- Anthropic SDK-backed score generation

## Task History

### 2026-05-07 — API `/api/score` debugging

- Confirmed the Vercel production project is `unmasked` with primary production alias `unmasked-co.vercel.app`
- Confirmed the deployment itself is healthy and the protected production API works when called with the expected request shape
- Verified the app is not using `OPENAI_API_KEY`; the route imports `@anthropic-ai/sdk` and reads `process.env.ANTHROPIC_API_KEY`
- Verified the production deployment is protected by Vercel authentication and requires an automation bypass token for direct API testing
- Reproduced the live mismatch:
  - `POST /api/score` with `{"companyName":"Apple"}` returns a valid score payload
  - `POST /api/score` with `{"company":"Apple"}` returns `400 {"error":"Company name is required"}`
- Root cause for the failing smoke test: the API only accepted `companyName`, while the required test payload uses `company`
- Fix applied:
  - `pages/api/score.ts` now accepts both `company` and `companyName`
  - This preserves backward compatibility for the existing UI while matching the required API contract
