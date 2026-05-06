import type { NextApiRequest, NextApiResponse } from 'next'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
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
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are an ethical business analyst. When given a company name, you will research and score that company across 5 ethical dimensions. Return ONLY a valid JSON object with no extra text.

The JSON format must be exactly:
{
  "company": "Company Name",
  "overall": <number 0-100>,
  "summary": "<2-3 sentence overall summary>",
  "categories": {
    "environment": { "score": <0-100>, "summary": "<one sentence>" },
    "labor": { "score": <0-100>, "summary": "<one sentence>" },
    "governance": { "score": <0-100>, "summary": "<one sentence>" },
    "community": { "score": <0-100>, "summary": "<one sentence>" },
    "transparency": { "score": <0-100>, "summary": "<one sentence>" }
  }
}`
        },
        {
          role: 'user',
          content: `Score the ethical practices of this company: ${companyName}`
        }
      ],
      temperature: 0.7,
      max_tokens: 800,
    })

    const raw = completion.choices[0].message.content || ''
    const parsed = JSON.parse(raw)
    return res.status(200).json(parsed)

  } catch (error) {
    console.error('OpenAI error:', error)
    return res.status(500).json({ error: 'Failed to generate score. Please try again.' })
  }
}
