import type { NextApiRequest, NextApiResponse } from 'next'

const GEMINI_API_KEY = process.env.GEMINI_API_KEY

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { companyName } = req.body

  if (!companyName || typeof companyName !== 'string') {
    return res.status(400).json({ error: 'Company name is required' })
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tools: [{ google_search: {} }],
          contents: [{
            role: 'user',
            parts: [{
              text: `You are a critical corporate ethics investigator. Research "${companyName}" and expose ethical issues with brutal honesty.

First verify this is a real company. If not, respond with exactly: {"isCompany":false}

Search for recent scandals, lawsuits, environmental violations, labor abuses, and controversies.

SCORING RULES:
- Most large corporations score 20-50/100
- Companies with major scandals score 15-35/100  
- Very few deserve above 65/100
- Be critical, do not be fooled by PR or greenwashing

Respond with ONLY a JSON object, no markdown, no backticks, no extra text:
{"isCompany":true,"company":"Official Name","overall":30,"summary":"Critical 2-3 sentence summary of main problems","categories":{"environment":{"score":25,"summary":"One critical sentence"},"labor":{"score":30,"summary":"One critical sentence"},"governance":{"score":25,"summary":"One critical sentence"},"community":{"score":30,"summary":"One critical sentence"},"transparency":{"score":20,"summary":"One critical sentence"}},"news":[{"title":"Headline","description":"Two sentence description of real event","type":"negative","url":"","year":"2024"},{"title":"Headline","description":"Two sentence description","type":"negative","url":"","year":"2023"},{"title":"Headline","description":"Two sentence description","type":"negative","url":"","year":"2023"},{"title":"Headline","description":"Two sentence description","type":"positive","url":"","year":"2024"}]}`
            }]
          }],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 1500,
          }
        })
      }
    )

    const data = await response.json()

    if (!response.ok) {
      console.error('Gemini error:', data)
      throw new Error(data.error?.message || 'Gemini API error')
    }

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text
    if (!text) throw new Error('No text response from Gemini')

    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('No JSON found in response')

    let jsonStr = jsonMatch[0]
    jsonStr = jsonStr.replace(/[\u0000-\u001F\u007F-\u009F]/g, ' ')
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
