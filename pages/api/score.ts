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
      max_tokens: 800,
      system: `Corporate ethics investigator. Be critical and honest. Score LOW for companies with scandals.
RULES: Large corps score 20-50/100. Below 35 for major controversies. Never above 65 unless genuinely ethical.
If input is not a real company set isCompany to false.
Return ONLY JSON, no markdown, no backticks:
{"isCompany":true,"company":"Name","overall":30,"summary":"Critical summary","categories":{"environment":{"score":25,"summary":"sentence"},"labor":{"score":30,"summary":"sentence"},"governance":{"score":25,"summary":"sentence"},"community":{"score":30,"summary":"sentence"},"transparency":{"score":20,"summary":"sentence"}},"keyIssues":[{"label":"Short label","description":"One critical sentence about a known issue"},{"label":"Short label","description":"One critical sentence"},{"label":"Short label","description":"One critical sentence"}],"news":[{"title":"headline","description":"description","type":"negative","url":"","year":"2024"}]}
keyIssues must have exactly 3 items. news must have 4-5 items. type is negative or positive.`,
      messages: [{
        role: 'user',
        content: `Score ethics of: "${companyName}". Use known controversies and scandals. Be critical.`
      }]
    })

    const textBlock = response.content.find((block: any) => block.type === 'text')
    if (!textBlock) throw new Error('No response')

    const text = (textBlock as any).text.trim()
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('No JSON found')

   let jsonStr = jsonMatch[0]
jsonStr = jsonStr.replace(/[\n\r\t]/g, ' ')
jsonStr = jsonStr.replace(/,\s*}/g, '}')
jsonStr = jsonStr.replace(/,\s*]/g, ']')
jsonStr = jsonStr.replace(/([^\\])\\([^"\\\/bfnrtu])/g, '$1 $2')

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
