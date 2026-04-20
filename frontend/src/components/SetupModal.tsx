'use client'

import { useEffect, useMemo, useState, useCallback } from 'react'
import { createPortal } from 'react-dom'
import {
  Instagram,
  Linkedin,
  Youtube,
  Music2,
  Twitter,
  Pin,
  X,
  ArrowRight,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  Sparkles,
} from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { useUserPreferences } from '@/context/UserPreferencesContext'
import { useToast } from '@/lib/toast'
import type { HomePlatform } from '@/types/content'

const PLATFORMS: { name: HomePlatform; icon: JSX.Element }[] = [
  { name: 'Instagram', icon: <Instagram className="w-6 h-6" /> },
  { name: 'TikTok', icon: <Music2 className="w-6 h-6" /> },
  { name: 'LinkedIn', icon: <Linkedin className="w-6 h-6" /> },
  { name: 'Pinterest', icon: <Pin className="w-6 h-6" /> },
  { name: 'YouTube', icon: <Youtube className="w-6 h-6" /> },
  { name: 'Twitter/X', icon: <Twitter className="w-6 h-6" /> },
]

const NICHES = [
  'Finance',
  'Health & Fitness',
  'Business',
  'Fashion',
  'Food',
  'Travel',
  'Tech',
  'Education',
  'Lifestyle',
  'Beauty',
  'Gaming',
  'Real Estate',
  'Other',
]

const SESSION_SHOWN_KEY = 'cx_setup_modal_shown'

