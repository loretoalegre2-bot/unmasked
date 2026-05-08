import type { NextApiRequest, NextApiResponse } from 'next'
import OpenAI from 'openai'

type ScoreCategory = {
  score: number
  summary: string
}

type Scorecard = {
  company: string
  overall: number
  categories: {
    environment: ScoreCategory
    labor: ScoreCategory
    governance: ScoreCategory
    controversies: ScoreCategory
    transparency: ScoreCategory
  }
  summary: string
  sources: string[]
  fallback?: true
}

const MODEL_NAME = 'gpt-4o'
const DEFAULT_CATEGORY_SUMMARY = 'No category-specific detail was returned.'
const FALLBACK_SUMMARY =
  'A temporary model issue prevented a live ethics analysis, so this scorecard uses conservative placeholder estimates.'

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null

function normalizeCompany(value: unknown) {
  return typeof value === 'string' ? value.trim().slice(0, 120) : ''
}

function clampScore(value: unknown, fallback = 0) {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return fallback
  }

  return Math.max(0, Math.min(100, Math.round(value)))
}

function normalizeSummary(value: unknown, fallback: string) {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback
}

function normalizeSources(value: unknown) {
  if (!Array.isArray(value)) {
    return []
  }

  return value
    .filter((entry): entry is string => typeof entry === 'string')
    .map((entry) => entry.trim())
    .filter(Boolean)
    .slice(0, 8)
}

function normalizeCategory(value: unknown, fallbackScore: number): ScoreCategory {
  if (!value || typeof value !== 'object') {
    return {
      score: fallbackScore,
      summary: DEFAULT_CATEGORY_SUMMARY,
    }
  }

  const category = value as Record<string, unknown>

  return {
    score: clampScore(category.score, fallbackScore),
    summary: normalizeSummary(category.summary, DEFAULT_CATEGORY_SUMMARY),
  }
}

function normalizeScorecard(payload: unknown, requestedCompany: string): Scorecard {
  if (!payload || typeof payload !== 'object') {
    throw new Error('OpenAI returned a non-object payload.')
  }

  const raw = payload as Record<string, unknown>
  const overall = clampScore(raw.overall, 50)
  const categories =
    raw.categories && typeof raw.categories === 'object'
      ? (raw.categories as Record<string, unknown>)
      : {}

  const categoryMap = {
    environment: normalizeCategory(categories.environment, overall),
    labor: normalizeCategory(categories.labor, overall),
    governance: normalizeCategory(categories.governance, overall),
    controversies: normalizeCategory(categories.controversies, overall),
    transparency: normalizeCategory(categories.transparency, overall),
  }

  return {
    company: normalizeCompany(raw.company) || requestedCompany,
    overall,
    categories: categoryMap,
    summary: normalizeSummary(
      raw.summary,
      `${requestedCompany} has a mixed public record and should be reviewed more closely before relying on this score.`,
    ),
    sources: normalizeSources(raw.sources),
  }
}

function createFallbackScorecard(company: string): Scorecard {
  const overall = 48

  console.warn(`[api/score] Using fallback scorecard for ${company}`)

  return {
    company,
    overall,
    summary: FALLBACK_SUMMARY,
    categories: {
      environment: {
        score: 46,
        summary: 'Environmental reporting could not be refreshed live.',
      },
      labor: {
        score: 49,
        summary: 'Labor conditions need a real-time review once the model call succeeds.',
      },
      governance: {
        score: 50,
        summary: 'Governance concerns are estimated because live analysis is unavailable.',
      },
      controversies: {
        score: 43,
        summary: 'Known controversies could not be re-evaluated in this request.',
      },
      transparency: {
        score: 52,
        summary: 'Transparency signals are provisional until a live response is available.',
      },
    },
    sources: [],
    fallback: true,
  }
}

async function generateScorecard(company: string) {
  if (!openai) {
    throw new Error('OPENAI_API_KEY is not configured.')
  }

  const response = await openai.chat.completions.create({
    model: MODEL_NAME,
    temperature: 0.2,
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content:
          'You are Unmasked, a corporate ethics analyst. Return valid JSON only. Use plain text. Do not wrap JSON in markdown.',
      },
      {
        role: 'user',
        content: `Create a JSON ethics scorecard for the company "${company}" with this exact shape:
{
  "company": "${company}",
  "overall": 0,
  "categories": {
    "environment": { "score": 0, "summary": "..." },
    "labor": { "score": 0, "summary": "..." },
    "governance": { "score": 0, "summary": "..." },
    "controversies": { "score": 0, "summary": "..." },
    "transparency": { "score": 0, "summary": "..." }
  },
  "summary": "2-3 sentence plain text summary",
  "sources": ["source 1", "source 2"]
}

Rules:
- overall and all category scores must be integers from 0 to 100
- be evidence-aware and critical where public reporting supports it
- summary must be 2 to 3 plain-text sentences
- each category summary should be 1 sentence
- sources must be plain strings with recognizable publications, reports, or URLs
- if information is limited, still provide the best cautious scorecard you can from broadly known public reporting`,
      },
    ],
  })

  const content = response.choices[0]?.message?.content?.trim()

  if (!content) {
    throw new Error('OpenAI returned an empty response.')
  }

  return normalizeScorecard(JSON.parse(content), company)
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const company = normalizeCompany(req.body?.company ?? req.body?.companyName)

  if (!company) {
    return res.status(400).json({ error: 'Company name is required' })
  }

  try {
    const scorecard = await generateScorecard(company)
    return res.status(200).json(scorecard)
  } catch (error) {
    console.error('[api/score] Failed to generate OpenAI scorecard:', error)
    return res.status(200).json(createFallbackScorecard(company))
  }
}
