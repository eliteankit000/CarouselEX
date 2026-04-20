'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { BarChart3, TrendingUp, Award, FileText, ChevronRight, Dna } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { useToast } from '@/lib/toast'
import Modal from '@/components/ui/Modal'

const BACKEND_URL = process.env.NEXT_PUBLIC_APP_URL || ''

export default function PerformancePage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const uid = user?.id || 'demo-user-001'

  const [posts, setPosts] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [postsWithData, setPostsWithData] = useState(0)
  const [avgEngagement, setAvgEngagement] = useState(0)
  const [topPerformer, setTopPerformer] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [dna, setDna] = useState<any>(null)
  const [analyzingDna, setAnalyzingDna] = useState(false)

  // Performance entry modal
  const [editPost, setEditPost] = useState<any>(null)
  const [perfLikes, setPerfLikes] = useState('')
  const [perfComments, setPerfComments] = useState('')
  const [perfShares, setPerfShares] = useState('')
  const [perfSaves, setPerfSaves] = useState('')
  const [perfImpressions, setPerfImpressions] = useState('')
  const [perfSaving, setPerfSaving] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`${BACKEND_URL}/api/performance?userId=${uid}&page=${page}&limit=20`)
      const d = await res.json()
      if (d.success) {
        setPosts(d.data || [])
        setTotal(d.total || 0)
        setPostsWithData(d.postsWithData || 0)
        setAvgEngagement(d.avgEngagement || 0)
        setTopPerformer(d.topPerformer || null)
      }
    } catch {}
    finally { setLoading(false) }
  }, [uid, page])

  useEffect(() => { fetchData() }, [fetchData])

  useEffect(() => {
    fetch(`${BACKEND_URL}/api/content-dna?userId=${uid}`)
      .then(r => r.json()).then(d => { if (d.success && d.data) setDna(d.data) }).catch(() => {})
  }, [uid])

  const openPerfModal = (post: any) => {
    setEditPost(post)
    setPerfLikes(post.likes?.toString() || '')
    setPerfComments(post.comments?.toString() || '')
    setPerfShares(post.shares?.toString() || '')
    setPerfSaves(post.saves?.toString() || '')
    setPerfImpressions(post.impressions?.toString() || '')
  }

  const savePerfData = async () => {
    if (!editPost) return
    setPerfSaving(true)
    try {
      const res = await fetch(`${BACKEND_URL}/api/performance/${editPost.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          likes: parseInt(perfLikes) || 0,
          comments: parseInt(perfComments) || 0,
          shares: parseInt(perfShares) || 0,
          saves: parseInt(perfSaves) || 0,
          impressions: parseInt(perfImpressions) || 0,
        }),
      })
      if (res.ok) { toast('Performance data saved!'); setEditPost(null); fetchData() }
      else toast('Save failed', 'error')
    } catch { toast('Save failed', 'error') }
    finally { setPerfSaving(false) }
  }

  const analyzeDna = async () => {
    setAnalyzingDna(true)
    try {
      const res = await fetch(`${BACKEND_URL}/api/content-dna/analyze?userId=${uid}`, { method: 'POST' })
      const d = await res.json()
      if (d.success) { setDna(d.data); toast('Content DNA analyzed!') }
      else toast(d.error || 'Analysis failed', 'error')
    } catch { toast('Analysis failed', 'error') }
    finally { setAnalyzingDna(false) }
  }

  const getScoreColor = (score: number | null) => {
    if (!score) return 'var(--ink-400)'
    if (score >= 70) return 'var(--green-500)'
    if (score >= 40) return 'var(--amber-500)'
    return 'var(--red-500)'
  }

  return (
    <div className="space-y-6 max-w-[1120px] mx-auto d-page-enter" data-testid="performance-page">
      <div>
        <h1 className="text-[24px] font-bold" style={{ color: 'var(--ink-900)' }}>Performance</h1>
        <p className="text-[14px] mt-1" style={{ color: 'var(--ink-400)' }}>Track and analyze your content performance</p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Posts', value: total, color: 'var(--ink-900)' },
          { label: 'With Data', value: postsWithData, color: 'var(--brand-primary)' },
          { label: 'Avg Score', value: avgEngagement, color: 'var(--green-500)' },
          { label: 'Top Score', value: topPerformer?.performanceScore || 0, color: 'var(--amber-500)' },
        ].map(s => (
          <div key={s.label} className="d-card !p-4 text-center" data-testid={`stat-${s.label.toLowerCase().replace(/\s/g, '-')}`}>
            <p className="text-[10px] font-medium uppercase tracking-wider" style={{ color: 'var(--ink-400)' }}>{s.label}</p>
            <p className="text-[28px] font-bold mt-1" style={{ color: s.color, fontFamily: 'var(--font-mono)' }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Content DNA Card */}
      <div className="d-card" data-testid="dna-card">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Dna className="w-4 h-4" style={{ color: 'var(--brand-primary)' }} />
            <h3 className="text-[14px] font-bold" style={{ color: 'var(--ink-900)' }}>Content DNA</h3>
            {dna && <span className="text-[10px] font-bold px-2 py-0.5 rounded" style={{ background: 'var(--green-50)', color: 'var(--green-500)' }}>Active</span>}
          </div>
          <button onClick={analyzeDna} disabled={analyzingDna || postsWithData < 5}
            className="d-btn-ghost text-[12px] !px-3 !py-1.5 disabled:opacity-40" data-testid="analyze-dna-btn">
            <Dna className={`w-3.5 h-3.5 ${analyzingDna ? 'animate-spin' : ''}`} /> {analyzingDna ? 'Analyzing...' : 'Analyze DNA'}
          </button>
        </div>
        {dna ? (
          <div className="space-y-3">
            <p className="text-[13px] leading-relaxed" style={{ color: 'var(--ink-600)' }}>{dna.dnaReport}</p>
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="p-3 rounded-xl" style={{ background: 'var(--green-50)' }}>
                <p className="text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: 'var(--green-500)' }}>Winning Formulas</p>
                {(dna.winningFormulas || []).map((f: string, i: number) => (
                  <p key={i} className="text-[12px] mb-1" style={{ color: 'var(--ink-600)' }}>+ {f}</p>
                ))}
              </div>
              <div className="p-3 rounded-xl" style={{ background: 'var(--red-50)' }}>
                <p className="text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: 'var(--red-500)' }}>Avoid</p>
                {(dna.avoidFormulas || []).map((f: string, i: number) => (
                  <p key={i} className="text-[12px] mb-1" style={{ color: 'var(--ink-600)' }}>- {f}</p>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <p className="text-[13px]" style={{ color: 'var(--ink-400)' }}>
            {postsWithData < 5 ? `Add performance data to ${5 - postsWithData} more posts to unlock DNA analysis.` : 'Click "Analyze DNA" to discover your content patterns.'}
          </p>
        )}
      </div>

      {/* Posts Table */}
      <div className="d-card" data-testid="posts-table">
        <h3 className="text-[14px] font-bold mb-4" style={{ color: 'var(--ink-900)' }}>Content History</h3>
        {loading ? (
          <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="d-skeleton h-14" />)}</div>
        ) : posts.length === 0 ? (
          <p className="text-[13px] text-center py-8" style={{ color: 'var(--ink-400)' }}>No content yet. Start creating!</p>
        ) : (
          <div className="space-y-2">
            {posts.map(post => (
              <div key={post.id} className="flex items-center gap-3 p-3 rounded-xl border transition-all hover:border-[var(--ink-400)]"
                style={{ borderColor: 'var(--ink-200)' }} data-testid={`post-row-${post.id}`}>
                <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'var(--brand-soft)' }}>
                  <FileText className="w-5 h-5" style={{ color: 'var(--brand-primary)' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium truncate" style={{ color: 'var(--ink-900)' }}>{post.hook || post.content?.substring(0, 60) || 'Untitled'}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded uppercase" style={{ background: 'var(--brand-soft)', color: 'var(--brand-primary)' }}>{post.contentType}</span>
                    {post.isTopPerformer && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ background: 'var(--green-50)', color: 'var(--green-500)' }}>
                        <Award className="w-3 h-3 inline mr-0.5" />Top
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  {post.performanceScore != null ? (
                    <p className="text-[16px] font-bold" style={{ color: getScoreColor(post.performanceScore), fontFamily: 'var(--font-mono)' }}>
                      {post.performanceScore}
                    </p>
                  ) : (
                    <span className="text-[10px] font-medium px-2 py-1 rounded" style={{ background: 'var(--ink-100)', color: 'var(--ink-400)' }}>No data</span>
                  )}
                </div>
                <button onClick={() => openPerfModal(post)} className="d-btn-ghost text-[11px] !px-2 !py-1 shrink-0" data-testid={`add-perf-${post.id}`}>
                  {post.performanceScore != null ? 'Edit' : 'Add Data'}
                </button>
              </div>
            ))}
          </div>
        )}
        {total > 20 && (
          <div className="flex items-center justify-center gap-2 mt-4">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="d-btn-ghost text-[12px] !px-3 !py-1 disabled:opacity-40">Prev</button>
            <span className="text-[12px]" style={{ color: 'var(--ink-400)' }}>Page {page}</span>
            <button onClick={() => setPage(p => p + 1)} disabled={page >= Math.ceil(total / 20)} className="d-btn-ghost text-[12px] !px-3 !py-1 disabled:opacity-40">Next</button>
          </div>
        )}
      </div>

      {/* Performance Entry Modal */}
      <Modal open={!!editPost} onClose={() => setEditPost(null)} title="Add Performance Data" maxWidth="max-w-sm">
        <div className="space-y-3" data-testid="perf-modal">
          <p className="text-[12px] truncate mb-2" style={{ color: 'var(--ink-400)' }}>{editPost?.hook || editPost?.content?.substring(0, 80)}</p>
          {[
            { label: 'Likes', val: perfLikes, set: setPerfLikes },
            { label: 'Comments', val: perfComments, set: setPerfComments },
            { label: 'Shares / Reposts', val: perfShares, set: setPerfShares },
            { label: 'Saves', val: perfSaves, set: setPerfSaves },
            { label: 'Impressions', val: perfImpressions, set: setPerfImpressions },
          ].map(f => (
            <div key={f.label}>
              <label className="text-[11px] font-medium uppercase tracking-wider mb-1 block" style={{ color: 'var(--ink-400)' }}>{f.label}</label>
              <input type="number" value={f.val} onChange={e => f.set(e.target.value)} className="d-input" placeholder="0"
                data-testid={`perf-input-${f.label.toLowerCase().replace(/[\s/]+/g, '-')}`} />
            </div>
          ))}
          <button onClick={savePerfData} disabled={perfSaving} className="d-btn-primary w-full justify-center" data-testid="save-perf-btn">
            {perfSaving ? 'Saving...' : 'Save Performance Data'}
          </button>
        </div>
      </Modal>
    </div>
  )
}
