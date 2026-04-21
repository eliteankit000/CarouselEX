'use client'

import { useState, useEffect, useCallback, lazy, Suspense } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  Sparkles, ArrowRight, TrendingUp, BarChart3, Flame, Zap, Sun,
  RefreshCw, Mic, Dna, User, ChevronRight, LayoutGrid, MessageSquare,
  Wand2, Layers
} from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { useToast } from '@/lib/toast'
import AIContentGenerator from '@/components/AIContentGenerator'
import SetupModal from '@/components/SetupModal'
import SkeletonCard from '@/components/ui/SkeletonCard'

const ViralCarouselIdeas = lazy(() => import('@/components/ViralCarouselIdeas'))

const BACKEND_URL = process.env.NEXT_PUBLIC_APP_URL || ''
const fadeUp = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } } }
const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } } }

function UrgencyBadge({ urgency }: { urgency: string }) {
  const config: Record<string, { color: string; bg: string; label: string }> = {
    hot: { color: 'var(--red-500)', bg: 'var(--red-50)', label: 'Hot Today' },
    rising: { color: 'var(--amber-500)', bg: 'rgba(245,158,11,0.1)', label: 'Rising' },
    warm: { color: 'var(--blue-500)', bg: 'rgba(59,130,246,0.1)', label: 'Warming Up' },
  }
  const c = config[urgency] || config.warm
  return (
    <span className="text-[10px] font-bold px-2 py-0.5 rounded inline-flex items-center gap-1" style={{ color: c.color, background: c.bg }} data-testid={`urgency-${urgency}`}>
      {urgency === 'hot' ? <Flame className="w-3 h-3" /> : urgency === 'rising' ? <TrendingUp className="w-3 h-3" /> : <Sun className="w-3 h-3" />}
      {c.label}
    </span>
  )
}

function SectionHeader({
  eyebrow,
  title,
  subtitle,
  icon,
  'data-testid': testId,
}: {
  eyebrow?: string
  title: string
  subtitle: string
  icon?: React.ReactNode
  'data-testid'?: string
}) {
  return (
    <div className="mb-6 flex items-start gap-3" data-testid={testId}>
      {icon && (
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
          style={{ background: 'var(--brand-gradient)', boxShadow: 'var(--shadow-brand)' }}
        >
          {icon}
        </div>
      )}
      <div className="min-w-0">
        {eyebrow && (
          <p
            className="text-[11px] font-bold uppercase tracking-[0.12em] mb-1"
            style={{ color: 'var(--brand-primary)' }}
          >
            {eyebrow}
          </p>
        )}
        <h2
          className="text-[22px] sm:text-[26px] font-bold leading-tight"
          style={{ color: 'var(--ink-900)', fontFamily: 'var(--font-display)', letterSpacing: '-0.02em' }}
        >
          {title}
        </h2>
        <p className="mt-1 text-[13px] sm:text-[14px]" style={{ color: 'var(--ink-400)' }}>
          {subtitle}
        </p>
      </div>
    </div>
  )
}

function SectionDivider() {
  return <div className="border-t" style={{ borderColor: 'var(--ink-200)' }} />
}

