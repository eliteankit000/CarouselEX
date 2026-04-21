'use client'

import { useState, useRef, useCallback, useMemo } from 'react'
import {
  Camera, Play, Sparkles, Loader2, AlertCircle,
  Hash, Search, Type, FileText, Gauge, Layers, X, RefreshCw, Copy, Check,
} from 'lucide-react'
import type { GeneratedContent } from '@/types/content'

const BACKEND_URL = process.env.NEXT_PUBLIC_APP_URL || ''

const MAX_IMAGE_BYTES = 10 * 1024 * 1024
const MAX_VIDEO_BYTES = 50 * 1024 * 1024
const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const VIDEO_TYPES = ['video/mp4', 'video/quicktime']

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function CopyBtn({ text, testId }: { text: string; testId?: string }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      /* ignore */
    }
  }
  return (
    <button
      onClick={copy}
      data-testid={testId}
      aria-label={copied ? 'Copied' : 'Copy'}
      style={{
        background: 'transparent', border: 'none', padding: 6,
        borderRadius: 6, cursor: 'pointer', color: 'var(--cx-muted-2)',
        transition: 'background 150ms ease, color 150ms ease',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--cx-gray-100)')}
      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
    >
      {copied
        ? <Check width="14" height="14" style={{ color: 'var(--cx-success)' }} />
        : <Copy width="14" height="14" />}
    </button>
  )
}

function OutputCard({
  title, icon, children, copyText, testId, span,
}: {
  title: string
  icon: React.ReactNode
  children: React.ReactNode
  copyText?: string
  testId?: string
  span?: boolean
}) {
  return (
    <div
      data-testid={testId}
      style={{
        background: '#fff',
        border: '1px solid var(--cx-border)',
        borderRadius: 12,
        padding: 18,
        boxShadow: 'var(--cx-shadow-sm)',
        gridColumn: span ? '1 / -1' : 'auto',
      }}
    >
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 10,
      }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <span style={{ color: 'var(--cx-brand)', display: 'inline-flex' }}>{icon}</span>
          <span style={{
            fontSize: 11, fontWeight: 600, letterSpacing: '0.08em',
            color: 'var(--cx-muted-2)', textTransform: 'uppercase',
          }}>{title}</span>
        </div>
        {copyText && <CopyBtn text={copyText} testId={testId ? `${testId}-copy` : undefined} />}
      </div>
      {children}
    </div>
  )
}

