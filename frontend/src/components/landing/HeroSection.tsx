'use client'

import { useRef, useState, useEffect, useCallback } from 'react'
import { motion, useInView } from 'framer-motion'
import { Zap, Sparkles, ArrowRight, Star, TrendingUp } from 'lucide-react'
import Link from 'next/link'

function ShimmerLine({ delay = 0, complete = false }: { delay?: number; complete?: boolean }) {
  return (
    <div className={`h-[6px] rounded-full transition-opacity duration-500 ${complete ? 'opacity-100 bg-brand/20' : 'animate-shimmer opacity-60'}`}
      style={{ width: complete ? '100%' : '85%', animationDelay: `${delay}s` }} />
  )
}

const DASHBOARD_METRICS = [
  { label: 'CAROUSELS', value: '24', color: 'var(--ink-400)', bgKey: 'content' },
  { label: 'SAVES', value: '3.2K', color: 'var(--green-500)', bgKey: 'leads' },
  { label: 'ENG. RATE', value: '18.4%', color: 'var(--brand-primary)', bgKey: 'conversion' },
] as const

const AI_CONTENT_LINES = [
  'Hook: Stop scrolling — this changed my...',
  'Slide 3: The framework nobody talks about...',
  'CTA: Save this before it disappears →',
] as const

