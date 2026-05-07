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
      model: 'claude-haiku-4-5',
      max_tokens: 1000,
      system: `You are a corporate ethics scorer. Be critical. Large corps score 20-50/100.
If not a real company: {"isCompany":false}

CRITICAL RULES FOR JSON:
- Use ONLY double quotes
- NO apostrophes anywhere - write "does not" not "doesn't", "company is" not "company's"
- NO special characters in strings
- Keep all text values under 80 characters
- Return ONLY the JSON, nothing else

Format:
{"isCompany":true,"company":"Name","overall":30,"summary":"Short critical summary under 80 chars","categories":{"environment":{"score":25,"summary":"Short sentence"},"labor":{"score":30,"summary":"Short sentence"},"governance":{"score":25,"summary":"Short sentence"},"community":{"score":30,"summary":"Short sentence"},"transparency":{"score":20,"summary":"Short sentence"}},"keyIssues":[{"label":"Issue name","description":"Short description under 80 chars"},{"label":"Issue name","description":"Short description under 80 chars"},{"label":"Issue name","description":"Short description under 80 chars"}],"news":[{"title":"Short title","description":"Short description under 80 chars","type":"negative","url":"","year":"2024"},{"title":"Short title","description":"Short description under 80 chars","type":"negative","url":"","year":"2023"},{"title":"Short title","description":"Short description","type":"negative","url":"","year":"2023"},{"title":"Short title","description":"Short description","type":"positive","url":"","year":"2024"}]}`,
      messages: [{
        role: 'user',
        content: `Score: "${companyName}". No apostrophes. Short strings only.`
      }]
    })

    const textBlock = response.content.find((block: any) => block.type === 'text')
    if (!textBlock) throw new Error('No response')

    const text = (textBlock as any).text.trim()
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('No JSON found')

    let jsonStr = jsonMatch[0]
    jsonStr = jsonStr.replace(/[\n\r\t]/g, ' ')
    jsonStr = jsonStr.replace(/'/g, ' ')
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
