'use client'

import { useState, useRef, useCallback, useMemo } from 'react'
import {
  Camera,
  Play,
  Sparkles,
  Loader2,
  AlertCircle,
  Hash,
  Search,
  Type,
  FileText,
  Gauge,
  Layers,
  X,
  RefreshCw,
} from 'lucide-react'
import type { GeneratedContent } from '@/types/content'
import ContentCard from '@/components/ui/ContentCard'
import PillBadge from '@/components/ui/PillBadge'
import SkeletonCard from '@/components/ui/SkeletonCard'

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
    if (!file) {
      setImageFile(null)
      setImagePreview(null)
      return
    }
    if (!IMAGE_TYPES.includes(file.type)) {
      setLocalError('Unsupported image type. Use JPG, PNG, or WEBP.')
      return
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setLocalError('Image is too large (max 10MB).')
      return
    }
    // Clear video if image picked
    setVideoFile(null)
    setImageFile(file)
    const reader = new FileReader()
    reader.onload = (e) => setImagePreview((e.target?.result as string) || null)
    reader.readAsDataURL(file)
  }, [])

  const onVideoPick = useCallback((file: File | null) => {
    setLocalError(null)
    if (!file) {
      setVideoFile(null)
      return
    }
    if (!VIDEO_TYPES.includes(file.type)) {
      setLocalError('Unsupported video type. Use MP4 or MOV.')
      return
    }
    if (file.size > MAX_VIDEO_BYTES) {
      setLocalError('Video is too large (max 50MB).')
      return
    }
    // Clear image if video picked
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
        method: 'POST',
        body: form,
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        const msg =
          (typeof body?.detail === 'object' && body?.detail?.detail) ||
          (typeof body?.detail === 'string' && body.detail) ||
          body?.error ||
          `Request failed (${res.status})`
        throw new Error(String(msg))
      }
      const data = (await res.json()) as GeneratedContent
      setResult(data)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Generation failed'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }, [canSubmit, topic, imageFile, videoFile])

  const reachTone: Record<string, 'green' | 'amber' | 'red'> = {
    High: 'green',
    Medium: 'amber',
    Low: 'red',
  }

  return (
    <div className="space-y-5" data-testid="ai-content-generator-section">
      {/* Input Area */}
      <div className="d-card !p-6" data-testid="ai-content-input-card">
        <div className="space-y-4">
          <div>
            <label
              className="text-[12px] font-semibold uppercase tracking-[0.08em] mb-2 block"
              style={{ color: 'var(--ink-400)' }}
              htmlFor="ai-content-topic"
            >
              Topic
            </label>
            <input
              id="ai-content-topic"
              data-testid="ai-content-topic-input"
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Enter your topic or describe your content…"
              className="d-input text-[14px]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Image upload zone */}
            <div>
              <input
                ref={imageInputRef}
                type="file"
                accept={IMAGE_TYPES.join(',')}
                className="hidden"
                onChange={(e) => onImagePick(e.target.files?.[0] || null)}
                data-testid="ai-content-image-input"
              />
              {imagePreview ? (
                <div
                  className="relative rounded-xl overflow-hidden border"
                  style={{
                    borderColor: 'var(--ink-200)',
                    background: 'var(--ink-100)',
                    minHeight: 160,
                  }}
                  data-testid="ai-content-image-preview"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imagePreview}
                    alt="Upload preview"
                    className="w-full h-[160px] object-cover"
                  />
                  <button
                    onClick={clearImage}
                    className="absolute top-2 right-2 p-1.5 rounded-full bg-white/90 backdrop-blur border hover:bg-white"
                    style={{ borderColor: 'var(--ink-200)' }}
                    aria-label="Remove image"
                    data-testid="ai-content-image-clear"
                  >
                    <X className="w-3.5 h-3.5" style={{ color: 'var(--ink-600)' }} />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => imageInputRef.current?.click()}
                  data-testid="ai-content-image-upload-btn"
                  className="w-full rounded-xl border-2 border-dashed px-4 py-8 flex flex-col items-center justify-center gap-2 transition-all hover:border-[var(--brand-primary)] hover:bg-[var(--brand-soft)]"
                  style={{ borderColor: 'var(--ink-200)', minHeight: 160 }}
                >
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center"
                    style={{ background: 'var(--brand-soft)' }}
                  >
                    <Camera className="w-5 h-5" style={{ color: 'var(--brand-primary)' }} />
                  </div>
                  <span className="text-[13px] font-semibold" style={{ color: 'var(--ink-900)' }}>
                    Upload Image
                  </span>
                  <span className="text-[11px]" style={{ color: 'var(--ink-400)' }}>
                    JPG, PNG, WEBP up to 10MB
                  </span>
                </button>
              )}
            </div>

            {/* Video upload zone */}
            <div>
              <input
                ref={videoInputRef}
                type="file"
                accept={VIDEO_TYPES.join(',')}
                className="hidden"
                onChange={(e) => onVideoPick(e.target.files?.[0] || null)}
                data-testid="ai-content-video-input"
              />
              {videoFile ? (
                <div
                  className="relative rounded-xl border px-4 py-5 flex flex-col items-center justify-center gap-2"
                  style={{
                    borderColor: 'var(--ink-200)',
                    background: 'var(--ink-100)',
                    minHeight: 160,
                  }}
                  data-testid="ai-content-video-preview"
                >
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center"
                    style={{ background: 'var(--brand-soft)' }}
                  >
                    <Play className="w-5 h-5" style={{ color: 'var(--brand-primary)' }} />
                  </div>
                  <p
                    className="text-[13px] font-semibold truncate max-w-full"
                    style={{ color: 'var(--ink-900)' }}
                  >
                    {videoFile.name}
                  </p>
                  <PillBadge tone="brand">{formatBytes(videoFile.size)}</PillBadge>
                  <button
                    onClick={clearVideo}
                    className="absolute top-2 right-2 p-1.5 rounded-full bg-white/90 backdrop-blur border hover:bg-white"
                    style={{ borderColor: 'var(--ink-200)' }}
                    aria-label="Remove video"
                    data-testid="ai-content-video-clear"
                  >
                    <X className="w-3.5 h-3.5" style={{ color: 'var(--ink-600)' }} />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => videoInputRef.current?.click()}
                  data-testid="ai-content-video-upload-btn"
                  className="w-full rounded-xl border-2 border-dashed px-4 py-8 flex flex-col items-center justify-center gap-2 transition-all hover:border-[var(--brand-primary)] hover:bg-[var(--brand-soft)]"
                  style={{ borderColor: 'var(--ink-200)', minHeight: 160 }}
                >
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center"
                    style={{ background: 'var(--brand-soft)' }}
                  >
                    <Play className="w-5 h-5" style={{ color: 'var(--brand-primary)' }} />
                  </div>
                  <span className="text-[13px] font-semibold" style={{ color: 'var(--ink-900)' }}>
                    Upload Video
                  </span>
                  <span className="text-[11px]" style={{ color: 'var(--ink-400)' }}>
                    MP4, MOV up to 50MB
                  </span>
                </button>
              )}
            </div>
          </div>

          {localError && (
            <div
              className="flex items-center gap-2 text-[13px] rounded-lg px-3 py-2 border"
              style={{
                background: 'var(--red-50)',
                color: 'var(--red-500)',
                borderColor: 'rgba(239,68,68,0.2)',
              }}
              data-testid="ai-content-local-error"
            >
              <AlertCircle className="w-4 h-4" /> {localError}
            </div>
          )}

          <div className="flex justify-end">
            <button
              onClick={handleGenerate}
              disabled={!canSubmit}
              data-testid="ai-content-generate-btn"
              className="d-btn-primary w-full sm:w-auto justify-center disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating with GPT-4o…
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Generate Content
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div
          className="d-card !p-4 flex items-start justify-between gap-3 border"
          style={{ background: 'var(--red-50)', borderColor: 'rgba(239,68,68,0.25)' }}
          data-testid="ai-content-error-banner"
        >
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 mt-0.5" style={{ color: 'var(--red-500)' }} />
            <div>
              <p className="text-[13px] font-semibold" style={{ color: 'var(--red-500)' }}>
                Generation failed
              </p>
              <p className="text-[12px]" style={{ color: 'var(--ink-600)' }}>
                {error}
              </p>
            </div>
          </div>
          <button
            onClick={handleGenerate}
            className="d-btn-ghost !text-[12px] !px-3 !py-1.5"
            data-testid="ai-content-retry-btn"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Retry
          </button>
        </div>
      )}

      {/* Skeleton state */}
      {isLoading && !result && (
        <div
          className="grid grid-cols-1 sm:grid-cols-2 gap-4"
          data-testid="ai-content-skeleton"
          style={{ minHeight: 280 }}
        >
          <SkeletonCard height={120} className="sm:col-span-2" data-testid="skeleton-title" />
          <SkeletonCard height={180} className="sm:col-span-2" data-testid="skeleton-desc" />
          <SkeletonCard height={110} data-testid="skeleton-hashtags" />
          <SkeletonCard height={110} data-testid="skeleton-keywords" />
          <SkeletonCard height={90} data-testid="skeleton-type" />
          <SkeletonCard height={90} data-testid="skeleton-reach" />
        </div>
      )}

      {/* Output */}
      {result && !isLoading && (
        <div
          className="grid grid-cols-1 sm:grid-cols-2 gap-4"
          data-testid="ai-content-output"
        >
          <ContentCard
            title="Title"
            copyText={result.title}
            icon={<Type className="w-4 h-4" />}
            className="sm:col-span-2"
            data-testid="ai-content-result-title"
          >
            <p
              className="text-[20px] font-bold leading-snug"
              style={{ color: 'var(--ink-900)', fontFamily: 'var(--font-display)' }}
            >
              {result.title}
            </p>
          </ContentCard>

          <ContentCard
            title="Description"
            copyText={result.description}
            icon={<FileText className="w-4 h-4" />}
            className="sm:col-span-2"
            data-testid="ai-content-result-description"
          >
            <p
              className="text-[14px] leading-relaxed whitespace-pre-line"
              style={{ color: 'var(--ink-800)' }}
            >
              {result.description}
            </p>
          </ContentCard>

          <ContentCard
            title="Hashtags"
            copyText={result.hashtags.map((h) => `#${h}`).join(' ')}
            icon={<Hash className="w-4 h-4" />}
            data-testid="ai-content-result-hashtags"
          >
            <div className="flex flex-wrap gap-2">
              {result.hashtags.map((h, i) => (
                <span
                  key={`${h}-${i}`}
                  className="inline-flex items-center rounded-full px-3 py-1 text-[12px] font-semibold"
                  style={{ background: 'var(--brand-soft)', color: 'var(--brand-primary)' }}
                  data-testid={`ai-content-hashtag-${i}`}
                >
                  #{h}
                </span>
              ))}
            </div>
          </ContentCard>

          <ContentCard
            title="Keywords"
            copyText={result.keywords.join(', ')}
            icon={<Search className="w-4 h-4" />}
            data-testid="ai-content-result-keywords"
          >
            <div className="flex flex-wrap gap-2">
              {result.keywords.map((k, i) => (
                <span
                  key={`${k}-${i}`}
                  className="inline-flex items-center rounded-full px-3 py-1 text-[12px] font-semibold"
                  style={{
                    background: 'rgba(59,130,246,0.1)',
                    color: 'var(--blue-500)',
                  }}
                  data-testid={`ai-content-keyword-${i}`}
                >
                  {k}
                </span>
              ))}
            </div>
          </ContentCard>

          <ContentCard
            title="Content Type"
            icon={<Layers className="w-4 h-4" />}
            data-testid="ai-content-result-type"
          >
            <div className="flex items-center gap-2">
              <PillBadge tone="brand">{result.contentType}</PillBadge>
            </div>
          </ContentCard>

          <ContentCard
            title="Estimated Reach"
            icon={<Gauge className="w-4 h-4" />}
            data-testid="ai-content-result-reach"
          >
            <div className="flex items-center gap-2">
              <PillBadge tone={reachTone[result.estimatedReach] || 'amber'}>
                {result.estimatedReach}
              </PillBadge>
            </div>
          </ContentCard>
        </div>
      )}
    </div>
  )
}
