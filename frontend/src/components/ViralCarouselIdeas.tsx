'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  Flame, ArrowRight, Zap, AlertCircle, RefreshCw, Sparkles,
  Instagram, Linkedin, Youtube, Music2, Pin,
} from 'lucide-react'
import type { CarouselIdea, HomePlatform } from '@/types/content'
import { useUserPreferences } from '@/context/UserPreferencesContext'

const BACKEND_URL = process.env.NEXT_PUBLIC_APP_URL || ''

const PLATFORMS: HomePlatform[] = [
  'Instagram',
  'TikTok',
  'LinkedIn',
  'Pinterest',
  'YouTube',
]

const BADGE_CLASS: Record<CarouselIdea['format'], string> = {
  Educational: 'cx-badge cx-badge-educational',
  Story: 'cx-badge cx-badge-story',
  Tips: 'cx-badge cx-badge-tips',
  Listicle: 'cx-badge cx-badge-listicle',
  Comparison: 'cx-badge cx-badge-comparison',
}

function PlatformIcon({ platform }: { platform: string }) {
  if (platform === 'Instagram') return <Instagram />
  if (platform === 'LinkedIn') return <Linkedin />
  if (platform === 'YouTube') return <Youtube />
  if (platform === 'TikTok') return <Music2 />
  if (platform === 'Pinterest') return <Pin />
  return <Sparkles />
}

function scoreClass(s: number) {
  if (s >= 9) return 'cx-score cx-score-green'
  if (s >= 8) return 'cx-score cx-score-amber'
  return 'cx-score cx-score-grey'
}

