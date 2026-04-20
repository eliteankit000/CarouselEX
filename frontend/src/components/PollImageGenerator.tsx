'use client'

import { useRef, useCallback } from 'react'
import { Sparkles, Download, RefreshCw, Zap, Palette, Check, Plus, Trash2 } from 'lucide-react'
import { toPng } from 'html-to-image'
import { usePollContentStore, type PollHook, type PollTheme } from '@/store/pollContentStore'
import { useHistoryStore } from '@/store/historyStore'
import { useToast } from '@/lib/toast'
import type { Platform } from '@/types'

const BACKEND_URL = process.env.NEXT_PUBLIC_APP_URL || ''

const PLATFORMS: { id: Platform; label: string }[] = [
  { id: 'linkedin', label: 'LinkedIn' },
  { id: 'instagram', label: 'Instagram' },
  { id: 'x', label: 'X / Twitter' },
  { id: 'tiktok', label: 'TikTok' },
]

const FONT_OPTIONS = ['Plus Jakarta Sans', 'DM Sans', 'Inter', 'Georgia', 'JetBrains Mono']

const THEMES: { id: PollTheme; label: string; colors: { bg: string; card: string; text: string; accent: string; muted: string; optBg: string; optBorder: string } }[] = [
  { id: 'minimal', label: 'Minimal', colors: { bg: '#FFFFFF', card: '#FFFFFF', text: '#0D0E14', accent: '#5B3FE8', muted: '#6B7280', optBg: '#F5F7FF', optBorder: '#E5E7EB' } },
  { id: 'gradient', label: 'Gradient', colors: { bg: 'linear-gradient(145deg, #4F46E5 0%, #7C3AED 40%, #A855F7 100%)', card: 'transparent', text: '#FFFFFF', accent: '#FDE68A', muted: 'rgba(255,255,255,0.7)', optBg: 'rgba(255,255,255,0.15)', optBorder: 'rgba(255,255,255,0.25)' } },
  { id: 'dark', label: 'Dark', colors: { bg: '#0F0F14', card: '#0F0F14', text: '#F4F4F5', accent: '#818CF8', muted: '#9CA3AF', optBg: 'rgba(255,255,255,0.06)', optBorder: 'rgba(255,255,255,0.12)' } },
  { id: 'bold', label: 'Bold', colors: { bg: '#FEF3C7', card: '#FEF3C7', text: '#0F172A', accent: '#DC2626', muted: '#475569', optBg: '#FFFFFF', optBorder: '#F59E0B' } },
  { id: 'neon', label: 'Neon', colors: { bg: 'linear-gradient(145deg, #0A0A1A 0%, #1A0A2E 100%)', card: 'transparent', text: '#E0E7FF', accent: '#22D3EE', muted: 'rgba(224,231,255,0.5)', optBg: 'rgba(34,211,238,0.08)', optBorder: 'rgba(34,211,238,0.25)' } },
  { id: 'pastel', label: 'Pastel', colors: { bg: 'linear-gradient(145deg, #FDF2F8 0%, #EDE9FE 50%, #DBEAFE 100%)', card: 'transparent', text: '#1E1B4B', accent: '#7C3AED', muted: '#6B7280', optBg: 'rgba(255,255,255,0.6)', optBorder: 'rgba(124,58,237,0.2)' } },
]

function getTheme(id: PollTheme) {
  return THEMES.find(t => t.id === id) || THEMES[1]
}