export default function AIContentGenerator() {
  const [topic, setTopic] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<GeneratedContent | null>(null)
  const [localError, setLocalError] = useState<string | null>(null)

  const imageInputRef = useRef<HTMLInputElement>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)

  const canSubmit = useMemo(
    () => (topic.trim().length > 0 || !!imageFile || !!videoFile) && !isLoading,
    [topic, imageFile, videoFile, isLoading],
  )

  const onImagePick = useCallback((file: File | null) => {
    setLocalError(null)
    if (!file) { setImageFile(null); setImagePreview(null); return }
    if (!IMAGE_TYPES.includes(file.type)) {
      setLocalError('Unsupported image type. Use JPG, PNG, or WEBP.'); return
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setLocalError('Image is too large (max 10MB).'); return
    }
    setVideoFile(null)
    setImageFile(file)
    const reader = new FileReader()
    reader.onload = (e) => setImagePreview((e.target?.result as string) || null)
    reader.readAsDataURL(file)
  }, [])

  const onVideoPick = useCallback((file: File | null) => {
    setLocalError(null)
    if (!file) { setVideoFile(null); return }
    if (!VIDEO_TYPES.includes(file.type)) {
      setLocalError('Unsupported video type. Use MP4 or MOV.'); return
    }
    if (file.size > MAX_VIDEO_BYTES) {
      setLocalError('Video is too large (max 50MB).'); return
    }
    setImageFile(null)
    setImagePreview(null)
    setVideoFile(file)
  }, [])

  const clearImage = useCallback(() => {
    setImageFile(null)
    setImagePreview(null)
    if (imageInputRef.current) imageInputRef.current.value = ''
  }, [])

  const clearVideo = useCallback(() => {
    setVideoFile(null)
    if (videoInputRef.current) videoInputRef.current.value = ''
  }, [])

  const handleGenerate = useCallback(async () => {
    if (!canSubmit) return
    setIsLoading(true)
    setError(null)
    setResult(null)
    const form = new FormData()
    form.append('topic', topic.trim())
    if (imageFile) form.append('image', imageFile)
    else if (videoFile) form.append('video', videoFile)
    try {
      const res = await fetch(`${BACKEND_URL}/api/ai-content/generate`, {
        method: 'POST', body: form,
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        const msg =
          (typeof body?.detail === 'object' && body?.detail?.detail) ||
          (typeof body?.detail === 'string' && body.detail) ||
          body?.error || `Request failed (${res.status})`
        throw new Error(String(msg))
      }
      setResult((await res.json()) as GeneratedContent)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed')
    } finally {
      setIsLoading(false)
    }
  }, [canSubmit, topic, imageFile, videoFile])

  const reachColor: Record<string, string> = {
    High: 'var(--cx-success)',
    Medium: 'var(--cx-warn)',
    Low: '#EF4444',
  }
  const reachBg: Record<string, string> = {
    High: '#D1FAE5',
    Medium: '#FEF3C7',
    Low: '#FEE2E2',
  }

  return (
    <div data-testid="ai-content-generator-section" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* INPUT CARD */}
      <div className="cx-card" data-testid="ai-content-input-card">
        <div>
          <label className="cx-label" htmlFor="ai-content-topic">Topic</label>
          <input
            id="ai-content-topic"
            data-testid="ai-content-topic-input"
            className="cx-input"
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Enter your topic or describe your content…"
          />
        </div>

        <div className="cx-grid-2" style={{ marginTop: 20 }}>
          {/* Image */}
          <input
            ref={imageInputRef}
            type="file"
            accept={IMAGE_TYPES.join(',')}
            style={{ display: 'none' }}
            onChange={(e) => onImagePick(e.target.files?.[0] || null)}
            data-testid="ai-content-image-input"
          />
          {imagePreview ? (
            <div
              data-testid="ai-content-image-preview"
              style={{
                position: 'relative', height: 140, borderRadius: 12,
                overflow: 'hidden', border: '1px solid var(--cx-border)',
                background: 'var(--cx-gray-100)',
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imagePreview} alt="Upload preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <button
                onClick={clearImage}
                data-testid="ai-content-image-clear"
                aria-label="Remove image"
                style={{
                  position: 'absolute', top: 8, right: 8,
                  width: 28, height: 28, borderRadius: '50%',
                  background: 'rgba(255,255,255,0.95)',
                  border: '1px solid var(--cx-border)',
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer',
                }}
              >
                <X width="14" height="14" style={{ color: 'var(--cx-ink-3)' }} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="cx-dropzone"
              onClick={() => imageInputRef.current?.click()}
              data-testid="ai-content-image-upload-btn"
            >
              <span className="cx-dz-icon"><Camera width="20" height="20" /></span>
              <span className="cx-dz-label">Upload Image</span>
              <span className="cx-dz-sub">JPG, PNG, WEBP up to 10MB</span>
            </button>
          )}

          {/* Video */}
          <input
            ref={videoInputRef}
            type="file"
            accept={VIDEO_TYPES.join(',')}
            style={{ display: 'none' }}
            onChange={(e) => onVideoPick(e.target.files?.[0] || null)}
            data-testid="ai-content-video-input"
          />
          {videoFile ? (
            <div
              data-testid="ai-content-video-preview"
              style={{
                position: 'relative', height: 140, borderRadius: 12,
                border: '1px solid var(--cx-border)', background: 'var(--cx-gray-100)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}
            >
              <span className="cx-dz-icon" style={{ background: '#EDE9FE', color: 'var(--cx-brand)' }}>
                <Play width="20" height="20" />
              </span>
              <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--cx-ink-2)', maxWidth: 220, textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {videoFile.name}
              </span>
              <span className="cx-chip">{formatBytes(videoFile.size)}</span>
              <button
                onClick={clearVideo}
                data-testid="ai-content-video-clear"
                aria-label="Remove video"
                style={{
                  position: 'absolute', top: 8, right: 8,
                  width: 28, height: 28, borderRadius: '50%',
                  background: 'rgba(255,255,255,0.95)',
                  border: '1px solid var(--cx-border)',
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer',
                }}
              >
                <X width="14" height="14" style={{ color: 'var(--cx-ink-3)' }} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="cx-dropzone"
              onClick={() => videoInputRef.current?.click()}
              data-testid="ai-content-video-upload-btn"
            >
              <span className="cx-dz-icon"><Play width="20" height="20" /></span>
              <span className="cx-dz-label">Upload Video</span>
              <span className="cx-dz-sub">MP4, MOV up to 50MB</span>
            </button>
          )}
        </div>

        {localError && (
          <div
            data-testid="ai-content-local-error"
            style={{
              marginTop: 16, display: 'flex', alignItems: 'center', gap: 8,
              fontSize: 13, borderRadius: 10,
              padding: '10px 12px', background: '#FEF2F2',
              color: '#DC2626', border: '1px solid #FECACA',
            }}
          >
            <AlertCircle width="14" height="14" /> {localError}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}>
          <button
            onClick={handleGenerate}
            disabled={!canSubmit}
            className="cx-btn-primary"
            data-testid="ai-content-generate-btn"
          >
            {isLoading
              ? (<><Loader2 width="16" height="16" className="cx-spin" /> Generating with GPT-4o…</>)
              : (<><Sparkles width="16" height="16" /> Generate Content</>)
            }
          </button>
        </div>
      </div>

      {/* ERROR BANNER */}
      {error && (
        <div
          data-testid="ai-content-error-banner"
          style={{
            display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12,
            padding: 14, borderRadius: 12,
            background: '#FEF2F2', border: '1px solid #FECACA',
          }}
        >
          <div style={{ display: 'flex', gap: 8 }}>
            <AlertCircle width="16" height="16" style={{ color: '#DC2626', marginTop: 2 }} />
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#DC2626' }}>Generation failed</div>
              <div style={{ fontSize: 12, color: 'var(--cx-ink-3)' }}>{error}</div>
            </div>
          </div>
          <button onClick={handleGenerate} className="cx-btn-ghost" data-testid="ai-content-retry-btn">
            <RefreshCw width="14" height="14" /> Retry
          </button>
        </div>
      )}

      {/* SKELETON */}
      {isLoading && !result && (
        <div data-testid="ai-content-skeleton" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
          <div className="cx-skeleton" style={{ height: 120, gridColumn: '1 / -1' }} />
          <div className="cx-skeleton" style={{ height: 180, gridColumn: '1 / -1' }} />
          <div className="cx-skeleton" style={{ height: 110 }} />
          <div className="cx-skeleton" style={{ height: 110 }} />
          <div className="cx-skeleton" style={{ height: 90 }} />
          <div className="cx-skeleton" style={{ height: 90 }} />
        </div>
      )}

      {/* OUTPUT */}
      {result && !isLoading && (
        <div
          data-testid="ai-content-output"
          style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}
        >
          <OutputCard title="Title" icon={<Type width="14" height="14" />} copyText={result.title} testId="ai-content-result-title" span>
            <div style={{
              fontFamily: 'var(--cx-font-display)', fontSize: 20, fontWeight: 600,
              color: 'var(--cx-ink-1)', lineHeight: 1.3, letterSpacing: '-0.01em',
            }}>
              {result.title}
            </div>
          </OutputCard>

          <OutputCard title="Description" icon={<FileText width="14" height="14" />} copyText={result.description} testId="ai-content-result-description" span>
            <p style={{ fontSize: 14, color: 'var(--cx-ink-2)', lineHeight: 1.6, whiteSpace: 'pre-line', margin: 0 }}>
              {result.description}
            </p>
          </OutputCard>

          <OutputCard
            title="Hashtags"
            icon={<Hash width="14" height="14" />}
            copyText={result.hashtags.map((h) => `#${h}`).join(' ')}
            testId="ai-content-result-hashtags"
          >
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {result.hashtags.map((h, i) => (
                <span key={`${h}-${i}`} className="cx-chip" data-testid={`ai-content-hashtag-${i}`}>#{h}</span>
              ))}
            </div>
          </OutputCard>

          <OutputCard
            title="Keywords"
            icon={<Search width="14" height="14" />}
            copyText={result.keywords.join(', ')}
            testId="ai-content-result-keywords"
          >
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {result.keywords.map((k, i) => (
                <span key={`${k}-${i}`} className="cx-chip cx-chip-blue" data-testid={`ai-content-keyword-${i}`}>{k}</span>
              ))}
            </div>
          </OutputCard>

          <OutputCard title="Content Type" icon={<Layers width="14" height="14" />} testId="ai-content-result-type">
            <span className="cx-chip">{result.contentType}</span>
          </OutputCard>

          <OutputCard title="Estimated Reach" icon={<Gauge width="14" height="14" />} testId="ai-content-result-reach">
            <span
              className="cx-chip"
              style={{
                background: reachBg[result.estimatedReach] || '#FEF3C7',
                color: reachColor[result.estimatedReach] || 'var(--cx-warn)',
              }}
            >
              {result.estimatedReach}
            </span>
          </OutputCard>
        </div>
      )}

      <style jsx>{`
        .cx-spin { animation: cx-rotate 0.9s linear infinite; }
        @keyframes cx-rotate { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
