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
  if (score >= 70) return '#27ae60'
  if (score >= 40) return '#e67e22'
  return '#c0392b'
}

function getGrade(score: number): string {
  if (score >= 90) return 'A+'
  if (score >= 80) return 'A'
  if (score >= 70) return 'B'
  if (score >= 60) return 'C'
  if (score >= 50) return 'D'
  return 'F'
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
  body { background: #0a0a0a; color: #e8e2d9; font-family: 'DM Sans', sans-serif; min-height: 100vh; }
  input::placeholder { color: #333; }
  button { transition: all 0.15s; }
  @keyframes pulse { 0%,100%{opacity:0.3} 50%{opacity:0.8} }
`

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

  const mono = "'DM Mono', monospace"
  const bebas = "'Bebas Neue', sans-serif"

  if (loading) return (
    <>
      <style dangerouslySetInnerHTML={{ __html: globalStyles }} />
      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:'100vh', gap:16 }}>
        <div style={{ fontFamily:bebas, fontSize:72, color:'#e8e2d9', animation:'pulse 1.5s ease-in-out infinite', letterSpacing:'0.05em' }}>
          {company.toUpperCase()}
        </div>
        <div style={{ fontFamily:mono, fontSize:11, letterSpacing:'0.2em', color:'#c0392b', textTransform:'uppercase', animation:'pulse 1.5s ease-in-out infinite 0.3s' }}>
          Analyzing ethics profile...
        </div>
      </div>
    </>
  )

  if (view === 'results' && result) return (
    <>
      <style dangerouslySetInnerHTML={{ __html: globalStyles }} />
      <div style={{ display:'flex', flexDirection:'column', minHeight:'100vh' }}>

        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'20px 48px', borderBottom:'1px solid #1e1e1e' }}>
          <span style={{ fontFamily:bebas, fontSize:28, letterSpacing:'0.05em' }}>UNMASKED</span>
          <button onClick={goHome} style={{ fontFamily:mono, fontSize:11, letterSpacing:'0.12em', color:'#555', textTransform:'uppercase', background:'none', border:'none', cursor:'pointer' }}>
            ← New search
          </button>
        </div>

        <div style={{ maxWidth:900, margin:'0 auto', width:'100%', padding:'48px' }}>

          <div style={{ fontFamily:bebas, fontSize:'clamp(48px, 8vw, 96px)', lineHeight:0.9, letterSpacing:'-0.01em', marginBottom:8 }}>
            {result.company.toUpperCase()}
          </div>

          <div style={{ display:'flex', alignItems:'baseline', gap:20, marginBottom:32 }}>
            <div style={{ fontFamily:bebas, fontSize:72, lineHeight:1, color:getColor(result.overall) }}>
              {getGrade(result.overall)}
            </div>
            <div style={{ fontFamily:mono, fontSize:14, color:'#555', letterSpacing:'0.1em' }}>
              {result.overall}/100
            </div>
          </div>

          <div style={{ fontSize:14, lineHeight:1.8, color:'#888', maxWidth:600, marginBottom:48, borderLeft:'2px solid #1e1e1e', paddingLeft:20 }}>
            {result.summary}
          </div>

          <hr style={{ border:'none', borderTop:'1px solid #1a1a1a', marginBottom:40 }} />

          <div style={{ display:'flex', flexDirection:'column', gap:28 }}>
            {Object.entries(result.categories).map(([key, val]) => (
              <div key={key}>
                <div style={{ display:'grid', gridTemplateColumns:'160px 1fr 60px', alignItems:'center', gap:24 }}>
                  <div style={{ fontFamily:mono, fontSize:11, letterSpacing:'0.12em', textTransform:'uppercase', color:'#555' }}>
                    ◈ {catLabels[key]}
                  </div>
                  <div style={{ height:2, background:'#1a1a1a', position:'relative' }}>
                    <div style={{ height:'100%', width:`${val.score}%`, background:getColor(val.score), transition:'width 0.8s cubic-bezier(0.4,0,0.2,1)' }} />
                  </div>
                  <div style={{ fontFamily:mono, fontSize:13, color:'#555', textAlign:'right', letterSpacing:'0.05em' }}>
                    {val.score}
                  </div>
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'160px 1fr 60px', gap:24, marginTop:6 }}>
                  <div />
                  <div style={{ fontSize:12, color:'#3a3a3a', fontStyle:'italic', letterSpacing:'0.02em' }}>
                    {val.summary}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <p style={{ fontFamily:mono, fontSize:10, color:'#2a2a2a', letterSpacing:'0.1em', marginTop:48, textTransform:'uppercase' }}>
            Scores are AI-generated estimates based on publicly available information.
          </p>
        </div>
      </div>
    </>
  )

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: globalStyles }} />
      <div style={{ display:'flex', flexDirection:'column', minHeight:'100vh' }}>

        <nav style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'20px 48px', borderBottom:'1px solid #1e1e1e' }}>
          <span style={{ fontFamily:mono, fontSize:11, letterSpacing:'0.15em', color:'#555', textTransform:'uppercase' }}>UNMSK_001</span>
          <span style={{ fontFamily:mono, fontSize:10, letterSpacing:'0.1em', color:'#c0392b', border:'1px solid #c0392b', padding:'3px 8px', textTransform:'uppercase' }}>Beta</span>
        </nav>

        <div style={{ flex:1, display:'flex', flexDirection:'column', justifyContent:'center', padding:'60px 48px 40px', maxWidth:900, margin:'0 auto', width:'100%' }}>

          <div style={{ fontFamily:mono, fontSize:11, letterSpacing:'0.2em', color:'#c0392b', textTransform:'uppercase', marginBottom:16, display:'flex', alignItems:'center', gap:12 }}>
            <span style={{ display:'block', width:32, height:1, background:'#c0392b' }} />
            Corporate Ethics Intelligence
          </div>

          <h1 style={{ fontFamily:bebas, fontSize:'clamp(80px, 14vw, 160px)', lineHeight:0.9, letterSpacing:'-0.02em', color:'#e8e2d9', marginBottom:24 }}>
            UNMASKED
          </h1>

          <p style={{ fontSize:15, color:'#666', letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:48, fontWeight:300 }}>
            The corporate ethics search engine
          </p>

          {error && (
            <div style={{ border:'1px solid #c0392b', padding:'14px 18px', marginBottom:20, fontFamily:mono, fontSize:12, color:'#c0392b', letterSpacing:'0.05em' }}>
              ⚠ &nbsp;{error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display:'flex', border:'1px solid #2a2a2a', background:'#111', marginBottom:20 }}>
            <span style={{ fontFamily:mono, fontSize:13, color:'#c0392b', padding:'0 16px', display:'flex', alignItems:'center', borderRight:'1px solid #2a2a2a' }}>›</span>
            <input
              type="text"
              value={company}
              onChange={e => setCompany(e.target.value)}
              placeholder="Search any company..."
              style={{ flex:1, background:'transparent', border:'none', outline:'none', color:'#e8e2d9', fontFamily:mono, fontSize:14, padding:'18px 20px', letterSpacing:'0.03em' }}
            />
            <button type="submit" style={{ background:'#c0392b', border:'none', color:'#fff', fontFamily:mono, fontSize:12, letterSpacing:'0.15em', textTransform:'uppercase', padding:'0 28px', cursor:'pointer' }}>
              Search
            </button>
          </form>

          <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
            <span style={{ fontFamily:mono, fontSize:10, letterSpacing:'0.15em', color:'#444', textTransform:'uppercase' }}>Try:</span>
            {['Nestlé', 'Total', 'Amazon', 'Zara', 'Shell', 'Foxconn'].map(name => (
              <button key={name} onClick={() => quickSearch(name)} style={{ fontFamily:mono, fontSize:11, letterSpacing:'0.08em', color:'#555', border:'1px solid #222', padding:'5px 12px', cursor:'pointer', textTransform:'uppercase', background:'transparent' }}>
                {name}
              </button>
            ))}
          </div>
        </div>

        <div style={{ borderTop:'1px solid #1a1a1a', padding:'16px 48px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <span style={{ fontFamily:mono, fontSize:10, letterSpacing:'0.12em', color:'#333', textTransform:'uppercase' }}>
            Follow the money. Expose the truth.
          </span>
          <div style={{ display:'flex', gap:20 }}>
            {['Environment','Labor','Governance','Transparency'].map(c => (
              <span key={c} style={{ fontFamily:mono, fontSize:10, letterSpacing:'0.12em', color:'#333', textTransform:'uppercase' }}>○ {c}</span>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
