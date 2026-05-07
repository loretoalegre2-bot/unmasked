import { useState, useEffect } from 'react'

type NewsItem = {
  title: string
  description: string
  type: 'negative' | 'positive'
  url: string
  year: string
}

type KeyIssue = {
  label: string
  description: string
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
  keyIssues: KeyIssue[]
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

const loadingMessages = [
  'Searching news archives...',
  'Scanning public records...',
  'Checking labor reports...',
  'Reviewing environmental data...',
  'Analyzing governance issues...',
  'Cross-referencing controversies...',
  'Almost there...',
]

const globalStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Mono:ital,wght@0,400;0,500;1,400&family=DM+Sans:wght@300;400;500&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { background: #fafaf9; color: #1c1917; font-family: 'DM Sans', sans-serif; min-height: 100vh; }
  input::placeholder { color: #a8a29e; }
  @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
  @keyframes fadeIn { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
  @keyframes pulse { 0%,100%{opacity:0.5} 50%{opacity:1} }
  .tag-btn:hover { border-color: #b91c1c !important; color: #b91c1c !important; }
  .search-btn:hover { background: #991b1b !important; }
  .new-search-btn:hover { background: #b91c1c !important; color: #fff !important; }
  .kofi-btn:hover { background: #333 !important; }
  a { color: inherit; text-decoration: none; }
`

const mono = "'DM Mono', monospace"
const bebas = "'Bebas Neue', sans-serif"

export default function Home() {
  const [company, setCompany] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = use
