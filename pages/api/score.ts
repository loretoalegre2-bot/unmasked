import type { NextApiRequest, NextApiResponse } from 'next'
import Anthropic from '@anthropic-ai/sdk'

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY
const MODEL = process.env.ANTHROPIC_MODEL ?? 'claude-3-5-sonnet-20240620'

const client = ANTHROPIC_API_KEY
  ? new Anthropic({
      apiKey: ANTHROPIC_API_KEY,
      maxRetries: 0,
      timeout: 20_000,
    })
  : null

function getCompanyName(body: NextApiRequest['body']) {
  if (typeof body?.companyName === 'string' && body.companyName.trim()) {
    return body.companyName.trim()
  }

  if (typeof body?.company === 'string' && body.company.trim()) {
    return body.company.trim()
  }

  return ''
}

function extractJsonPayload(text: string) {
  const jsonMatch = text.match(/\{[\s\S]*\}/)

  if (!jsonMatch) {
    throw new Error('No JSON found in response')
  }

  return jsonMatch[0]
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, ' ')
    .replace(/\t/g, ' ')
    .replace(/\n/g, ' ')
    .replace(/\r/g, ' ')
    .replace(/,\s*}/g, '}')
    .replace(/,\s*]/g, ']')
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const companyName = getCompanyName(req.body)

  if (!companyName) {
    return res.status(400).json({ error: 'Company name is required via "company" or "companyName".' })
  }

  if (!client) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY is not configured.' })
  }

  try {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 1400,
      temperature: 0.2,
      system: `You are a critical corporate ethics investigator. Evaluate a company using broadly known public information and return a compact ethics scorecard. Do not invent citations, events, or numbers.

SCORING: Most large corporations should score 20-50/100. Very few deserve above 70. Score LOW for companies with lawsuits, scandals, violations. If not a real company, set isCompany to false.

CRITICAL: Your final response must be ONLY a JSON object. No text before or after. No markdown. No backticks. Use double quotes only. No apostrophes in values - replace with spaces. Keep all text values short and simple.

JSON format:
{"isCompany":true,"company":"Name","overall":35,"summary":"Short summary without apostrophes","categories":{"environment":{"score":30,"summary":"Short sentence"},"labor":{"score":30,"summary":"Short sentence"},"governance":{"score":30,"summary":"Short sentence"},"community":{"score":30,"summary":"Short sentence"},"transparency":{"score":30,"summary":"Short sentence"}},"news":[{"title":"Short title","description":"Short description","type":"negative","url":"","year":"2024"}]}`,
      messages: [{
        role: 'user',
        content: `Evaluate "${companyName}" ethics. Focus on scandals, labor issues, environmental harm, governance failures, community impact, and transparency. If you are unsure the company is real, set isCompany to false. Respond with ONLY the JSON object, nothing else.`
      }]
    })

    const allText = response.content
      .filter((block: any) => block.type === 'text')
      .map((block: any) => block.text)
      .join(' ')

    if (!allText) throw new Error('No text response')

    const parsed = JSON.parse(extractJsonPayload(allText))

    if (!parsed.isCompany) {
      return res.status(400).json({ error: `"${companyName}" does not appear to be a real company.` })
    }

    return res.status(200).json(parsed)

  } catch (error: any) {
    console.error('Anthropic score generation failed', {
      message: error?.message,
      name: error?.name,
      status: error?.status,
    })
    return res.status(500).json({ error: 'Failed to generate report. Please try again.' })
  }
}
