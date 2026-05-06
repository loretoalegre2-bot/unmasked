import { useState } from 'react'

type CategoryScore = {
  score: number
  summary: string
}

type ScoreResult = {
  company: string
  overall: number
  summary: string
  categories: {
    environment: CategoryScore
    labor: CategoryScore
    governance: CategoryScore
    community: CategoryScore
    transparency: CategoryScore
  }
}

function getColor(score: number): string {
  if (score >= 70) return '#22c55e'
  if (score >= 40) return '#f59e0b'
  return '#ef4444'
}

function getGrade(score: number): string {
  if (score >= 90) return 'A+'
  if (score >= 80) return 'A'
  if (score >= 70) return 'B'
  if (score >= 60) return 'C'
  if (score >= 50) return 'D'
  return 'F'
}

function ScoreBar({ score }: { score: number }) {
  return (
    <div style={{ background: '#e5e7eb', borderRadius: 999, height: 10, width: '100%', marginTop: 6 }}>
      <div style={{
        width: `${score}%`,
        background: getColor(score),
        height: '100%',
        borderRadius: 999,
        transition: 'width 0.6s ease'
      }} />
    </div>
  )
}

export default function Home() {
  const [company, setCompany] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ScoreResult | null>(null)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!company.trim()) return
    setLoading(true)
    setError('')
    setResult(null)

    try {
      const res = await fetch('/api/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyName: company.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Something went wrong')
      setResult(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const categoryLabels: Record<string, string> = {
    environment: '🌿 Environment',
    labor: '👷 Labor',
    governance: '⚖️ Governance',
    community: '🤝 Community',
    transparency: '🔍 Transparency',
  }

  return (
    <main style={{ minHeight: '100vh', background: '#0f172a', color: '#f8fafc', fontFamily: 'system-ui, sans-serif', padding: '40px 20px' }}>
      <div style={{ maxWidth: 640, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <h1 style={{ fontSize: 42, fontWeight: 800, margin: 0, letterSpacing: '-1px' }}>
            🎭 Unmasked
          </h1>
          <p style={{ color: '#94a3b8', marginTop: 8, fontSize: 16 }}>
            AI-powered ethical scorecard for any company
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 10, marginBottom: 32 }}>
          <input
            type="text"
            value={company}
            onChange={e => setCompany(e.target.value)}
            placeholder="Enter a company name (e.g. Apple, Amazon...)"
            style={{
              flex: 1, padding: '14px 18px', borderRadius: 12, border: '1px solid #334155',
              background: '#1e293b', color: '#f8fafc', fontSize: 16, outline: 'none'
            }}
          />
          <button
            type="submit"
            disabled={loading || !company.trim()}
            style={{
              padding: '14px 24px', borderRadius: 12, border: 'none', background: '#6366f1',
              color: 'white', fontWeight: 700, fontSize: 16, cursor: loading ? 'wait' : 'pointer',
              opacity: loading || !company.trim() ? 0.6 : 1
            }}
          >
            {loading ? '...' : 'Score'}
          </button>
        </form>

        {/* Error */}
        {error && (
          <div style={{ background: '#450a0a', border: '1px solid #ef4444', borderRadius: 12, padding: 16, color: '#fca5a5', marginBottom: 24 }}>
            ⚠️ {error}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div style={{ textAlign: 'center', color: '#94a3b8', padding: 40, fontSize: 18 }}>
            🔍 Analyzing {company}...
          </div>
        )}

        {/* Result */}
        {result && (
          <div style={{ background: '#1e293b', borderRadius: 16, padding: 28, border: '1px solid #334155' }}>

            {/* Overall Score */}
            <div style={{ textAlign: 'center', marginBottom: 28 }}>
              <div style={{ fontSize: 14, color: '#94a3b8', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 }}>
                Overall Ethical Score
              </div>
              <div style={{ fontSize: 80, fontWeight: 900, color: getColor(result.overall), lineHeight: 1 }}>
                {getGrade(result.overall)}
              </div>
              <div style={{ fontSize: 22, color: '#cbd5e1', marginTop: 4 }}>
                {result.overall}/100
              </div>
              <p style={{ color: '#94a3b8', marginTop: 12, lineHeight: 1.6, fontSize: 15 }}>
                {result.summary}
              </p>
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid #334155', marginBottom: 24 }} />

            {/* Category Scores */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              {Object.entries(result.categories).map(([key, val]) => (
                <div key={key}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 600, fontSize: 15 }}>{categoryLabels[key]}</span>
                    <span style={{ color: getColor(val.score), fontWeight: 700 }}>{val.score}/100</span>
                  </div>
                  <ScoreBar score={val.score} />
                  <p style={{ color: '#94a3b8', fontSize: 13, marginTop: 6, marginBottom: 0 }}>{val.summary}</p>
                </div>
              ))}
            </div>

          </div>
        )}

        <p style={{ textAlign: 'center', color: '#475569', marginTop: 40, fontSize: 13 }}>
          Scores are AI-generated estimates based on publicly available information.
        </p>
      </div>
    </main>
  )
}