const AVATAR_COLORS = ['#5B3FE8', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981'] as const

function DashboardMockup() {
  const [completedLines, setCompletedLines] = useState<number[]>([])

  const resetCycle = useCallback(() => {
    setCompletedLines([])
    const t1 = setTimeout(() => setCompletedLines([0]), 2000)
    const t2 = setTimeout(() => setCompletedLines([0, 1]), 4000)
    const t3 = setTimeout(() => setCompletedLines([0, 1, 2]), 6000)
    return [t1, t2, t3]
  }, [])

  useEffect(() => {
    const timers = resetCycle()
    const interval = setInterval(() => {
      timers.forEach(clearTimeout)
      const newTimers = resetCycle()
      timers.splice(0, timers.length, ...newTimers)
    }, 8000)
    return () => {
      timers.forEach(clearTimeout)
      clearInterval(interval)
    }
  }, [resetCycle])

  const getMetricBg = (bgKey: string) => {
    switch (bgKey) {
      case 'conversion': return { background: 'var(--brand-soft)', border: '1px solid rgba(91,63,232,0.15)' }
      case 'leads': return { background: 'var(--green-50)', border: '1px solid rgba(16,185,129,0.15)' }
      default: return { background: 'var(--ink-100)', border: '1px solid var(--ink-200)' }
    }
  }

  return (
    <div className="relative" data-testid="hero-dashboard-mockup">
      {/* Floating notification */}
      <div className="absolute -top-4 -right-4 z-20 animate-notification hidden lg:block" data-testid="hero-notification-toast">
        <div className="bg-white rounded-xl px-4 py-3 shadow-card-lg flex items-center gap-3" style={{ border: '1px solid var(--ink-200)' }}>
          <div className="w-2 h-2 rounded-full bg-[var(--green-500)]" />
          <div>
            <p className="text-[11px] font-semibold" style={{ color: 'var(--ink-800)' }}>Carousel exported!</p>
            <p className="text-[10px]" style={{ color: 'var(--ink-400)' }}>LinkedIn · 10 slides ready</p>
          </div>
        </div>
      </div>

      {/* Floating conversion pill */}
      <div className="absolute -left-6 bottom-20 z-20 hidden lg:block" data-testid="hero-conversion-pill">
        <div className="bg-white rounded-full px-4 py-2 shadow-card-lg flex items-center gap-2" style={{ border: '1px solid var(--ink-200)' }}>
          <TrendingUp className="w-3.5 h-3.5" style={{ color: 'var(--green-500)' }} />
          <span className="text-[12px] font-bold" style={{ color: 'var(--green-500)' }}>+320% more saves this week</span>
        </div>
      </div>

      {/* Floating mini chart */}
      <div className="absolute -bottom-2 -left-8 z-20 hidden lg:block" data-testid="hero-mini-chart">
        <div className="bg-white rounded-lg p-2 shadow-card-lg" style={{ border: '1px solid var(--ink-200)' }}>
          <svg width="60" height="30" viewBox="0 0 60 30">
            <polyline points="0,28 10,22 20,25 30,15 40,18 50,8 60,4" fill="none" stroke="var(--green-500)" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>
      </div>

      <div className="animate-float-3d">
        <div className="bg-white rounded-[var(--radius-2xl)] overflow-hidden"
          style={{ boxShadow: 'var(--shadow-lg)', border: '1px solid var(--ink-200)' }}>
          {/* Mac title bar */}
          <div className="px-5 py-3.5 flex items-center gap-3" style={{ background: 'var(--ink-50)', borderBottom: '1px solid var(--ink-200)' }}>
            <div className="flex gap-[6px]">
              <div className="w-[11px] h-[11px] rounded-full" style={{ background: '#FF5F57' }} />
              <div className="w-[11px] h-[11px] rounded-full" style={{ background: '#FEBC2E' }} />
              <div className="w-[11px] h-[11px] rounded-full" style={{ background: '#28C840' }} />
            </div>
            <div className="flex-1 mx-6">
              <div className="rounded-lg px-4 py-[5px] text-[11px] text-center"
                style={{ background: 'white', border: '1px solid var(--ink-200)', color: 'var(--ink-400)' }}>
                app.carouselex.com/create
              </div>
            </div>
          </div>

          {/* Dashboard content */}
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-3 gap-3">
              {DASHBOARD_METRICS.map(m => (
                <div key={m.label} className="rounded-xl p-3.5" style={getMetricBg(m.bgKey)}>
                  <p className="text-[9px] font-semibold uppercase tracking-[0.1em]" style={{ color: 'var(--ink-400)' }}>{m.label}</p>
                  <p className="text-[22px] font-extrabold mt-0.5 tracking-[-0.02em]" style={{ color: m.color }}>{m.value}</p>
                </div>
              ))}
            </div>

            <div className="rounded-xl p-4" style={{ background: 'var(--ink-50)', border: '1px solid var(--ink-200)' }}>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-[22px] h-[22px] rounded-md flex items-center justify-center"
                  style={{ background: 'var(--brand-gradient)' }}>
                  <Sparkles className="w-3 h-3 text-white" />
                </div>
                <span className="text-[12px] font-bold" style={{ color: 'var(--ink-800)' }}>AI Carousel Engine</span>
              </div>
              <div className="space-y-[6px]">
                {AI_CONTENT_LINES.map((h, i) => (
                  <div key={h} className="bg-white rounded-lg px-3 py-[9px] flex items-center gap-2"
                    style={{ border: '1px solid var(--ink-200)' }}>
                    <div className="w-[6px] h-[6px] rounded-full shrink-0" style={{ background: 'var(--brand-primary)' }} />
                    <span className="text-[11px] flex-1" style={{ color: completedLines.includes(i) ? 'var(--ink-600)' : 'var(--ink-400)' }}>
                      {completedLines.includes(i) ? h : h.slice(0, -3)}
                    </span>
                    {!completedLines.includes(i) && (
                      <div className="w-16"><ShimmerLine delay={i * 0.3} /></div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function HeroSection() {
  return (
    <section className="relative pt-[140px] pb-[100px] overflow-hidden dot-grid" data-testid="hero-section">
      <div className="absolute inset-0" style={{
        background: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(91,63,232,0.08) 0%, transparent 70%)'
      }} />

      <div className="container-main relative">
        <div className="grid lg:grid-cols-[55%_45%] gap-16 lg:gap-20 items-center">
          <div className="space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <span className="badge badge-brand" data-testid="hero-badge">
                <Zap className="w-3 h-3" /> AI Carousel Creation Platform
              </span>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
            >
              <h1 className="text-hero" style={{ color: 'var(--ink-900)' }} data-testid="hero-headline">
                Turn Ideas Into<br />
                Viral <span className="text-gradient-brand">Carousels</span>
              </h1>
            </motion.div>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="text-[20px] leading-[1.7] max-w-[500px]"
              style={{ color: 'var(--ink-600)' }}
              data-testid="hero-subheadline"
            >
              Input your idea — CarouselEx generates your hook, slides, and CTA
              instantly. Platform-optimized for Instagram, LinkedIn, TikTok & Threads.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="flex flex-wrap gap-4"
              data-testid="hero-cta-row"
            >
              <Link href="/signup">
                <button className="btn-primary btn-lg" data-testid="hero-start-free-btn">
                  Create Free Carousel <ArrowRight className="w-4 h-4" />
                </button>
              </Link>
              <Link href="/pricing">
                <button className="btn-secondary btn-lg" data-testid="hero-view-pricing-btn">
                  View Pricing
                </button>
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.55 }}
              className="flex items-center gap-5"
              data-testid="hero-trust-row"
            >
              <div className="flex -space-x-2">
                {AVATAR_COLORS.map(c => (
                  <div key={c} className="w-[34px] h-[34px] rounded-full border-[2.5px] border-white shadow-sm"
                    style={{ background: `linear-gradient(135deg, ${c}, ${c}cc)` }} />
                ))}
              </div>
              <div>
                <div className="flex items-center gap-0.5 mb-0.5">
                  {(['star-1','star-2','star-3','star-4','star-5']).map(id => (
                    <Star key={id} className="w-[13px] h-[13px] fill-[var(--amber-500)]" style={{ color: 'var(--amber-500)' }} />
                  ))}
                </div>
                <p className="text-[12px] font-medium" style={{ color: 'var(--ink-400)' }}>
                  Trusted by <span className="font-semibold" style={{ color: 'var(--ink-600)' }}>2,000+</span> creators worldwide
                </p>
              </div>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
            className="relative hidden lg:block"
          >
            <div className="absolute -inset-8 rounded-3xl blur-3xl opacity-40"
              style={{ background: 'linear-gradient(135deg, rgba(91,63,232,0.1), rgba(139,92,246,0.08))' }} />
            <DashboardMockup />
          </motion.div>
        </div>
      </div>
    </section>
  )
}
