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
      model: 'claude-sonnet-4-5',
      max_tokens: 1500,
      tools: [{ type: 'web_search_20250305', name: 'web_search' } as any],
      system: `You are a critical corporate ethics investigator. Research companies and expose ethical issues with brutal honesty. Do NOT give companies the benefit of the doubt. Large corporations almost always have serious ethical problems.

SCORING: Most large corporations should score 20-50/100. Very few deserve above 70. Companies with lawsuits, scandals, environmental violations, or labor abuses should score LOW. Do not be fooled by corporate PR or greenwashing. If you cannot confirm a company is real, set isCompany to false.

Search the web for recent news, scandals, lawsuits, and controversies before scoring.

Return ONLY valid JSON, no extra text, no markdown:
{"isCompany":true,"company":"Name","overall":0,"summary":"summary","categories":{"environment":{"score":0,"summary":""},"labor":{"score":0,"summary":""},"governance":{"score":0,"summary":""},"community":{"score":0,"summary":""},"transparency":{"score":0,"summary":""}},"news":[{"title":"","description":"","type":"negative","url":"","year":""}]}

news must have 4-6 REAL items from web search, mostly negative. type is "negative" or "positive".`,
      messages: [{
        role: 'user',
        content: `Research and score: "${companyName}". Verify it is a real company first. Search for scandals, lawsuits, environmental violations, labor abuses. Be critical and honest.`
      }]
    })

    const textBlock = response.content.find((block: any) => block.type === 'text')
    if (!textBlock || textBlock.type !== 'text') {
      throw new Error('No text response from Claude')
    }

    const raw = (textBlock as any).text.trim()
    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('No JSON found in response')

    const parsed = JSON.parse(jsonMatch[0])

    if (!parsed.isCompany) {
      return res.status(400).json({ error: `"${companyName}" does not appear to be a real company.` })
    }

    return res.status(200).json(parsed)

  } catch (error: any) {
    console.error('Claude API error:', error)
    return res.status(500).json({ error: 'Failed to generate report. Please try again.' })
  }
}
