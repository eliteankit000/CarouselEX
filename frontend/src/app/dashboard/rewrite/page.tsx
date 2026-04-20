'use client'

import { useState, useCallback, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { Brain, Copy, Download, Save, RefreshCw, Sparkles, Check } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { useToast } from '@/lib/toast'

const BACKEND_URL = process.env.NEXT_PUBLIC_APP_URL || ''

const REWRITE_STYLES = [
  { id: 'more-viral', label: 'More Viral' },
  { id: 'more-emotional', label: 'More Emotional' },
  { id: 'more-controversial', label: 'More Controversial' },
  { id: 'storytelling', label: 'More Storytelling' },
]

interface CICOutput {
  mainContent: string
  contentStrength: string
  hook: string
  variations: { label: string; content: string }[]
}

function StrengthBadge({ strength }: { strength: string }) {
  const color = strength === 'Strong' ? 'var(--green-500)' : strength === 'Weak' ? 'var(--red-500)' : 'var(--amber-500)'
  const bg = strength === 'Strong' ? 'var(--green-50)' : strength === 'Weak' ? 'var(--red-50)' : 'rgba(245,158,11,0.1)'
  return (
    <span className="text-[12px] font-bold px-3 py-1 rounded-lg inline-flex items-center gap-1.5" style={{ color, background: bg }} data-testid="rewrite-strength-badge">
      Strength: {strength}
    </span>
  )
}

export default function SmartRewritePage() {
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const { toast } = useToast()

  const [content, setContent] = useState(searchParams.get('content') || '')
  const [rewriteStyle, setRewriteStyle] = useState('more-viral')
  const [loading, setLoading] = useState(false)
  const [improving, setImproving] = useState(false)
  const [saving, setSaving] = useState(false)
  const [output, setOutput] = useState<CICOutput | null>(null)
  const [brandStyle, setBrandStyle] = useState<{ tone: string; writingStyle: string; niche: string } | null>(null)

  useEffect(() => {
    fetch(`${BACKEND_URL}/api/brand?userId=${user?.id || 'demo-user-001'}`)
      .then(r => r.json())
      .then(d => { if (d.success && d.data) setBrandStyle(d.data) })
      .catch(() => {})
  }, [user])

  const handleRewrite = useCallback(async () => {
    if (!content.trim()) { toast('Paste some content first', 'error'); return }
    setLoading(true)
    setOutput(null)
    try {
      const res = await fetch(`${BACKEND_URL}/api/cic`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'rewrite',
          topic: '',
          pastedContent: content,
          rewriteStyle,
          contentType: 'viral-post',
          userId: user?.id || 'demo-user-001',
          plan: user?.plan || 'starter',
          ...(brandStyle ? { brandStyle } : {}),
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: 'Rewrite failed' }))
        throw new Error(err.detail)
      }
      const data = await res.json()
      setOutput(data.data)
    } catch (err: any) {
      toast(err.message || 'Rewrite failed', 'error')
    } finally {
      setLoading(false)
    }
  }, [content, rewriteStyle, user, brandStyle, toast])

  const handleImproveFurther = useCallback(async () => {
    if (!output?.mainContent) return
    setImproving(true)
    try {
      const res = await fetch(`${BACKEND_URL}/api/cic`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'rewrite',
          topic: '',
          pastedContent: output.mainContent,
          rewriteStyle,
          contentType: 'viral-post',
          userId: user?.id || 'demo-user-001',
          plan: user?.plan || 'starter',
          ...(brandStyle ? { brandStyle } : {}),
        }),
      })
      if (!res.ok) throw new Error('Improvement failed')
      const data = await res.json()
      setOutput(data.data)
      toast('Content improved further!')
    } catch (err: any) {
      toast(err.message || 'Improvement failed', 'error')
    } finally {
      setImproving(false)
    }
  }, [output, rewriteStyle, user, brandStyle, toast])

  const handleSave = useCallback(async () => {
    if (!output?.mainContent) return
    setSaving(true)
    try {
      const res = await fetch(`${BACKEND_URL}/api/library/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id || 'demo-user-001',
          content: output.mainContent,
          hook: output.hook,
          contentType: 'viral-post',
          contentStrength: output.contentStrength,
        }),
      })
      if (!res.ok) throw new Error('Save failed')
      toast('Saved to Content Library!')
    } catch {
      toast('Save failed', 'error')
    } finally {
      setSaving(false)
    }
  }, [output, user, toast])

  const handleCopy = (text: string) => { navigator.clipboard.writeText(text); toast('Copied!') }
  const handleDownload = (text: string) => {
    const blob = new Blob([text], { type: 'text/plain' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `carouselex-rewrite-${Date.now()}.txt`
    a.click()
    toast('Downloaded!')
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto d-page-enter" data-testid="smart-rewrite-page">
      <div>
        <h1 className="text-[24px] font-bold" style={{ color: 'var(--ink-900)' }}>Smart Rewrite</h1>
        <p className="text-[14px] mt-1" style={{ color: 'var(--ink-400)' }}>Paste any content and make it stronger</p>
      </div>

      {/* Input */}
      <div className="d-card" data-testid="rewrite-input-card">
        <textarea
          value={content}
          onChange={e => setContent(e.target.value)}
          placeholder="Paste your content or competitor content here..."
          className="d-input resize-none min-h-[160px] text-[14px]"
          rows={6}
          data-testid="rewrite-content-input"
        />
      </div>

      {/* Rewrite Style */}
      <div className="d-card" data-testid="rewrite-style-section">
        <label className="text-[11px] font-medium uppercase tracking-wider mb-3 block" style={{ color: 'var(--ink-400)' }}>Rewrite Style</label>
        <div className="flex flex-wrap gap-2">
          {REWRITE_STYLES.map(s => (
            <button
              key={s.id}
              onClick={() => setRewriteStyle(s.id)}
              className={`px-4 py-2.5 rounded-xl text-[13px] font-semibold border transition-all ${
                rewriteStyle === s.id
                  ? 'border-[var(--brand-primary)] bg-[var(--brand-soft)]'
                  : 'border-[var(--ink-200)] hover:border-[var(--ink-400)]'
              }`}
              style={{ color: rewriteStyle === s.id ? 'var(--brand-primary)' : 'var(--ink-600)' }}
              data-testid={`rewrite-style-${s.id}`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Rewrite Button */}
      <button
        onClick={handleRewrite}
        disabled={loading || !content.trim()}
        className="w-full py-4 rounded-2xl font-bold text-[16px] text-white relative overflow-hidden group disabled:opacity-40 disabled:cursor-not-allowed"
        style={{ background: 'var(--brand-gradient)', boxShadow: content.trim() && !loading ? 'var(--shadow-brand)' : 'none' }}
        data-testid="rewrite-submit-btn"
      >
        <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/15 to-transparent skew-x-12" />
        <span className="relative flex items-center justify-center gap-2">
          {loading ? (
            <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Rewriting...</>
          ) : (
            <><Brain className="w-5 h-5" /> Rewrite Content</>
          )}
        </span>
      </button>

      {/* Loading */}
      {loading && (
        <div className="space-y-3" data-testid="rewrite-loading">
          <div className="d-skeleton h-8 w-40" />
          <div className="d-skeleton h-48 w-full" />
        </div>
      )}

      {/* Output */}
      {output && !loading && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-5" data-testid="rewrite-output-section">
          <StrengthBadge strength={output.contentStrength} />

          <div className="d-card" data-testid="rewrite-content-card">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[14px] font-bold" style={{ color: 'var(--ink-900)' }}>Improved Content</h3>
              <div className="flex items-center gap-2">
                <button onClick={() => handleCopy(output.mainContent)} className="d-btn-ghost text-[12px] !px-3 !py-1.5" data-testid="rewrite-copy-btn">
                  <Copy className="w-3.5 h-3.5" /> Copy
                </button>
                <button onClick={() => handleDownload(output.mainContent)} className="d-btn-ghost text-[12px] !px-3 !py-1.5" data-testid="rewrite-download-btn">
                  <Download className="w-3.5 h-3.5" /> Download
                </button>
              </div>
            </div>

            {output.hook && (
              <div className="px-4 py-3 rounded-xl mb-4" style={{ background: 'var(--brand-soft)', border: '1px solid rgba(91,63,232,0.12)' }} data-testid="rewrite-hook">
                <p className="text-[11px] font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--brand-primary)' }}>Hook</p>
                <p className="text-[14px] font-semibold" style={{ color: 'var(--ink-900)' }}>{output.hook}</p>
              </div>
            )}

            <div className="text-[14px] leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--ink-800)' }} data-testid="rewrite-content-text">
              {output.mainContent}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-3">
            <button onClick={handleSave} disabled={saving} className="d-btn-ghost text-[13px]" data-testid="rewrite-save-btn">
              <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save to Library'}
            </button>
            <button
              onClick={handleImproveFurther}
              disabled={improving}
              className="d-btn-primary text-[13px]"
              data-testid="rewrite-improve-btn"
            >
              {improving ? (
                <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Improving...</>
              ) : (
                <><Sparkles className="w-4 h-4" /> Improve Further</>
              )}
            </button>
          </div>
        </motion.div>
      )}
    </div>
  )
}
