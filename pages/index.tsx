import { useState } from 'react'

type NewsItem = {
  title: string
  description: string
  type: 'negative' | 'positive'
  url: string
  year: string
}

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
  news: NewsItem[]
}

function getGrade(score: number): string {
  if (score >= 90) return 'A+'
  if (score >= 80) return 'A'
  if (score >= 70) return 'B'
  if (score >= 60) return 'C'
  if (score >= 50) return 'D'
  return 'F'
}

function getScoreColor(score: number): string {
  if (score >= 70) return '#15803d'
  if (score >= 40) return '#b45309'
  return '#b91c1c'
}

function getScoreBg(score: number): string {
  if (score >= 70) return '#f0fdf4'
  if (score >= 40) return '#fffbeb'
  return '#fef2f2'
}

function getBarColor(score: number): string {
  if (score >= 70) return '#16a34a'
  if (score >= 40) return '#d97706'
  return '#dc2626'
}

const catLabels: Record<string, string> = {
  environment: 'Environment',
  labor: 'Labor',
  governance: 'Governance',
  community: 'Community',
  transparency: 'Transparency',
}

const globalStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Mono:ital,wght@0,400;0,500;1,400&family=DM+Sans:wght@300;400;500&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { background: #fafaf9; color: #1c1917; font-family: 'DM Sans', sans-serif; min-height: 100vh; }
  input::placeholder { color: #a8a29e; }
  @keyframes pulse { 0%,100%{opacity:0.4} 50%{opacity:1} }
  @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
  .tag-btn:hover { border-color: #c0392b !important; color: #c0392b !important; }
  .search-btn:hover { background: #9b1c1c !important; }
  .back-btn:hover { color: #1c1917 !important; }
  .news-link:hover { text-decoration: underline; }
  a { color: inherit; text-decoration: none; }
`

const mono = "'DM Mono', monospace"
const bebas = "'Bebas Neue', sans-serif"

export default function Home() {
  const [company, setCompany] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ScoreResult | null>(null)
  const [error, setError] = useState('')
  const [view, setView] = useState<'home' | 'results'>('home')

  async function doSearch(name: string) {
    if (!name.trim()) return
    setLoading(true)
    setError('')
    setResult(null)
    try {
      const res = await fetch('/api/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyName: name.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Something went wrong')
      setResult(data)
      setView('results')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    doSearch(company)
  }

  function quickSearch(name: string) {
    setCompany(name)
    doSearch(name)
  }

  function goHome() {
    setView('home')
    setResult(null)
    setError('')
    setCompany('')
  }

  // LOADING
  if (loading) return (
    <>
      <style dangerouslySetInnerHTML={{ __html: globalStyles }} />
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: 20, background: '#fafaf9' }}>
        <div style={{ fontFamily: bebas, fontSize: 64, color: '#1c1917', animation: 'pulse 1.8s ease-in-out infinite', letterSpacing: '0.05em' }}>
          {company.toUpperCase()}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 14, height: 14, border: '2px solid #e7e5e4', borderTopColor: '#b91c1c', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          <span style={{ fontFamily: mono, fontSize: 11, letterSpacing: '0.18em', color: '#78716c', textTransform: 'uppercase' }}>
            Investigating ethics profile...
          </span>
        </div>
        <p style={{ fontFamily: mono, fontSize: 10, color: '#d6d3d1', letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 8 }}>
          Searching news & public records
        </p>
      </div>
    </>
  )

  // RESULTS
  if (view === 'results' && result) return (
    <>
      <style dangerouslySetInnerHTML={{ __html: globalStyles }} />
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#fafaf9' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 48px', borderBottom: '1px solid #e7e5e4', background: '#fff', position: 'sticky', top: 0, zIndex: 10 }}>
          <span
            onClick={goHome}
            style={{ fontFamily: bebas, fontSize: 22, letterSpacing: '0.08em', color: '#1c1917', cursor: 'pointer' }}
          >
            UNMASKED
          </span>
          <button
            onClick={goHome}
            className="back-btn"
            style={{ fontFamily: mono, fontSize: 11, letterSpacing: '0.12em', color: '#a8a29e', textTransform: 'uppercase', background: 'none', border: '1px solid #e7e5e4', cursor: 'pointer', padding: '8px 16px' }}
          >
            ← New search
          </button>
        </div>

        <div style={{ maxWidth: 800, margin: '0 auto', width: '100%', padding: '48px 32px 80px' }}>

          {/* Company name + overall grade */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32, gap: 24, flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontFamily: mono, fontSize: 10, letterSpacing: '0.2em', color: '#a8a29e', textTransform: 'uppercase', marginBottom: 10 }}>
                Ethics Report
              </div>
              <div style={{ fontFamily: bebas, fontSize: 'clamp(42px, 8vw, 84px)', lineHeight: 0.95, color: '#1c1917' }}>
                {result.company.toUpperCase()}
              </div>
            </div>
            <div style={{ background: getScoreBg(result.overall), padding: '18px 28px', display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 110, border: `1px solid ${getScoreColor(result.overall)}22` }}>
              <div style={{ fontFamily: bebas, fontSize: 60, lineHeight: 1, color: getScoreColor(result.overall) }}>
                {getGrade(result.overall)}
              </div>
              <div style={{ fontFamily: mono, fontSize: 12, color: getScoreColor(result.overall), letterSpacing: '0.08em', marginTop: 2 }}>
                {result.overall}/100
              </div>
            </div>
          </div>

          {/* Summary */}
          <div style={{ fontSize: 15, lineHeight: 1.8, color: '#44403c', marginBottom: 40, padding: '18px 20px', background: '#fff', border: '1px solid #e7e5e4', borderLeft: '3px solid #1c1917' }}>
            {result.summary}
          </div>

          {/* Category scores — compact */}
          <div style={{ fontFamily: mono, fontSize: 10, letterSpacing: '0.2em', color: '#a8a29e', textTransform: 'uppercase', marginBottom: 16 }}>
            Score breakdown
          </div>
          <div style={{ background: '#fff', border: '1px solid #e7e5e4', marginBottom: 48 }}>
            {Object.entries(result.categories).map(([key, val], i) => (
              <div key={key} style={{ padding: '14px 20px', borderTop: i > 0 ? '1px solid #f5f5f4' : 'none', display: 'grid', gridTemplateColumns: '130px 1fr 48px', alignItems: 'center', gap: 16 }}>
                <span style={{ fontFamily: mono, fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#78716c' }}>
                  {catLabels[key]}
                </span>
                <div style={{ height: 3, background: '#f5f5f4' }}>
                  <div style={{ height: '100%', width: `${val.score}%`, background: getBarColor(val.score), transition: 'width 1s cubic-bezier(0.4,0,0.2,1)' }} />
                </div>
                <span style={{ fontFamily: mono, fontSize: 12, color: getScoreColor(val.score), textAlign: 'right', fontWeight: 500 }}>
                  {val.score}
                </span>
              </div>
            ))}
          </div>

          {/* News / Evidence */}
          <div style={{ fontFamily: mono, fontSize: 10, letterSpacing: '0.2em', color: '#a8a29e', textTransform: 'uppercase', marginBottom: 16 }}>
            Evidence & news
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {result.news && result.news.map((item, i) => (
              <div key={i} style={{ background: '#fff', border: '1px solid #e7e5e4', borderLeft: `3px solid ${item.type === 'negative' ? '#dc2626' : '#16a34a'}`, padding: '16px 20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 500, color: item.type === 'negative' ? '#b91c1c' : '#15803d' }}>
                      {item.type === 'negative' ? '↓' : '↑'}
                    </span>
                    <span style={{ fontSize: 14, fontWeight: 500, color: '#1c1917', lineHeight: 1.4 }}>
                      {item.title}
                    </span>
                  </div>
                  {item.year && (
                    <span style={{ fontFamily: mono, fontSize: 10, color: '#a8a29e', letterSpacing: '0.1em', whiteSpace: 'nowrap', marginTop: 2 }}>
                      {item.year}
                    </span>
                  )}
                </div>
                <p style={{ fontSize: 13, color: '#78716c', lineHeight: 1.6, marginBottom: item.url ? 8 : 0 }}>
                  {item.description}
                </p>
                {item.url && (
                  <a href={item.url} target="_blank" rel="noopener noreferrer" className="news-link" style={{ fontFamily: mono, fontSize: 10, color: '#a8a29e', letterSpacing: '0.05em' }}>
                    View source →
                  </a>
                )}
              </div>
            ))}
          </div>

          <p style={{ fontFamily: mono, fontSize: 10, color: '#d6d3d1', letterSpacing: '0.1em', marginTop: 40, textTransform: 'uppercase', lineHeight: 1.8 }}>
            Scores and news are AI-generated based on web research. May contain inaccuracies — always verify with primary sources.
          </p>
        </div>
      </div>
    </>
  )

  // HOME
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: globalStyles }} />
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>

        <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 48px', borderBottom: '1px solid #e7e5e4', background: '#fff' }}>
          <span style={{ fontFamily: mono, fontSize: 10, letterSpacing: '0.2em', color: '#a8a29e', textTransform: 'uppercase' }}>UNMSK_001</span>
          <span style={{ fontFamily: mono, fontSize: 10, letterSpacing: '0.1em', color: '#b91c1c', border: '1px solid #b91c1c', padding: '3px 8px', textTransform: 'uppercase' }}>Beta</span>
        </nav>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '60px 48px 40px', maxWidth: 860, margin: '0 auto', width: '100%' }}>

          <div style={{ fontFamily: mono, fontSize: 11, letterSpacing: '0.2em', color: '#b91c1c', textTransform: 'uppercase', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ display: 'block', width: 28, height: 1, background: '#b91c1c' }} />
            Corporate Ethics Intelligence
          </div>

          <h1 style={{ fontFamily: bebas, fontSize: 'clamp(80px, 14vw, 156px)', lineHeight: 0.9, letterSpacing: '-0.02em', color: '#1c1917', marginBottom: 20 }}>
            UNMASKED
          </h1>

          <p style={{ fontSize: 15, color: '#78716c', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 48, fontWeight: 300 }}>
            The corporate ethics search engine
          </p>

          {error && (
            <div style={{ border: '1px solid #fca5a5', background: '#fef2f2', padding: '14px 18px', marginBottom: 20, fontFamily: mono, fontSize: 12, color: '#b91c1c', letterSpacing: '0.03em' }}>
              ⚠ &nbsp;{error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', border: '1px solid #d6d3d1', background: '#fff', marginBottom: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <span style={{ fontFamily: mono, fontSize: 14, color: '#b91c1c', padding: '0 16px', display: 'flex', alignItems: 'center', borderRight: '1px solid #e7e5e4' }}>›</span>
            <input
              type="text"
              value={company}
              onChange={e => setCompany(e.target.value)}
              placeholder="Search any company..."
              style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#1c1917', fontFamily: mono, fontSize: 13, padding: '18px 20px', letterSpacing: '0.03em' }}
            />
            <button
              type="submit"
              className="search-btn"
              style={{ background: '#b91c1c', border: 'none', color: '#fff', fontFamily: mono, fontSize: 11, letterSpacing: '0.15em', textTransform: 'uppercase', padding: '0 28px', cursor: 'pointer' }}
            >
              Search
            </button>
          </form>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontFamily: mono, fontSize: 10, letterSpacing: '0.15em', color: '#a8a29e', textTransform: 'uppercase' }}>Try:</span>
            {['Nestlé', 'Shell', 'Amazon', 'Shein', 'Foxconn', 'Total'].map(name => (
              <button
                key={name}
                onClick={() => quickSearch(name)}
                className="tag-btn"
                style={{ fontFamily: mono, fontSize: 11, letterSpacing: '0.06em', color: '#78716c', border: '1px solid #e7e5e4', padding: '6px 14px', cursor: 'pointer', textTransform: 'uppercase', background: '#fff' }}
              >
                {name}
              </button>
            ))}
          </div>
        </div>

        <div style={{ borderTop: '1px solid #e7e5e4', padding: '16px 48px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff' }}>
          <span style={{ fontFamily: mono, fontSize: 10, letterSpacing: '0.12em', color: '#a8a29e', textTransform: 'uppercase' }}>
            Follow the money. Expose the truth.
          </span>
          <div style={{ display: 'flex', gap: 20 }}>
            {['Environment', 'Labor', 'Governance', 'Transparency'].map(c => (
              <span key={c} style={{ fontFamily: mono, fontSize: 10, letterSpacing: '0.1em', color: '#d6d3d1', textTransform: 'uppercase' }}>○ {c}</span>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