export default function ViralCarouselIdeas({
  onOpenSetup,
}: {
  onOpenSetup?: () => void
}) {
  const { platform: prefPlatform, niche, isSetupComplete, isLoading: prefsLoading } =
    useUserPreferences()
  const router = useRouter()

  const defaultPlatform: HomePlatform = useMemo(() => {
    if (prefPlatform && PLATFORMS.includes(prefPlatform as HomePlatform)) {
      return prefPlatform as HomePlatform
    }
    return 'Instagram'
  }, [prefPlatform])

  const [activePlatform, setActivePlatform] = useState<HomePlatform>(defaultPlatform)
  const [ideas, setIdeas] = useState<CarouselIdea[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => { setActivePlatform(defaultPlatform) }, [defaultPlatform])

  const fetchIdeas = useCallback(async (plat: HomePlatform, targetNiche: string) => {
    setIsLoading(true); setError(null)
    try {
      const url = `${BACKEND_URL}/api/carousel-ideas?platform=${encodeURIComponent(plat)}&niche=${encodeURIComponent(targetNiche)}`
      const res = await fetch(url)
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        const msg =
          (typeof body?.detail === 'object' && body?.detail?.detail) ||
          (typeof body?.detail === 'string' && body.detail) ||
          `Request failed (${res.status})`
        throw new Error(String(msg))
      }
      const data = await res.json()
      setIdeas(Array.isArray(data?.ideas) ? data.ideas : [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load ideas')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (prefsLoading) return
    if (!isSetupComplete || !niche) return
    fetchIdeas(activePlatform, niche)
  }, [prefsLoading, isSetupComplete, niche, activePlatform, fetchIdeas])

  const handleCreate = (idea: CarouselIdea) => {
    const params = new URLSearchParams({
      topic: idea.title,
      hook: idea.hook,
      platform: activePlatform,
      type: 'carousel',
    })
    router.push(`/dashboard/create?${params.toString()}`)
  }

  const handleRetry = () => { if (niche) fetchIdeas(activePlatform, niche) }

  // Empty / not-set-up state
  if (!prefsLoading && (!isSetupComplete || !niche)) {
    return (
      <div
        data-testid="carousel-ideas-empty"
        className="cx-card"
        style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          gap: 16, textAlign: 'center', padding: 48, minHeight: 300,
        }}
      >
        <div className="cx-sec-icon" style={{ width: 56, height: 56 }}>
          <Sparkles width="22" height="22" />
        </div>
        <div>
          <h3 style={{
            fontFamily: 'var(--cx-font-display)', fontSize: 18, fontWeight: 700,
            color: 'var(--cx-ink-1)', margin: 0,
          }}>
            Set up your profile to see personalized ideas
          </h3>
          <p style={{ fontSize: 13, color: 'var(--cx-muted)', marginTop: 4 }}>
            Tell us your platform and niche — we&apos;ll craft trending carousels for you.
          </p>
        </div>
        <button
          onClick={onOpenSetup}
          className="cx-btn-primary"
          data-testid="carousel-ideas-setup-btn"
        >
          <Sparkles width="16" height="16" /> Set Up Now
        </button>
      </div>
    )
  }

  return (
    <div data-testid="viral-carousel-ideas-section" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Filter bar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: 12, flexWrap: 'wrap',
      }} data-testid="carousel-platform-bar">
        <div className="cx-segmented">
          {PLATFORMS.map((p) => {
            const active = p === activePlatform
            return (
              <button
                key={p}
                onClick={() => setActivePlatform(p)}
                className={`cx-seg-tab ${active ? 'cx-seg-active' : ''}`}
                data-testid={`carousel-platform-${p.toLowerCase()}`}
              >
                <PlatformIcon platform={p} />
                {p}
              </button>
            )
          })}
        </div>
        <button className="cx-niche-chip" data-testid="carousel-niche-badge" onClick={onOpenSetup} type="button">
          <Flame width="12" height="12" style={{ color: 'var(--cx-warn)' }} />
          Niche: {niche}
        </button>
      </div>

      {/* Error */}
      {error && !isLoading && (
        <div
          data-testid="carousel-error-banner"
          style={{
            display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
            gap: 12, padding: 14, borderRadius: 12,
            background: '#FEF2F2', border: '1px solid #FECACA',
          }}
        >
          <div style={{ display: 'flex', gap: 8 }}>
            <AlertCircle width="16" height="16" style={{ color: '#DC2626', marginTop: 2 }} />
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#DC2626' }}>Couldn&apos;t load ideas</div>
              <div style={{ fontSize: 12, color: 'var(--cx-ink-3)' }}>{error}</div>
            </div>
          </div>
          <button onClick={handleRetry} className="cx-btn-ghost" data-testid="carousel-retry-btn">
            <RefreshCw width="14" height="14" /> Retry
          </button>
        </div>
      )}

      {/* Skeletons */}
      {isLoading && (
        <div className="cx-grid-3" data-testid="carousel-skeleton" style={{ minHeight: 520 }}>
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="cx-skeleton" style={{ height: 240 }} data-testid={`carousel-skeleton-${i}`} />
          ))}
        </div>
      )}

      {/* Ideas */}
      {!isLoading && ideas.length > 0 && (
        <div className="cx-grid-3" data-testid="carousel-ideas-grid">
          {ideas.map((idea) => (
            <article
              key={idea.id}
              className="cx-idea-card"
              data-testid={`carousel-idea-card-${idea.id}`}
            >
              <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className={BADGE_CLASS[idea.format]} data-testid="carousel-idea-format">
                  {idea.format}
                </span>
                <span className={scoreClass(idea.engagementScore)} data-testid="carousel-idea-score">
                  <Zap />
                  {idea.engagementScore.toFixed(1)}
                  <span className="cx-score-sub">/10</span>
                </span>
              </header>

              <h4 className="cx-idea-title" data-testid="carousel-idea-title">
                {idea.title}
              </h4>

              <div className="cx-idea-quote" data-testid="carousel-idea-hook">
                First slide: “{idea.hook}”
              </div>

              {idea.trendingTag && (
                <span className="cx-hashtag-pill" data-testid="carousel-idea-trending">
                  <Flame /> {idea.trendingTag.startsWith('#') ? idea.trendingTag : `#${idea.trendingTag}`}
                </span>
              )}

              <div className="cx-card-foot">
                <span data-testid="carousel-idea-slides">
                  Recommended: {idea.slides} slides
                </span>
                <button
                  onClick={() => handleCreate(idea)}
                  className="cx-gen-link"
                  data-testid={`carousel-generate-btn-${idea.id}`}
                >
                  Generate Carousel <ArrowRight />
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