/* ============ POLL IMAGE PREVIEW ============ */
function PollImagePreview({ hook, question, options, cta, theme, fontFamily, fontSize }: {
  hook: string; question: string; options: string[]; cta: string; theme: PollTheme; fontFamily: string; fontSize: number
}) {
  const t = getTheme(theme)
  const scale = fontSize / 100

  return (
    <div
      style={{
        width: 540, height: 540,
        background: t.colors.bg,
        padding: 48,
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        fontFamily: `'${fontFamily}', system-ui, sans-serif`,
        position: 'relative', overflow: 'hidden',
      }}
    >
      {theme === 'gradient' && (
        <>
          <div style={{ position: 'absolute', top: -60, right: -60, width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', filter: 'blur(40px)' }} />
          <div style={{ position: 'absolute', bottom: -40, left: -40, width: 160, height: 160, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', filter: 'blur(30px)' }} />
        </>
      )}
      {theme === 'dark' && (
        <div style={{ position: 'absolute', top: '30%', left: '50%', transform: 'translate(-50%, -50%)', width: 300, height: 300, borderRadius: '50%', background: 'rgba(99,102,241,0.12)', filter: 'blur(60px)' }} />
      )}
      {theme === 'neon' && (
        <>
          <div style={{ position: 'absolute', top: -40, right: -40, width: 200, height: 200, borderRadius: '50%', background: 'rgba(34,211,238,0.1)', filter: 'blur(50px)' }} />
          <div style={{ position: 'absolute', bottom: -30, left: '30%', width: 160, height: 160, borderRadius: '50%', background: 'rgba(168,85,247,0.1)', filter: 'blur(40px)' }} />
        </>
      )}

      <div style={{ position: 'relative', zIndex: 1, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        {/* Hook */}
        <div>
          <p style={{
            fontSize: 14 * scale, fontWeight: 700, color: t.colors.accent,
            letterSpacing: '0.05em', textTransform: 'uppercase' as const, marginBottom: 16,
          }}>
            VIRAL POLL
          </p>
          <p style={{
            fontSize: 20 * scale, fontWeight: 800, color: t.colors.text,
            lineHeight: 1.3, letterSpacing: '-0.02em', marginBottom: 8,
          }}>
            {hook || 'Your hook goes here...'}
          </p>
        </div>

        {/* Question */}
        <div style={{ margin: '16px 0' }}>
          <p style={{
            fontSize: 24 * scale, fontWeight: 700, color: t.colors.text,
            lineHeight: 1.25, letterSpacing: '-0.015em',
          }}>
            {question || 'Your question here?'}
          </p>
        </div>

        {/* Options */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {(options.length > 0 ? options : ['Option A', 'Option B']).map((opt, i) => (
            <div key={`opt-${i}`} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '12px 16px',
              background: t.colors.optBg,
              border: `1.5px solid ${t.colors.optBorder}`,
              borderRadius: 12,
            }}>
              <div style={{
                width: 24, height: 24, borderRadius: '50%',
                border: `2px solid ${t.colors.accent}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: t.colors.accent }}>
                  {String.fromCharCode(65 + i)}
                </span>
              </div>
              <span style={{ fontSize: 15 * scale, fontWeight: 600, color: t.colors.text }}>{opt}</span>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div style={{ marginTop: 20 }}>
          <p style={{
            fontSize: 13 * scale, fontWeight: 700, color: t.colors.accent,
            letterSpacing: '0.02em',
          }}>
            {cta || 'Comment below to get the full system'}
          </p>
        </div>
      </div>
    </div>
  )
}

/* ============ LOADING STEPS ============ */
function LoadingOverlay({ step }: { step: string }) {
  const steps = [
    { label: 'Analyzing idea...', icon: '1' },
    { label: 'Generating hooks...', icon: '2' },
    { label: 'Building poll...', icon: '3' },
    { label: 'Finalizing content...', icon: '4' },
  ]
  const activeIdx = steps.findIndex(s => s.label === step)

  return (
    <div className="d-card flex flex-col items-center py-12 px-8" data-testid="poll-loading">
      <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6"
        style={{ background: 'var(--brand-gradient)' }}>
        <Sparkles className="w-7 h-7 text-white animate-pulse" />
      </div>
      <h3 className="text-[18px] font-bold mb-2" style={{ color: 'var(--ink-900)' }}>Generating your viral poll...</h3>
      <p className="text-[13px] mb-8" style={{ color: 'var(--ink-400)' }}>Powered by GPT-5.2</p>
      <div className="w-full max-w-xs space-y-3">
        {steps.map((s, i) => (
          <div key={s.label} className="flex items-center gap-3" data-testid={`loading-step-${i}`}>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[12px] font-bold transition-all ${
              i <= activeIdx ? 'scale-100 opacity-100' : 'scale-90 opacity-40'
            }`} style={{
              background: i < activeIdx ? 'var(--green-50)' : i === activeIdx ? 'var(--brand-soft)' : 'var(--ink-100)',
              border: i === activeIdx ? '1px solid rgba(91,63,232,0.3)' : '1px solid transparent',
              color: i < activeIdx ? 'var(--green-500)' : i === activeIdx ? 'var(--brand-primary)' : 'var(--ink-400)',
            }}>
              {i < activeIdx ? <Check className="w-4 h-4" /> : s.icon}
            </div>
            <span className={`text-[14px] font-medium transition-all ${i <= activeIdx ? '' : 'opacity-40'}`}
              style={{ color: i <= activeIdx ? 'var(--ink-900)' : 'var(--ink-400)' }}>
              {s.label}
            </span>
            {i === activeIdx && (
              <div className="ml-auto w-4 h-4 border-2 border-t-transparent rounded-full animate-spin"
                style={{ borderColor: 'var(--brand-primary)', borderTopColor: 'transparent' }} />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

/* ============ SCORE BADGE ============ */
function ScoreBadge({ score }: { score: number }) {
  const color = score >= 9 ? 'var(--green-500)' : score >= 7.5 ? 'var(--brand-primary)' : 'var(--amber-500)'
  const bg = score >= 9 ? 'var(--green-50)' : score >= 7.5 ? 'var(--brand-soft)' : 'rgba(245,158,11,0.1)'
  return (
    <span className="text-[11px] font-bold px-2 py-0.5 rounded" style={{ color, background: bg }}>
      {score.toFixed(1)}
    </span>
  )
}

/* ============ MAIN COMPONENT ============ */
export default function PollImageGenerator() {
  const store = usePollContentStore()
  const history = useHistoryStore()
  const { toast } = useToast()
  const imageRef = useRef<HTMLDivElement>(null)

  const handleGenerate = useCallback(async () => {
    store.setLoading(true)
    store.setLoadingStep('Analyzing idea...')

    try {
      const stepTimer1 = setTimeout(() => store.setLoadingStep('Generating hooks...'), 1500)
      const stepTimer2 = setTimeout(() => store.setLoadingStep('Building poll...'), 3000)
      const stepTimer3 = setTimeout(() => store.setLoadingStep('Finalizing content...'), 5000)

      const res = await fetch(`${BACKEND_URL}/api/generate-poll-content`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idea: store.idea, platform: store.platform }),
      })

      clearTimeout(stepTimer1)
      clearTimeout(stepTimer2)
      clearTimeout(stepTimer3)

      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: 'Generation failed' }))
        throw new Error(err.detail || 'Generation failed')
      }

      const data = await res.json()

      store.setHooks(data.hooks || [])
      store.setQuestion(data.question || '')
      store.setOptions(data.options || [])
      store.setCta(data.cta || '')
      store.setCaption(data.caption || '')

      if (data.hooks?.length > 0) {
        const best = [...data.hooks].sort((a: PollHook, b: PollHook) => b.score - a.score)[0]
        store.setSelectedHook(best)
      }

      store.setStep('editor')
      toast('Viral poll generated!')
    } catch (err: any) {
      toast(err.message || 'Failed to generate. Try again.', 'error')
    } finally {
      store.setLoading(false)
      store.setLoadingStep('')
    }
  }, [store, toast])

  const handleDownload = useCallback(async () => {
    if (!imageRef.current) return
    try {
      const dataUrl = await toPng(imageRef.current, {
        width: 1080, height: 1080,
        pixelRatio: 2,
        style: { transform: 'scale(2)', transformOrigin: 'top left' },
      })
      const link = document.createElement('a')
      link.download = `poll-${Date.now()}.png`
      link.href = dataUrl
      link.click()

      // Save to history
      history.addItem({
        type: 'poll',
        platform: store.platform,
        title: store.question || 'Poll Image',
        preview: `${store.selectedHook?.text || ''} - ${store.question}`,
        data: {
          hooks: store.hooks,
          selectedHook: store.selectedHook,
          question: store.question,
          options: store.options,
          cta: store.cta,
          caption: store.caption,
          theme: store.theme,
          fontFamily: store.fontFamily,
          platform: store.platform,
        },
      })

      toast('Image downloaded & saved to history!')
    } catch {
      toast('Download failed. Try again.', 'error')
    }
  }, [store, history, toast])

  const handleRegenerate = useCallback(() => {
    store.setStep('input')
    store.setLoading(false)
  }, [store])

  /* ========== INPUT STEP ========== */
  if (store.step === 'input') {
    if (store.loading) {
      return <LoadingOverlay step={store.loadingStep} />
    }

    return (
      <div className="space-y-6 max-w-2xl mx-auto" data-testid="poll-input-step">
        <div className="d-card" data-testid="poll-idea-card">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'var(--brand-gradient)' }}>
              <Zap className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-[16px] font-bold" style={{ color: 'var(--ink-900)' }}>AI Poll Content Generator</h3>
              <p className="text-[12px]" style={{ color: 'var(--ink-400)' }}>Powered by GPT-5.2</p>
            </div>
          </div>

          <textarea
            value={store.idea}
            onChange={e => store.setIdea(e.target.value)}
            placeholder={'Enter topic, idea, or niche (optional)\n\nExamples: "productivity", "startup struggle", "fitness mindset"'}
            className="d-input resize-none h-28 mb-4"
            data-testid="poll-idea-input"
          />

          {/* Platform selector */}
          <div className="flex flex-wrap gap-2 mb-5">
            {PLATFORMS.map(p => (
              <button key={p.id} onClick={() => store.setPlatform(p.id)}
                data-testid={`poll-platform-${p.id}`}
                className={`px-4 py-2 rounded-xl text-[13px] font-semibold border transition-all ${
                  store.platform === p.id
                    ? 'border-[var(--brand-primary)] bg-[var(--brand-soft)] shadow-sm'
                    : 'border-[var(--ink-200)] hover:border-[var(--ink-400)]'
                }`}
                style={{ color: store.platform === p.id ? 'var(--brand-primary)' : 'var(--ink-600)' }}>
                Generate for {p.label}
              </button>
            ))}
          </div>

          <button onClick={handleGenerate}
            className="w-full py-4 rounded-2xl font-bold text-[16px] text-white relative overflow-hidden group"
            style={{ background: 'var(--brand-gradient)', boxShadow: 'var(--shadow-brand)' }}
            data-testid="generate-poll-btn">
            <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/15 to-transparent skew-x-12" />
            <span className="relative flex items-center justify-center gap-2">
              <Sparkles className="w-5 h-5" /> Generate Viral Poll
            </span>
          </button>

          <p className="text-center text-[12px] mt-3" style={{ color: 'var(--ink-400)' }}>
            AI generates hooks, poll, CTA & image in seconds
          </p>
        </div>
      </div>
    )
  }

  /* ========== EDITOR STEP ========== */
  const selectedHookText = store.selectedHook?.text || ''

  return (
    <div className="space-y-6" data-testid="poll-editor-step">
      {/* Hook Selector */}
      <div className="d-card" data-testid="hook-selector">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[14px] font-bold" style={{ color: 'var(--ink-900)' }}>Select Hook</h3>
          <button onClick={handleRegenerate} className="d-btn-ghost text-[12px] !px-3 !py-1.5" data-testid="regenerate-poll-btn">
            <RefreshCw className="w-3.5 h-3.5" /> Regenerate
          </button>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {store.hooks.map((hook, i) => (
            <button key={`hook-${i}`} onClick={() => store.setSelectedHook(hook)}
              data-testid={`poll-hook-${i}`}
              className={`text-left p-3 rounded-xl border transition-all ${
                store.selectedHook?.text === hook.text
                  ? 'border-[var(--brand-primary)] bg-[var(--brand-soft)]'
                  : 'border-[var(--ink-200)] hover:border-[var(--ink-400)]'
              }`}>
              <p className="text-[13px] font-medium mb-2 leading-snug" style={{ color: 'var(--ink-900)' }}>{hook.text}</p>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded d-badge-brand">{hook.type}</span>
                <ScoreBadge score={hook.score} />
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Editor + Preview */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Left: Editable fields */}
        <div className="space-y-4" data-testid="poll-content-editor">
          <div className="d-card space-y-4">
            <h3 className="text-[14px] font-bold" style={{ color: 'var(--ink-900)' }}>Edit Content</h3>

            <div>
              <label className="text-[11px] font-medium uppercase tracking-wider mb-1.5 block" style={{ color: 'var(--ink-400)' }}>Poll Question</label>
              <textarea value={store.question} onChange={e => store.setQuestion(e.target.value)}
                className="d-input resize-none" rows={2} data-testid="poll-question-edit" />
            </div>

            <div>
              <label className="text-[11px] font-medium uppercase tracking-wider mb-1.5 block" style={{ color: 'var(--ink-400)' }}>Options</label>
              <div className="space-y-2">
                {store.options.map((opt, i) => (
                  <div key={`edit-opt-${i}`} className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
                      style={{ background: 'var(--brand-soft)', color: 'var(--brand-primary)' }}>
                      {String.fromCharCode(65 + i)}
                    </span>
                    <input value={opt} onChange={e => store.updateOption(i, e.target.value)}
                      className="d-input flex-1" data-testid={`poll-option-edit-${i}`} />
                    {store.options.length > 2 && (
                      <button onClick={() => store.removeOption(i)} className="p-1 rounded hover:bg-[var(--red-50)]"
                        data-testid={`remove-option-${i}`}>
                        <Trash2 className="w-3.5 h-3.5" style={{ color: 'var(--red-500)', opacity: 0.5 }} />
                      </button>
                    )}
                  </div>
                ))}
                {store.options.length < 4 && (
                  <button onClick={() => store.addOption()} className="text-[12px] font-medium flex items-center gap-1 px-2 py-1"
                    style={{ color: 'var(--brand-primary)' }} data-testid="add-option-btn">
                    <Plus className="w-3.5 h-3.5" /> Add Option
                  </button>
                )}
              </div>
            </div>

            <div>
              <label className="text-[11px] font-medium uppercase tracking-wider mb-1.5 block" style={{ color: 'var(--ink-400)' }}>CTA</label>
              <input value={store.cta} onChange={e => store.setCta(e.target.value)}
                className="d-input" data-testid="poll-cta-edit" />
            </div>

            <div>
              <label className="text-[11px] font-medium uppercase tracking-wider mb-1.5 block" style={{ color: 'var(--ink-400)' }}>Caption (optional)</label>
              <textarea value={store.caption} onChange={e => store.setCaption(e.target.value)}
                className="d-input resize-none" rows={2} data-testid="poll-caption-edit" />
            </div>
          </div>

          {/* Theme + Design */}
          <div className="d-card" data-testid="poll-theme-selector">
            <div className="flex items-center gap-2 mb-3">
              <Palette className="w-4 h-4" style={{ color: 'var(--brand-primary)' }} />
              <h3 className="text-[14px] font-bold" style={{ color: 'var(--ink-900)' }}>Image Design</h3>
            </div>

            {/* Themes */}
            <div className="mb-4">
              <label className="text-[11px] font-medium uppercase tracking-wider mb-2 block" style={{ color: 'var(--ink-400)' }}>Theme</label>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {THEMES.map(t => (
                  <button key={t.id} onClick={() => store.setTheme(t.id)}
                    data-testid={`theme-${t.id}`}
                    className={`p-2 rounded-xl border text-center transition-all ${
                      store.theme === t.id
                        ? 'border-[var(--brand-primary)] ring-1 ring-[var(--brand-primary)]'
                        : 'border-[var(--ink-200)] hover:border-[var(--ink-400)]'
                    }`}>
                    <div className="w-full h-6 rounded-lg mb-1" style={{
                      background: t.colors.bg,
                      border: t.id === 'minimal' ? '1px solid #E5E7EB' : 'none',
                    }} />
                    <span className="text-[10px] font-semibold" style={{ color: store.theme === t.id ? 'var(--brand-primary)' : 'var(--ink-600)' }}>{t.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Font */}
            <div className="mb-4">
              <label className="text-[11px] font-medium uppercase tracking-wider mb-2 block" style={{ color: 'var(--ink-400)' }}>Font</label>
              <div className="flex flex-wrap gap-2">
                {FONT_OPTIONS.map(f => (
                  <button key={f} onClick={() => store.setFontFamily(f)}
                    data-testid={`poll-font-${f.replace(/\s/g, '-').toLowerCase()}`}
                    className={`px-3 py-1.5 rounded-lg text-[12px] font-medium border transition-all ${
                      store.fontFamily === f ? 'border-[var(--brand-primary)] bg-[var(--brand-soft)]' : 'border-[var(--ink-200)]'
                    }`}
                    style={{ fontFamily: `'${f}', sans-serif`, color: store.fontFamily === f ? 'var(--brand-primary)' : 'var(--ink-600)' }}>
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {/* Font size */}
            <div>
              <label className="text-[11px] font-medium uppercase tracking-wider mb-2 block" style={{ color: 'var(--ink-400)' }}>
                Text Size ({store.fontSize}%)
              </label>
              <input type="range" min={70} max={130} value={store.fontSize}
                onChange={e => store.setFontSize(parseInt(e.target.value))}
                className="w-full accent-[var(--brand-primary)]" data-testid="poll-text-size-slider" />
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-3">
            <button onClick={handleDownload} className="d-btn-primary" data-testid="download-poll-image">
              <Download className="w-4 h-4" /> Download PNG
            </button>
          </div>
        </div>

        {/* Right: Preview */}
        <div className="space-y-3" data-testid="poll-image-preview-area">
          <div className="flex items-center justify-between">
            <h3 className="text-[14px] font-bold" style={{ color: 'var(--ink-900)' }}>Live Preview</h3>
            <span className="text-[11px] font-medium" style={{ color: 'var(--ink-400)' }}>1080 x 1080px</span>
          </div>

          <div className="d-card !p-2 overflow-hidden">
            <div className="w-full" style={{ aspectRatio: '1/1' }}>
              <div ref={imageRef} style={{ width: 540, height: 540, transform: 'scale(1)', transformOrigin: 'top left' }}
                className="origin-top-left"
                data-testid="poll-image-canvas">
                <PollImagePreview
                  hook={selectedHookText}
                  question={store.question}
                  options={store.options}
                  cta={store.cta}
                  theme={store.theme}
                  fontFamily={store.fontFamily}
                  fontSize={store.fontSize}
                />
              </div>
            </div>
          </div>

          {/* Engagement Score */}
          {store.selectedHook && (
            <div className="d-card !p-4" data-testid="engagement-score">
              <h4 className="text-[12px] font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--ink-400)' }}>Content Quality</h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl" style={{ background: 'var(--ink-100)' }}>
                  <p className="text-[10px] font-medium mb-1" style={{ color: 'var(--ink-400)' }}>Hook Strength</p>
                  <p className="text-[20px] font-bold" style={{ color: store.selectedHook.score >= 8 ? 'var(--green-500)' : 'var(--brand-primary)', fontFamily: "'JetBrains Mono', monospace" }}>
                    {store.selectedHook.score.toFixed(1)}<span className="text-[12px] font-medium" style={{ color: 'var(--ink-400)' }}>/10</span>
                  </p>
                </div>
                <div className="p-3 rounded-xl" style={{ background: 'var(--ink-100)' }}>
                  <p className="text-[10px] font-medium mb-1" style={{ color: 'var(--ink-400)' }}>Engagement Est.</p>
                  <p className="text-[20px] font-bold" style={{ color: 'var(--green-500)', fontFamily: "'JetBrains Mono', monospace" }}>
                    {store.selectedHook.score >= 8.5 ? 'Viral' : store.selectedHook.score >= 7.5 ? 'High' : 'Good'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
