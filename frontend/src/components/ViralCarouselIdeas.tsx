'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  Flame,
  ArrowRight,
  Zap,
  AlertCircle,
  RefreshCw,
  Sparkles,
  Instagram,
  Linkedin,
  Youtube,
} from 'lucide-react'
import type { CarouselIdea, HomePlatform } from '@/types/content'
import { useUserPreferences } from '@/context/UserPreferencesContext'
import SkeletonCard from '@/components/ui/SkeletonCard'
import PillBadge from '@/components/ui/PillBadge'

const BACKEND_URL = process.env.NEXT_PUBLIC_APP_URL || ''

const PLATFORMS: HomePlatform[] = [
  'Instagram',
  'TikTok',
  'LinkedIn',
  'Pinterest',
  'YouTube',
]

const FORMAT_TONE: Record<CarouselIdea['format'], 'brand' | 'blue' | 'green' | 'amber' | 'red'> = {
  Educational: 'blue',
  Story: 'brand',
  Tips: 'green',
  Listicle: 'amber',
  Comparison: 'red',
}

function PlatformIcon({ platform }: { platform: string }) {
  if (platform === 'Instagram') return <Instagram className="w-3.5 h-3.5" />
  if (platform === 'LinkedIn') return <Linkedin className="w-3.5 h-3.5" />
  if (platform === 'YouTube') return <Youtube className="w-3.5 h-3.5" />
  return <Sparkles className="w-3.5 h-3.5" />
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

  useEffect(() => {
    setActivePlatform(defaultPlatform)
  }, [defaultPlatform])

  const fetchIdeas = useCallback(
    async (plat: HomePlatform, targetNiche: string) => {
      setIsLoading(true)
      setError(null)
      try {
        const url = `${BACKEND_URL}/api/carousel-ideas?platform=${encodeURIComponent(
          plat,
        )}&niche=${encodeURIComponent(targetNiche)}`
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
        const list: CarouselIdea[] = Array.isArray(data?.ideas) ? data.ideas : []
        setIdeas(list)
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load ideas'
        setError(message)
      } finally {
        setIsLoading(false)
      }
    },
    [],
  )

  useEffect(() => {
    if (prefsLoading) return
    if (!isSetupComplete || !niche) return
    fetchIdeas(activePlatform, niche)
  }, [prefsLoading, isSetupComplete, niche, activePlatform, fetchIdeas])

  const handlePlatformChange = (p: HomePlatform) => {
    setActivePlatform(p)
  }

  const handleCreate = (idea: CarouselIdea) => {
    const params = new URLSearchParams({
      topic: idea.title,
      hook: idea.hook,
      platform: activePlatform,
      type: 'carousel',
    })
    router.push(`/dashboard/create?${params.toString()}`)
  }

  const handleRetry = () => {
    if (niche) fetchIdeas(activePlatform, niche)
  }

  // Empty/not-set-up state
  if (!prefsLoading && (!isSetupComplete || !niche)) {
    return (
      <div
        className="d-card !p-10 text-center flex flex-col items-center gap-4"
        data-testid="carousel-ideas-empty"
        style={{ minHeight: 300 }}
      >
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center"
          style={{ background: 'var(--brand-soft)' }}
        >
          <Sparkles className="w-7 h-7" style={{ color: 'var(--brand-primary)' }} />
        </div>
        <div>
          <h3
            className="text-[18px] font-bold"
            style={{ color: 'var(--ink-900)', fontFamily: 'var(--font-display)' }}
          >
            Set up your profile to see personalized ideas
          </h3>
          <p className="text-[13px] mt-1" style={{ color: 'var(--ink-400)' }}>
            Tell us your platform and niche — we&apos;ll craft trending carousels for you.
          </p>
        </div>
        <button
          onClick={onOpenSetup}
          className="d-btn-primary"
          data-testid="carousel-ideas-setup-btn"
        >
          <Sparkles className="w-4 h-4" />
          Set Up Now
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-5" data-testid="viral-carousel-ideas-section">
      {/* Platform filter bar */}
      <div
        className="flex items-center gap-2 overflow-x-auto hide-scrollbar pb-1"
        data-testid="carousel-platform-bar"
      >
        {PLATFORMS.map((p) => {
          const selected = p === activePlatform
          return (
            <button
              key={p}
              onClick={() => handlePlatformChange(p)}
              data-testid={`carousel-platform-${p.toLowerCase()}`}
              className={`shrink-0 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[12px] font-semibold border transition-all ${
                selected
                  ? 'text-white'
                  : 'hover:border-[var(--brand-primary)] hover:text-[var(--brand-primary)]'
              }`}
              style={
                selected
                  ? {
                      background: 'var(--brand-gradient)',
                      borderColor: 'transparent',
                      boxShadow: 'var(--shadow-brand)',
                    }
                  : { borderColor: 'var(--ink-200)', color: 'var(--ink-600)' }
              }
            >
              <PlatformIcon platform={p} />
              {p}
            </button>
          )
        })}
        <div className="flex-1" />
        <PillBadge tone="brand" data-testid="carousel-niche-badge">
          <Flame className="w-3 h-3" /> Niche: {niche}
        </PillBadge>
      </div>

      {/* Error banner */}
      {error && !isLoading && (
        <div
          className="d-card !p-4 flex items-start justify-between gap-3 border"
          style={{ background: 'var(--red-50)', borderColor: 'rgba(239,68,68,0.25)' }}
          data-testid="carousel-error-banner"
        >
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 mt-0.5" style={{ color: 'var(--red-500)' }} />
            <div>
              <p className="text-[13px] font-semibold" style={{ color: 'var(--red-500)' }}>
                Couldn&apos;t load ideas
              </p>
              <p className="text-[12px]" style={{ color: 'var(--ink-600)' }}>
                {error}
              </p>
            </div>
          </div>
          <button
            onClick={handleRetry}
            className="d-btn-ghost !text-[12px] !px-3 !py-1.5"
            data-testid="carousel-retry-btn"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Retry
          </button>
        </div>
      )}

      {/* Skeletons */}
      {isLoading && (
        <div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          data-testid="carousel-skeleton"
          style={{ minHeight: 520 }}
        >
          {Array.from({ length: 7 }).map((_, i) => (
            <SkeletonCard key={i} height={220} data-testid={`carousel-skeleton-${i}`} />
          ))}
        </div>
      )}

      {/* Ideas grid */}
      {!isLoading && ideas.length > 0 && (
        <div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          data-testid="carousel-ideas-grid"
        >
          {ideas.map((idea) => (
            <div
              key={idea.id}
              className="d-card !p-5 flex flex-col gap-3 transition-all hover:-translate-y-0.5"
              data-testid={`carousel-idea-card-${idea.id}`}
            >
              <div className="flex items-center justify-between gap-2">
                <PillBadge tone={FORMAT_TONE[idea.format]} data-testid="carousel-idea-format">
                  {idea.format}
                </PillBadge>
                <span
                  className="inline-flex items-center gap-1 text-[12px] font-bold"
                  style={{ color: 'var(--ink-800)' }}
                  data-testid="carousel-idea-score"
                >
                  <Zap className="w-3.5 h-3.5" style={{ color: 'var(--amber-500)' }} />
                  {idea.engagementScore.toFixed(1)}/10
                </span>
              </div>

              <h4
                className="text-[16px] font-bold leading-snug"
                style={{ color: 'var(--ink-900)', fontFamily: 'var(--font-display)' }}
                data-testid="carousel-idea-title"
              >
                {idea.title}
              </h4>

              <p
                className="text-[13px] italic leading-relaxed"
                style={{ color: 'var(--ink-400)' }}
                data-testid="carousel-idea-hook"
              >
                First slide: &ldquo;{idea.hook}&rdquo;
              </p>

              {idea.trendingTag && (
                <PillBadge tone="amber" data-testid="carousel-idea-trending">
                  <Flame className="w-3 h-3" /> {idea.trendingTag}
                </PillBadge>
              )}

              <div className="flex items-center justify-between pt-2 mt-auto border-t" style={{ borderColor: 'var(--ink-200)' }}>
                <span
                  className="text-[11px] font-semibold"
                  style={{ color: 'var(--ink-400)' }}
                  data-testid="carousel-idea-slides"
                >
                  Recommended: {idea.slides} slides
                </span>
                <button
                  onClick={() => handleCreate(idea)}
                  data-testid={`carousel-generate-btn-${idea.id}`}
                  className="inline-flex items-center gap-1 text-[12px] font-bold"
                  style={{ color: 'var(--brand-primary)' }}
                >
                  Generate Carousel <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