export default function HomePage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const router = useRouter()
  const [input, setInput] = useState('')
  const [trends, setTrends] = useState<any[]>([])
  const [trendsLoading, setTrendsLoading] = useState(false)
  const [voiceProfile, setVoiceProfile] = useState<any>(null)
  const [dna, setDna] = useState<any>(null)
  const [persona, setPersona] = useState<any>(null)
  const [perfStats, setPerfStats] = useState<any>(null)
  const [setupOpen, setSetupOpen] = useState(false)

  const uid = user?.id || 'demo-user-001'

  useEffect(() => {
    fetch(`${BACKEND_URL}/api/trends?userId=${uid}`).then(r => r.json()).then(d => { if (d.success) setTrends(d.data || []) }).catch(() => {})
    fetch(`${BACKEND_URL}/api/voice-profiles?userId=${uid}`).then(r => r.json()).then(d => {
      if (d.success) { const active = (d.data || []).find((v: any) => v.isActive); if (active) setVoiceProfile(active) }
    }).catch(() => {})
    fetch(`${BACKEND_URL}/api/content-dna?userId=${uid}`).then(r => r.json()).then(d => { if (d.success && d.data) setDna(d.data) }).catch(() => {})
    fetch(`${BACKEND_URL}/api/personas?userId=${uid}`).then(r => r.json()).then(d => {
      if (d.success) { const active = (d.data || []).find((p: any) => p.isActive); if (active) setPersona(active) }
    }).catch(() => {})
    fetch(`${BACKEND_URL}/api/performance?userId=${uid}&limit=1`).then(r => r.json()).then(d => { if (d.success) setPerfStats(d) }).catch(() => {})
  }, [uid])

  const refreshTrends = useCallback(async () => {
    setTrendsLoading(true)
    try {
      const res = await fetch(`${BACKEND_URL}/api/trends/refresh?userId=${uid}`, { method: 'POST' })
      const d = await res.json()
      if (d.success) { setTrends(d.data || []); toast('Trends refreshed!') }
    } catch { toast('Failed to refresh trends', 'error') }
    finally { setTrendsLoading(false) }
  }, [uid, toast])

  const handleStart = () => {
    router.push(input.trim() ? `/dashboard/create?topic=${encodeURIComponent(input.trim())}&type=viral-post` : '/dashboard/create')
  }

  return (
    <>
      <motion.div variants={stagger} initial="hidden" animate="visible" className="max-w-[1120px] mx-auto space-y-6" data-testid="home-page">
        {/* Active Systems Status */}
        {(voiceProfile || dna || persona) && (
          <motion.div variants={fadeUp} className="flex flex-wrap gap-2 justify-center">
            {voiceProfile && voiceProfile.sampleCount >= 5 && (
              <span className="text-[11px] font-semibold px-3 py-1.5 rounded-full inline-flex items-center gap-1.5" style={{ background: 'var(--green-50)', color: 'var(--green-500)' }} data-testid="voice-active-badge">
                <Mic className="w-3 h-3" /> Voice Active: {voiceProfile.name}
              </span>
            )}
            {dna && (
              <span className="text-[11px] font-semibold px-3 py-1.5 rounded-full inline-flex items-center gap-1.5" style={{ background: 'var(--brand-soft)', color: 'var(--brand-primary)' }} data-testid="dna-active-badge">
                <Dna className="w-3 h-3" /> DNA Active ({dna.postsAnalyzed} posts)
              </span>
            )}
            {persona && (
              <span className="text-[11px] font-semibold px-3 py-1.5 rounded-full inline-flex items-center gap-1.5" style={{ background: 'rgba(59,130,246,0.1)', color: 'var(--blue-500)' }} data-testid="persona-active-badge">
                <User className="w-3 h-3" /> Persona: {persona.name}
              </span>
            )}
          </motion.div>
        )}

        {/* ============ NEW: AI CONTENT GENERATOR ============ */}
        <motion.section
          variants={fadeUp}
          className="pt-2"
          data-testid="section-ai-content"
        >
          <SectionHeader
            eyebrow="Feature • GPT-4o"
            title="AI Content Generator"
            subtitle="Upload media or enter a topic to generate optimized captions, hashtags & keywords."
            icon={<Wand2 className="w-5 h-5 text-white" />}
            data-testid="section-ai-content-header"
          />
          <AIContentGenerator />
        </motion.section>

        {/* ============ NEW: VIRAL CAROUSEL IDEAS ============ */}
        <SectionDivider />
        <motion.section
          variants={fadeUp}
          className="pt-6"
          data-testid="section-viral-carousel-ideas"
        >
          <SectionHeader
            eyebrow="Feature • Trend-Aware"
            title="Viral Carousel Ideas"
            subtitle="7 trending ideas personalized for your platform and niche."
            icon={<Layers className="w-5 h-5 text-white" />}
            data-testid="section-viral-carousel-header"
          />
          <Suspense
            fallback={
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" style={{ minHeight: 520 }}>
                {Array.from({ length: 6 }).map((_, i) => (
                  <SkeletonCard key={i} height={220} />
                ))}
              </div>
            }
          >
            <ViralCarouselIdeas onOpenSetup={() => setSetupOpen(true)} />
          </Suspense>
        </motion.section>

        {/* Trend Radar Widget */}
        <SectionDivider />
        <motion.div variants={fadeUp} className="d-card" data-testid="trend-radar-widget">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" style={{ color: 'var(--brand-primary)' }} />
              <h3 className="text-[14px] font-bold" style={{ color: 'var(--ink-900)' }}>Trend Radar</h3>
            </div>
            <button onClick={refreshTrends} disabled={trendsLoading} className="d-btn-ghost text-[11px] !px-2 !py-1" data-testid="refresh-trends-btn">
              <RefreshCw className={`w-3 h-3 ${trendsLoading ? 'animate-spin' : ''}`} /> {trendsLoading ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
          {trends.length === 0 ? (
            <div className="text-center py-6">
              <TrendingUp className="w-8 h-8 mx-auto mb-2" style={{ color: 'var(--ink-200)' }} />
              <p className="text-[13px]" style={{ color: 'var(--ink-400)' }}>Set your niche in Brand Style, then refresh to see trends</p>
              <button onClick={refreshTrends} disabled={trendsLoading} className="d-btn-primary text-[12px] mt-3" data-testid="first-refresh-btn">
                {trendsLoading ? 'Generating...' : 'Generate Trends'}
              </button>
            </div>
          ) : (
            <div className="grid sm:grid-cols-3 gap-3">
              {trends.map(t => (
                <div key={t.id} className="p-4 rounded-xl border transition-all hover:border-[var(--brand-primary)]" style={{ borderColor: 'var(--ink-200)' }} data-testid={`trend-card-${t.id}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <UrgencyBadge urgency={t.urgency} />
                  </div>
                  <p className="text-[13px] font-semibold mb-1" style={{ color: 'var(--ink-900)' }}>{t.trendTopic}</p>
                  <p className="text-[11px] mb-3" style={{ color: 'var(--ink-400)' }}>{t.trendSummary}</p>
                  <div className="flex flex-wrap gap-1 mb-3">
                    {(t.contentAngles || []).slice(0, 2).map((a: string, i: number) => (
                      <button key={i} onClick={() => router.push(`/dashboard/create?topic=${encodeURIComponent(a)}&type=${t.contentType || 'viral-post'}`)}
                        className="text-[10px] px-2 py-1 rounded-lg border transition-all hover:bg-[var(--brand-soft)]"
                        style={{ borderColor: 'var(--ink-200)', color: 'var(--ink-600)' }} data-testid={`trend-angle-${t.id}-${i}`}>
                        {a.substring(0, 40)}{a.length > 40 ? '...' : ''}
                      </button>
                    ))}
                  </div>
                  <button onClick={() => router.push(`/dashboard/create?topic=${encodeURIComponent(t.trendTopic)}&type=${t.contentType || 'viral-post'}`)}
                    className="text-[11px] font-semibold flex items-center gap-1" style={{ color: 'var(--brand-primary)' }} data-testid={`trend-create-${t.id}`}>
                    Create Now <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Performance + DNA Row */}
        <div className="grid sm:grid-cols-2 gap-4">
          {/* Performance Summary */}
          <motion.div variants={fadeUp} className="d-card" data-testid="perf-summary-widget">
            <div className="flex items-center gap-2 mb-3">
              <BarChart3 className="w-4 h-4" style={{ color: 'var(--brand-primary)' }} />
              <h3 className="text-[14px] font-bold" style={{ color: 'var(--ink-900)' }}>Performance</h3>
            </div>
            {perfStats ? (
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-xl" style={{ background: 'var(--ink-100)' }}>
                  <p className="text-[10px] font-medium" style={{ color: 'var(--ink-400)' }}>Total Posts</p>
                  <p className="text-[20px] font-bold" style={{ color: 'var(--ink-900)' }}>{perfStats.total || 0}</p>
                </div>
                <div className="p-3 rounded-xl" style={{ background: 'var(--ink-100)' }}>
                  <p className="text-[10px] font-medium" style={{ color: 'var(--ink-400)' }}>With Data</p>
                  <p className="text-[20px] font-bold" style={{ color: 'var(--brand-primary)' }}>{perfStats.postsWithData || 0}</p>
                </div>
                <div className="p-3 rounded-xl" style={{ background: 'var(--ink-100)' }}>
                  <p className="text-[10px] font-medium" style={{ color: 'var(--ink-400)' }}>Avg Score</p>
                  <p className="text-[20px] font-bold" style={{ color: 'var(--green-500)' }}>{perfStats.avgEngagement || 0}</p>
                </div>
              </div>
            ) : (
              <p className="text-[13px]" style={{ color: 'var(--ink-400)' }}>No data yet. Create content to see stats.</p>
            )}
            <Link href="/dashboard/performance" className="text-[12px] font-semibold flex items-center gap-1 mt-3" style={{ color: 'var(--brand-primary)' }} data-testid="perf-link">
              View Details <ChevronRight className="w-3 h-3" />
            </Link>
          </motion.div>

          {/* Voice + DNA Status */}
          <motion.div variants={fadeUp} className="d-card" data-testid="voice-dna-widget">
            <div className="flex items-center gap-2 mb-3">
              <Dna className="w-4 h-4" style={{ color: 'var(--brand-primary)' }} />
              <h3 className="text-[14px] font-bold" style={{ color: 'var(--ink-900)' }}>AI Intelligence</h3>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-2.5 rounded-lg" style={{ background: 'var(--ink-100)' }}>
                <div className="flex items-center gap-2">
                  <Mic className="w-3.5 h-3.5" style={{ color: voiceProfile?.sampleCount >= 5 ? 'var(--green-500)' : 'var(--ink-400)' }} />
                  <span className="text-[12px] font-medium" style={{ color: 'var(--ink-800)' }}>Brand Voice</span>
                </div>
                <span className="text-[11px] font-semibold" style={{ color: voiceProfile?.sampleCount >= 5 ? 'var(--green-500)' : 'var(--ink-400)' }}>
                  {voiceProfile?.sampleCount >= 5 ? 'Active' : `${voiceProfile?.sampleCount || 0}/5 posts`}
                </span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-lg" style={{ background: 'var(--ink-100)' }}>
                <div className="flex items-center gap-2">
                  <Dna className="w-3.5 h-3.5" style={{ color: dna ? 'var(--green-500)' : 'var(--ink-400)' }} />
                  <span className="text-[12px] font-medium" style={{ color: 'var(--ink-800)' }}>Content DNA</span>
                </div>
                <span className="text-[11px] font-semibold" style={{ color: dna ? 'var(--green-500)' : 'var(--ink-400)' }}>
                  {dna ? `Active (${dna.postsAnalyzed} analyzed)` : 'Needs 10+ posts'}
                </span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-lg" style={{ background: 'var(--ink-100)' }}>
                <div className="flex items-center gap-2">
                  <User className="w-3.5 h-3.5" style={{ color: persona ? 'var(--green-500)' : 'var(--ink-400)' }} />
                  <span className="text-[12px] font-medium" style={{ color: 'var(--ink-800)' }}>Persona</span>
                </div>
                <span className="text-[11px] font-semibold" style={{ color: persona ? 'var(--green-500)' : 'var(--ink-400)' }}>
                  {persona ? persona.name : 'Not set'}
                </span>
              </div>
            </div>
            <Link href="/dashboard/settings?tab=voice" className="text-[12px] font-semibold flex items-center gap-1 mt-3" style={{ color: 'var(--brand-primary)' }} data-testid="ai-settings-link">
              Manage AI Settings <ChevronRight className="w-3 h-3" />
            </Link>
          </motion.div>
        </div>
      </motion.div>

      {/* Setup Modal */}
      <SetupModal
        open={setupOpen}
        onOpen={() => setSetupOpen(true)}
        onClose={() => setSetupOpen(false)}
      />
    </>
  )
}
