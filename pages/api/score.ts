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
      system: `You are a critical corporate ethics investigator. Research companies and expose ethical issues with brutal honesty. Large corporations almost always have serious ethical problems.

SCORING: Most large corporations should score 20-50/100. Very few deserve above 70. Score LOW for companies with lawsuits, scandals, violations. If not a real company, set isCompany to false.

CRITICAL: Your final response must be ONLY a JSON object. No text before or after. No markdown. No backticks. Use double quotes only. No apostrophes in values - replace with spaces. Keep all text values short and simple.

JSON format:
{"isCompany":true,"company":"Name","overall":35,"summary":"Short summary without apostrophes","categories":{"environment":{"score":30,"summary":"Short sentence"},"labor":{"score":30,"summary":"Short sentence"},"governance":{"score":30,"summary":"Short sentence"},"community":{"score":30,"summary":"Short sentence"},"transparency":{"score":30,"summary":"Short sentence"}},"news":[{"title":"Short title","description":"Short description","type":"negative","url":"","year":"2024"}]}`,
      messages: [{
        role: 'user',
        content: `Research "${companyName}" ethics. Search for scandals and controversies. Respond with ONLY the JSON object, nothing else.`
      }]
    })

    const allText = response.content
      .filter((block: any) => block.type === 'text')
      .map((block: any) => block.text)
      .join(' ')

    if (!allText) throw new Error('No text response')

    const jsonMatch = allText.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('No JSON found in response')

    let jsonStr = jsonMatch[0]
    jsonStr = jsonStr.replace(/[\u0000-\u001F\u007F-\u009F]/g, ' ')
    jsonStr = jsonStr.replace(/\t/g, ' ')
    jsonStr = jsonStr.replace(/\n/g, ' ')
    jsonStr = jsonStr.replace(/\r/g, ' ')
    jsonStr = jsonStr.replace(/,\s*}/g, '}')
    jsonStr = jsonStr.replace(/,\s*]/g, ']')

    const parsed = JSON.parse(jsonStr)

    if (!parsed.isCompany) {
      return res.status(400).json({ error: `"${companyName}" does not appear to be a real company.` })
    }

    return res.status(200).json(parsed)

  } catch (error: any) {
    console.error('Error:', error)
    return res.status(500).json({ error: 'Failed to generate report. Please try again.' })
  }
}
