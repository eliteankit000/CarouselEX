'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Palette, Save, Info } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { useToast } from '@/lib/toast'

const BACKEND_URL = process.env.NEXT_PUBLIC_APP_URL || ''

const TONE_OPTIONS = [
  'Bold & Direct',
  'Calm & Trustworthy',
  'Premium & Authoritative',
  'Friendly & Casual',
  'Energetic & Hype',
]

const WRITING_STYLE_OPTIONS = [
  'Short punchy sentences',
  'Long-form storytelling',
  'Data-driven & factual',
  'Conversational',
  'Educational step-by-step',
]

export default function BrandStylePage() {
  const { user } = useAuth()
  const { toast } = useToast()

  const [tone, setTone] = useState('Bold & Direct')
  const [writingStyle, setWritingStyle] = useState('Short punchy sentences')
  const [niche, setNiche] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch(`${BACKEND_URL}/api/brand?userId=${user?.id || 'demo-user-001'}`)
      .then(r => r.json())
      .then(d => {
        if (d.success && d.data) {
          setTone(d.data.tone || 'Bold & Direct')
          setWritingStyle(d.data.writingStyle || 'Short punchy sentences')
          setNiche(d.data.niche || '')
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [user])

  const handleSave = useCallback(async () => {
    setSaving(true)
    try {
      const res = await fetch(`${BACKEND_URL}/api/brand`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id || 'demo-user-001',
          tone,
          writingStyle,
          niche,
        }),
      })
      if (!res.ok) throw new Error('Save failed')
      toast('Brand style saved!')
    } catch {
      toast('Save failed', 'error')
    } finally {
      setSaving(false)
    }
  }, [user, tone, writingStyle, niche, toast])

  if (loading) {
    return (
      <div className="space-y-6 max-w-2xl mx-auto">
        <div className="d-skeleton h-8 w-48" />
        <div className="d-skeleton h-64 w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto d-page-enter" data-testid="brand-style-page">
      <div>
        <h1 className="text-[24px] font-bold" style={{ color: 'var(--ink-900)' }}>Brand Style</h1>
        <p className="text-[14px] mt-1" style={{ color: 'var(--ink-400)' }}>Set your brand voice so every piece of content sounds like you</p>
      </div>

      <div className="d-card space-y-6" data-testid="brand-style-form">
        {/* Tone */}
        <div data-testid="brand-tone-section">
          <label className="text-[11px] font-medium uppercase tracking-wider mb-3 block" style={{ color: 'var(--ink-400)' }}>Content Tone</label>
          <div className="flex flex-wrap gap-2">
            {TONE_OPTIONS.map(t => (
              <button
                key={t}
                onClick={() => setTone(t)}
                className={`px-4 py-2.5 rounded-xl text-[13px] font-semibold border transition-all ${
                  tone === t
                    ? 'border-[var(--brand-primary)] bg-[var(--brand-soft)]'
                    : 'border-[var(--ink-200)] hover:border-[var(--ink-400)]'
                }`}
                style={{ color: tone === t ? 'var(--brand-primary)' : 'var(--ink-600)' }}
                data-testid={`tone-${t.toLowerCase().replace(/\s+/g, '-')}`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Writing Style */}
        <div data-testid="brand-writing-style-section">
          <label className="text-[11px] font-medium uppercase tracking-wider mb-3 block" style={{ color: 'var(--ink-400)' }}>Writing Style</label>
          <div className="flex flex-wrap gap-2">
            {WRITING_STYLE_OPTIONS.map(ws => (
              <button
                key={ws}
                onClick={() => setWritingStyle(ws)}
                className={`px-4 py-2.5 rounded-xl text-[13px] font-semibold border transition-all ${
                  writingStyle === ws
                    ? 'border-[var(--brand-primary)] bg-[var(--brand-soft)]'
                    : 'border-[var(--ink-200)] hover:border-[var(--ink-400)]'
                }`}
                style={{ color: writingStyle === ws ? 'var(--brand-primary)' : 'var(--ink-600)' }}
                data-testid={`style-${ws.toLowerCase().replace(/[\s&]+/g, '-')}`}
              >
                {ws}
              </button>
            ))}
          </div>
        </div>

        {/* Niche */}
        <div data-testid="brand-niche-section">
          <label className="text-[11px] font-medium uppercase tracking-wider mb-2 block" style={{ color: 'var(--ink-400)' }}>Your Niche</label>
          <input
            value={niche}
            onChange={e => setNiche(e.target.value)}
            placeholder="e.g. fitness, finance, marketing, tech, real estate..."
            className="d-input"
            data-testid="niche-input"
          />
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="d-btn-primary"
          data-testid="save-brand-style-btn"
        >
          {saving ? (
            <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Saving...</>
          ) : (
            <><Save className="w-4 h-4" /> Save Brand Style</>
          )}
        </button>
      </div>

      {/* Info Card */}
      <div className="d-card flex items-start gap-3" style={{ background: 'var(--brand-soft)', borderColor: 'rgba(91,63,232,0.2)' }} data-testid="brand-info-card">
        <Info className="w-5 h-5 shrink-0 mt-0.5" style={{ color: 'var(--brand-primary)' }} />
        <p className="text-[13px]" style={{ color: 'var(--ink-600)' }}>
          Your brand style is applied automatically to every piece of content you generate.
        </p>
      </div>
    </div>
  )
}
