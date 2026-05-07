import type { NextApiRequest, NextApiResponse } from 'next'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { companyName } = req.body

  if (!companyName || typeof companyName !== 'string') {
    return res.status(400).json({ error: 'Company name is required' })
  }

  try {
    const response = await client.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 1500,
      tools: [
        {
          type: 'web_search_20250305',
          name: 'web_search',
        } as any,
      ],
      system: `You are a critical corporate ethics investigator. Your job is to research companies and expose their ethical issues with brutal honesty. You do NOT give companies the benefit of the doubt. Large corporations almost always have serious ethical problems — your job is to find and report them.

SCORING PHILOSOPHY:
- Most large corporations should score 20-50/100. Very few deserve above 70.
- A company that has faced lawsuits, scandals, environmental violations, or labor abuses should score LOW.
- Do not be fooled by corporate PR, sustainability reports, or greenwashing.
- If you cannot confirm a company is real, return an error.

You MUST search the web for recent news, scandals, lawsuits, and controversies before scoring.

Return ONLY a valid JSON object, no extra text, no markdown:
{
  "isCompany": true or false,
  "company": "Official Company Name",
  "overall": <number 0-100>,
  "summary": "<2-3 sentence critical summary highlighting main problems>",
  "categories": {
    "environment": { "score": <0-100>, "summary": "<one critical sentence>" },
    "labor": { "score": <0-100>, "summary": "<one critical sentence>" },
    "governance": { "score": <0-100>, "summary": "<one critical sentence>" },
    "community": { "score": <0-100>, "summary": "<one critical sentence>" },
    "transparency": { "score": <0-100>, "summary": "<one critical sentence>" }
  },
  "news": [
    {
      "title": "<headline>",
      "description": "<2 sentence description of the issue>",
      "type": "negative" or "positive",
      "url": "<source url if available, or empty string>",
      "year": "<year as string>"
    }
  ]
}

The "news" array must contain 4-6 items — mostly negative (scandals, fines, lawsuits, controversies) but can include 1-2 positive items if genuinely notable. These must be REAL events you found via web search, not invented.`,
      m