export default function SetupModal({
  open,
  onOpen,
  onClose,
}: {
  open: boolean
  onOpen: () => void
  onClose: () => void
}) {
  const { user } = useAuth()
  const { toast } = useToast()
  const {
    platform: existingPlatform,
    niche: existingNiche,
    isSetupComplete,
    isLoading: prefsLoading,
    savePreferences,
    refetch,
  } = useUserPreferences()

  const [step, setStep] = useState<1 | 2>(1)
  const [selectedPlatform, setSelectedPlatform] = useState<HomePlatform | null>(null)
  const [selectedNiche, setSelectedNiche] = useState<string | null>(null)
  const [customNiche, setCustomNiche] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  // Initialize from existing prefs
  useEffect(() => {
    if (!open) return
    if (existingPlatform && PLATFORMS.some((p) => p.name === existingPlatform)) {
      setSelectedPlatform(existingPlatform as HomePlatform)
    }
    if (existingNiche) {
      if (NICHES.includes(existingNiche)) {
        setSelectedNiche(existingNiche)
      } else {
        setSelectedNiche('Other')
        setCustomNiche(existingNiche)
      }
    }
  }, [open, existingPlatform, existingNiche])

  // Auto-open for first-time users (500ms after prefs load)
  useEffect(() => {
    if (prefsLoading) return
    if (!user) return
    if (isSetupComplete) return
    if (typeof window === 'undefined') return
    if (window.sessionStorage.getItem(SESSION_SHOWN_KEY) === '1') return
    const t = window.setTimeout(() => {
      window.sessionStorage.setItem(SESSION_SHOWN_KEY, '1')
      onOpen()
    }, 500)
    return () => window.clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefsLoading, user, isSetupComplete])

  // ESC key to close (step 2 only, with confirmation)
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      if (step === 1) return
      const ok = window.confirm('You can complete this later in settings. Close setup?')
      if (ok) onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, step, onClose])

  const effectiveNiche = useMemo(() => {
    if (selectedNiche === 'Other') return customNiche.trim()
    return selectedNiche || ''
  }, [selectedNiche, customNiche])

  const canContinueStep1 = !!selectedPlatform
  const canSave = !!selectedPlatform && effectiveNiche.length > 0 && !isSaving

  const handleSave = useCallback(async () => {
    if (!canSave || !selectedPlatform) return
    setIsSaving(true)
    setSaveError(null)
    const res = await savePreferences({
      platform: selectedPlatform,
      niche: effectiveNiche,
      isSetupComplete: true,
    })
    setIsSaving(false)
    if (!res.ok) {
      setSaveError(res.error || 'Failed to save. Please try again.')
      return
    }
    toast('Profile saved! Finding your trends…', 'success')
    await refetch()
    onClose()
  }, [canSave, selectedPlatform, effectiveNiche, savePreferences, toast, refetch, onClose])

  const handleBackdrop = () => {
    if (step === 1) return // forced onboarding
    const ok = window.confirm('You can complete this later in settings. Close setup?')
    if (ok) onClose()
  }

  if (!mounted || !open) return null

  const modal = (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ background: 'rgba(13,14,20,0.55)', backdropFilter: 'blur(4px)' }}
      onClick={handleBackdrop}
      data-testid="setup-modal-overlay"
    >
      <div
        className="w-full max-w-md mx-4 rounded-[24px] overflow-hidden"
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--ink-200)',
          boxShadow: 'var(--shadow-lg)',
        }}
        onClick={(e) => e.stopPropagation()}
        data-testid="setup-modal-card"
      >
        {/* Header */}
        <div
          className="relative px-8 pt-8 pb-5"
          style={{ background: 'var(--d-gradient-surface)' }}
        >
          {step === 2 && (
            <button
              onClick={() => {
                const ok = window.confirm(
                  'You can complete this later in settings. Close setup?',
                )
                if (ok) onClose()
              }}
              className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-[var(--ink-100)]"
              aria-label="Close"
              data-testid="setup-modal-close-btn"
            >
              <X className="w-4 h-4" style={{ color: 'var(--ink-400)' }} />
            </button>
          )}
          <div className="flex items-center gap-2 mb-3">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'var(--brand-gradient)' }}
            >
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span
              className="text-[11px] font-bold uppercase tracking-[0.12em]"
              style={{ color: 'var(--brand-primary)' }}
            >
              Step {step} of 2
            </span>
          </div>
          <h2
            className="text-[22px] font-bold leading-tight"
            style={{ color: 'var(--ink-900)', fontFamily: 'var(--font-display)' }}
            data-testid="setup-modal-heading"
          >
            {step === 1
              ? 'Welcome! Let’s personalize your experience'
              : 'What’s your content niche?'}
          </h2>
          <p className="text-[13px] mt-2" style={{ color: 'var(--ink-400)' }}>
            {step === 1
              ? 'Select the platform you primarily create content for.'
              : 'This helps us find the most relevant trending ideas for you.'}
          </p>
          {/* Progress dots */}
          <div className="flex items-center gap-1.5 mt-4">
            <span
              className="h-1.5 rounded-full transition-all"
              style={{
                width: step === 1 ? 24 : 16,
                background:
                  step === 1 ? 'var(--brand-primary)' : 'var(--brand-primary)',
              }}
            />
            <span
              className="h-1.5 rounded-full transition-all"
              style={{
                width: step === 2 ? 24 : 16,
                background: step === 2 ? 'var(--brand-primary)' : 'var(--ink-200)',
              }}
            />
          </div>
        </div>

        {/* Body */}
        <div className="px-8 py-6">
          {step === 1 && (
            <div
              className="grid grid-cols-2 sm:grid-cols-3 gap-3"
              data-testid="setup-modal-platform-grid"
            >
              {PLATFORMS.map((p) => {
                const active = selectedPlatform === p.name
                return (
                  <button
                    key={p.name}
                    onClick={() => setSelectedPlatform(p.name)}
                    data-testid={`setup-platform-${p.name.toLowerCase().replace(/\W/g, '-')}`}
                    className="flex flex-col items-center justify-center gap-2 rounded-xl border px-3 py-4 transition-all"
                    style={{
                      borderColor: active ? 'var(--brand-primary)' : 'var(--ink-200)',
                      background: active ? 'var(--brand-soft)' : 'var(--bg-card)',
                      color: active ? 'var(--brand-primary)' : 'var(--ink-800)',
                      boxShadow: active
                        ? '0 0 0 3px rgba(91,63,232,0.1)'
                        : 'none',
                    }}
                  >
                    {p.icon}
                    <span className="text-[12px] font-semibold">{p.name}</span>
                    {active && (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    )}
                  </button>
                )
              })}
            </div>
          )}

          {step === 2 && (
            <div
              className="flex flex-wrap gap-2 max-h-[260px] overflow-y-auto pr-1"
              data-testid="setup-modal-niche-grid"
            >
              {NICHES.map((n) => {
                const active = selectedNiche === n
                return (
                  <button
                    key={n}
                    onClick={() => setSelectedNiche(n)}
                    data-testid={`setup-niche-${n.toLowerCase().replace(/[\s&]+/g, '-')}`}
                    className="inline-flex items-center px-3.5 py-1.5 rounded-full text-[12px] font-semibold border transition-all"
                    style={{
                      borderColor: active ? 'var(--brand-primary)' : 'var(--ink-200)',
                      background: active ? 'var(--brand-soft)' : 'var(--bg-card)',
                      color: active ? 'var(--brand-primary)' : 'var(--ink-600)',
                    }}
                  >
                    {n}
                  </button>
                )
              })}
              {selectedNiche === 'Other' && (
                <div className="w-full mt-2">
                  <input
                    type="text"
                    value={customNiche}
                    onChange={(e) => setCustomNiche(e.target.value)}
                    placeholder="Describe your niche"
                    className="d-input text-[14px]"
                    data-testid="setup-custom-niche-input"
                  />
                </div>
              )}
            </div>
          )}

          {saveError && (
            <p
              className="mt-4 text-[12px] rounded-lg px-3 py-2"
              style={{
                background: 'var(--red-50)',
                color: 'var(--red-500)',
                border: '1px solid rgba(239,68,68,0.2)',
              }}
              data-testid="setup-modal-error"
            >
              {saveError}
            </p>
          )}
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-between gap-3 px-8 py-5 border-t"
          style={{ borderColor: 'var(--ink-200)' }}
        >
          {step === 1 ? (
            <span className="text-[11px]" style={{ color: 'var(--ink-400)' }}>
              {selectedPlatform ? `Selected: ${selectedPlatform}` : 'Pick a platform'}
            </span>
          ) : (
            <button
              onClick={() => setStep(1)}
              className="d-btn-ghost !text-[13px]"
              data-testid="setup-modal-back-btn"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back
            </button>
          )}
          {step === 1 ? (
            <button
              onClick={() => setStep(2)}
              disabled={!canContinueStep1}
              className="d-btn-primary disabled:opacity-40 disabled:cursor-not-allowed"
              data-testid="setup-modal-continue-btn"
            >
              Continue <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleSave}
              disabled={!canSave}
              className="d-btn-primary disabled:opacity-40 disabled:cursor-not-allowed"
              data-testid="setup-modal-save-btn"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving…
                </>
              ) : (
                <>
                  Save & Continue <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  )

  return createPortal(modal, document.body)
}
