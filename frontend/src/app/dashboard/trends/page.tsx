'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { TrendingUp, Flame, Sun, RefreshCw, ArrowRight, ChevronRight, X } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { useToast } from '@/lib/toast'

const BACKEND_URL = process.env.NEXT_PUBLIC_APP_URL || ''

function UrgencyBadge({ urgency }: { urgency: string }) {
  const config: Record<string, { color: string; bg: string; label: string }> = {
    hot: { color: 'var(--red-500)', bg: 'var(--red-50)', label: 'Hot Today' },
    rising: { color: 'var(--amber-500)', bg: 'rgba(245,158,11,0.1)', label: 'Rising' },
    warm: { color: 'var(--blue-500)', bg: 'rgba(59,130,246,0.1)', label: 'Warming Up' },
  }
  const c = config[urgency] || config.warm
  return (
    <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg inline-flex items-center gap-1" style={{ color: c.color, background: c.bg }}>
      {urgency === 'hot' ? <Flame className="w-3 h-3" /> : urgency === 'rising' ? <TrendingUp className="w-3 h-3" /> : <Sun className="w-3 h-3" />}
      {c.label}
    </span>
  )
}

export default function TrendsPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const router = useRouter()
  const [trends, setTrends] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const uid = user?.id || 'demo-user-001'

  useEffect(() => {
    fetch(`${BACKEND_URL}/api/trends?userId=${uid}`)
      .then(r => r.json())
      .then(d => { if (d.success) setTrends(d.data || []) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [uid])

  const handleRefresh = useCallback(async () => {
    setRefreshing(true)
    try {
      const res = await fetch(`${BACKEND_URL}/api/trends/refresh?userId=${uid}`, { method: 'POST' })
      const d = await res.json()
      if (d.success) { setTrends(d.data || []); toast('Trends refreshed!') }
      else toast(d.detail || 'Failed', 'error')
    } catch { toast('Failed to refresh trends', 'error') }
    finally { setRefreshing(false) }
  }, [uid, toast])

  const handleDismiss = async (id: string) => {
    await fetch(`${BACKEND_URL}/api/trends/${id}/dismiss`, { method: 'PUT' })
    setTrends(prev => prev.filter(t => t.id !== id))
    toast('Trend dismissed')
  }

  return (
    <div className="space-y-6 max-w-[1120px] mx-auto d-page-enter" data-testid="trends-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[24px] font-bold" style={{ color: 'var(--ink-900)' }}>Trend Radar</h1>
          <p className="text-[14px] mt-1" style={{ color: 'var(--ink-400)' }}>Trending topics in your niche — ready to create</p>
        </div>
        <button onClick={handleRefresh} disabled={refreshing} className="d-btn-primary text-[13px]" data-testid="refresh-trends-btn">
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} /> {refreshing ? 'Refreshing...' : 'Refresh Trends'}
        </button>
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-3 gap-4">{[1,2,3].map(i => <div key={i} className="d-skeleton h-48 rounded-xl" />)}</div>
      ) : trends.length === 0 ? (
        <div className="d-card text-center py-12" data-testid="trends-empty">
          <TrendingUp className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--ink-200)' }} />
          <p className="text-[15px] font-semibold mb-1" style={{ color: 'var(--ink-600)' }}>No trends yet</p>
          <p className="text-[13px] mb-4" style={{ color: 'var(--ink-400)' }}>Set your niche in Brand Style, then click Refresh</p>
          <button onClick={handleRefresh} disabled={refreshing} className="d-btn-primary" data-testid="generate-trends-btn">
            {refreshing ? 'Generating...' : 'Generate Trends Now'}
          </button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-3 gap-4">
          {trends.map(t => (
            <motion.div key={t.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              className="d-card !p-5 relative group" data-testid={`trend-card-${t.id}`}>
              <button onClick={() => handleDismiss(t.id)} className="absolute top-3 right-3 p-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-[var(--ink-100)]"
                data-testid={`dismiss-trend-${t.id}`}>
                <X className="w-3.5 h-3.5" style={{ color: 'var(--ink-400)' }} />
              </button>
              <UrgencyBadge urgency={t.urgency} />
              <h3 className="text-[15px] font-bold mt-3 mb-1" style={{ color: 'var(--ink-900)' }}>{t.trendTopic}</h3>
              <p className="text-[12px] mb-4" style={{ color: 'var(--ink-400)' }}>{t.trendSummary}</p>
              <div className="space-y-1.5 mb-4">
                {(t.contentAngles || []).map((angle: string, i: number) => (
                  <button key={i} onClick={() => router.push(`/dashboard/create?topic=${encodeURIComponent(angle)}&type=${t.contentType || 'viral-post'}`)}
                    className="w-full text-left text-[12px] px-3 py-2 rounded-lg border transition-all hover:bg-[var(--brand-soft)] hover:border-[var(--brand-primary)]"
                    style={{ borderColor: 'var(--ink-200)', color: 'var(--ink-600)' }} data-testid={`trend-angle-${i}`}>
                    {angle}
                  </button>
                ))}
              </div>
              <button onClick={() => router.push(`/dashboard/create?topic=${encodeURIComponent(t.trendTopic)}&type=${t.contentType || 'viral-post'}`)}
                className="d-btn-primary w-full justify-center text-[12px]" data-testid={`create-from-trend-${t.id}`}>
                Create Content <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
