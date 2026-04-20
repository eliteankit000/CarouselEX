'use client'

import { useState, useCallback, useEffect, useMemo, useRef, forwardRef } from 'react'
import { useSearchParams } from 'next/navigation'
import {
  Sparkles, Copy, RefreshCw, Save, Wand2, Image as ImageIcon,
  LayoutGrid, Palette, Type, Zap, Upload, Search, ChevronLeft, ChevronRight,
  Plus, Trash2, Linkedin, Instagram, Twitter, MessageCircle,
  ArrowRight, BarChart3, Shuffle, GitBranch, AlignJustify,
  FileText, FileImage, Lightbulb, Flame, PenLine, Target,
  Loader2, AlignCenter, AlignLeft, AlignRight, ChevronDown,
  Copy as CopyIcon, User as Users, Lock, LockOpen,
} from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { useToast } from '@/lib/toast'
import { toPng, toJpeg } from 'html-to-image'
import JSZip from 'jszip'
import jsPDF from 'jspdf'

const BACKEND_URL = process.env.NEXT_PUBLIC_APP_URL || ''

// ============ TYPES ============
type SlideType = 'hook' | 'value' | 'story' | 'data' | 'cta'
type LayoutType = 'text' | 'text-image' | 'image'
type ImagePos = 'left' | 'right' | 'center' | 'bg'
type IntroStyle = 'standard' | 'emoji' | 'headshot' | 'full-image'
type PlatformId = 'linkedin' | 'x' | 'instagram' | 'threads'

interface TextStyle {
  fontSize?: number
  fontWeight?: number
  align?: 'left' | 'center' | 'right'
  color?: string
  lineHeight?: number
  letterSpacing?: number
}

interface CtaStyle {
  shape?: 'pill' | 'square' | 'underline'
  bg?: string
  textColor?: string
}

interface BgOverride {
  color?: string | null
  texture?: 'none' | 'dots' | 'grid' | 'lines' | 'noise'
}

interface Slide {
  id: string
  type: SlideType
  layout: LayoutType
  title: string
  body: string
  tagline: string
  ctaText: string
  toggles: { title: boolean; body: boolean; tagline: boolean; cta: boolean }
  image: { url: string; pos: ImagePos; scale: number } | null
  introStyle?: IntroStyle
  outroStyle?: 'standard' | 'headshot' | 'image'
  emoji?: string
  headshot?: string | null
  accentWord?: string
  swipeText?: string
  swipePos?: { dx: number; dy: number }
  swipeLocked?: boolean
  avatarPos?: { dx: number; dy: number }
  avatarLocked?: boolean
  showIcons?: boolean
  hideCounter?: boolean
  backgroundImage?: string | null
  imageOrientation?: 'horizontal' | 'vertical'
  imageScaleMode?: 'fit' | 'fill' | 'zoom-in' | 'zoom-out' | 'expand'
  fieldToggles?: {
    tagline?: boolean
    title?: boolean
    body?: boolean
    swipe?: boolean
    cta?: boolean
    icons?: boolean
    bgImage?: boolean
  }
  strength?: { score: number; strength: string; hint: string }
  titleStyle?: TextStyle
  bodyStyle?: TextStyle
  taglineStyle?: TextStyle
  ctaStyle?: CtaStyle
  bgOverride?: BgOverride
}

interface Palette { id: string; name: string; bg: string; text: string; accent: string; subtle: string; bgPreview: string }
interface FontPair { id: string; heading: string; body: string; label: string }

// ============ CONSTANTS ============
const PLATFORMS: { id: PlatformId; label: string; icon: any }[] = [
  { id: 'linkedin', label: 'LinkedIn', icon: Linkedin },
  { id: 'x', label: 'X (Twitter)', icon: Twitter },
  { id: 'instagram', label: 'Instagram', icon: Instagram },
  { id: 'threads', label: 'Threads', icon: MessageCircle },
]

// Upgraded palettes — premium gradients, NOT flat colors
const PALETTES: Palette[] = [
  { id: 'editorial', name: 'Editorial', bg: '#F5F0E8', text: '#1A1A2E', accent: '#7AB5A0', subtle: '#EFE8D7', bgPreview: 'linear-gradient(135deg, #F5F0E8, #7AB5A0)' },
  { id: 'nebula', name: 'Nebula', bg: 'linear-gradient(135deg, #0D0D1F 0%, #1A1A40 60%, #0f2027 100%)', text: '#FFFFFF', accent: '#A78BFA', subtle: '#1A1D2E', bgPreview: 'linear-gradient(135deg, #0D0D1F, #1A1A40)' },
  { id: 'aurora', name: 'Aurora', bg: 'linear-gradient(135deg, #6B46C1 0%, #2563EB 50%, #06B6D4 100%)', text: '#FFFFFF', accent: '#FDE68A', subtle: '#3730A3', bgPreview: 'linear-gradient(135deg, #6B46C1, #06B6D4)' },
  { id: 'sand', name: 'Sand', bg: 'linear-gradient(135deg, #f5f0e8 0%, #ede8d8 100%)', text: '#2A2418', accent: '#B8622B', subtle: '#EFE8D7', bgPreview: 'linear-gradient(135deg, #f5f0e8, #ede8d8)' },
  { id: 'charcoal', name: 'Charcoal', bg: 'linear-gradient(135deg, #0A0A0A 0%, #1A1A1A 100%)', text: '#F4F4F5', accent: '#F5A524', subtle: '#202020', bgPreview: 'linear-gradient(135deg, #0A0A0A, #1A1A1A)' },
  { id: 'coral', name: 'Coral', bg: 'linear-gradient(135deg, #FF6B6B 0%, #FFE66D 100%)', text: '#2D1B3D', accent: '#2D1B3D', subtle: '#FFB4A2', bgPreview: 'linear-gradient(135deg, #FF6B6B, #FFE66D)' },
  { id: 'emerald', name: 'Emerald', bg: 'linear-gradient(135deg, #064E3B 0%, #10B981 100%)', text: '#FFFFFF', accent: '#FDE68A', subtle: '#0F5132', bgPreview: 'linear-gradient(135deg, #064E3B, #10B981)' },
]

const FONT_PAIRS: FontPair[] = [
  { id: 'modern', heading: 'Plus Jakarta Sans', body: 'Inter', label: 'Modern Sans' },
  { id: 'editorial', heading: 'Georgia', body: 'Inter', label: 'Editorial' },
  { id: 'mono', heading: 'JetBrains Mono', body: 'Inter', label: 'Mono/Sans' },
  { id: 'classic', heading: 'DM Sans', body: 'DM Sans', label: 'Classic' },
]

// Platform format presets — drives slide frame aspect ratio in preview
type FormatId =
  | 'linkedin-4-5' | 'linkedin-1-1'
  | 'instagram-1-1' | 'instagram-4-5' | 'instagram-stories'
  | 'twitter-1-1' | 'threads-3-4' | 'tiktok-9-16'

const FORMATS: Record<FormatId, { label: string; aspect: string; group: string }> = {
  'linkedin-4-5': { label: 'LinkedIn (4:5 Recommended)', aspect: '4 / 5', group: 'LinkedIn' },
  'linkedin-1-1': { label: 'LinkedIn (1:1)', aspect: '1 / 1', group: 'LinkedIn' },
  'instagram-1-1': { label: 'Instagram Feed (1:1)', aspect: '1 / 1', group: 'Instagram' },
  'instagram-4-5': { label: 'Instagram Feed (4:5)', aspect: '4 / 5', group: 'Instagram' },
  'instagram-stories': { label: 'Instagram Stories (9:16)', aspect: '9 / 16', group: 'Instagram' },
  'twitter-1-1': { label: 'X / Twitter (1:1)', aspect: '1 / 1', group: 'X' },
  'threads-3-4': { label: 'Threads (3:4)', aspect: '3 / 4', group: 'Threads' },
  'tiktok-9-16': { label: 'TikTok (9:16)', aspect: '9 / 16', group: 'TikTok' },
}

const STOCK_POOL: { url: string; tag: string }[] = [
  { url: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=800&q=80', tag: 'Abstract' },
  { url: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&q=80', tag: 'Office' },
  { url: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800&q=80', tag: 'Minimal' },
  { url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&q=80', tag: 'Tech' },
  { url: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800&q=80', tag: 'Team' },
  { url: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80', tag: 'Data' },
  { url: 'https://images.unsplash.com/photo-1553484771-047a44eee27b?w=800&q=80', tag: 'Gradient' },
  { url: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=800&q=80', tag: 'Waves' },
  { url: 'https://images.unsplash.com/photo-1620121692029-d088224ddc74?w=800&q=80', tag: 'Neon' },
  { url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80', tag: 'Workspace' },
  { url: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=800&q=80', tag: 'Growth' },
  { url: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=800&q=80', tag: 'Meeting' },
]

const DEFAULT_EMOJI_POOL = ['🚀', '💡', '🔥', '⚡', '🎯', '✨', '📈', '💎']

const SLIDE_SIZE = 1080 // canvas base size

// ============ HELPERS ============
const uid = () => Math.random().toString(36).slice(2, 10)

function buildDefaultCarousel(): Slide[] {
  return [
    { id: uid(), type: 'hook', layout: 'text', title: 'Your **Powerful** Hook Goes Here', body: 'A clear value statement that builds trust and stops the scroll.', tagline: 'A SHORT TAGLINE', ctaText: '', introStyle: 'standard', emoji: '🚀', headshot: null, accentWord: 'Powerful', swipeText: 'Swipe', toggles: { title: true, body: true, tagline: true, cta: false }, fieldToggles: { tagline: true, title: true, body: true, swipe: true, bgImage: false }, image: null },
    { id: uid(), type: 'value', layout: 'text', title: '01. **Focus** beats hustle', body: 'Doing 10 things half-right will never beat doing 1 thing 10x better. Pick the one.', tagline: '', ctaText: '', accentWord: 'Focus', hideCounter: false, toggles: { title: true, body: true, tagline: false, cta: false }, fieldToggles: { title: true, body: true }, image: null },
    { id: uid(), type: 'value', layout: 'text', title: '02. **Ship** in public', body: 'Quiet work rarely compounds. Show the messy middle — that\'s where trust is built.', tagline: '', ctaText: '', accentWord: 'Ship', hideCounter: false, toggles: { title: true, body: true, tagline: false, cta: false }, fieldToggles: { title: true, body: true }, image: null },
    { id: uid(), type: 'data', layout: 'text', title: '03. **Feedback** > perfection', body: 'The first version is never good. Get 3 rounds of real feedback before you polish.', tagline: '', ctaText: '', accentWord: 'Feedback', hideCounter: false, toggles: { title: true, body: true, tagline: false, cta: false }, fieldToggles: { title: true, body: true }, image: null },
    { id: uid(), type: 'value', layout: 'text', title: 'The **uncomfortable** truth', body: 'You probably already know what to do. You\'re just avoiding doing it.', tagline: '', ctaText: '', accentWord: 'uncomfortable', hideCounter: false, toggles: { title: true, body: true, tagline: false, cta: false }, fieldToggles: { title: true, body: true }, image: null },
    { id: uid(), type: 'cta', layout: 'text', title: 'Found this **useful**?', body: 'Save this post and share with one friend who needs it.', tagline: 'THE TAKEAWAY', ctaText: 'Visit us at yourbrand.com', accentWord: 'useful', outroStyle: 'standard', showIcons: true, toggles: { title: true, body: true, tagline: true, cta: true }, fieldToggles: { tagline: true, title: true, body: true, cta: true, icons: true }, image: null },
  ]
}

function computeLocalStrength(title: string, body: string, type: SlideType): { score: number; strength: string; hint: string } {
  const text = `${title} ${body}`.trim()
  const wc = text.split(/\s+/).filter(Boolean).length
  let score = 50
  if (type === 'hook') {
    if (wc >= 4 && wc <= 15) score += 15
    else if (wc > 30) score -= 15
  } else {
    if (wc >= 10 && wc <= 40) score += 15
    else if (wc > 60) score -= 20
    else if (wc < 5) score -= 15
  }
  const engage = ['you', 'your', 'stop', 'never', 'always', 'truth', 'secret', 'why', 'how', 'what', 'proof']
  if (engage.some(w => text.toLowerCase().includes(w))) score += 10
  if (/\d/.test(text)) score += 10
  if (/[?!]/.test(text)) score += 5
  if (title.trim()) score += 5
  score = Math.max(0, Math.min(100, score))
  const strength = score >= 70 ? 'Strong' : score < 45 ? 'Weak' : 'Medium'
  let hint = ''
  if (strength === 'Weak') {
    if (wc > 50) hint = 'Too much text'
    else if (wc < 5) hint = 'Needs substance'
    else if (type === 'hook') hint = 'Hook could be stronger'
    else hint = 'Add a number or specifics'
  } else if (strength === 'Medium') hint = 'Could be sharper'
  return { score, strength, hint }
}

// ============ ACCORDION ============
function Accordion({ id, title, icon: Icon, children, openSet, toggle }: any) {
  const open = openSet.has(id)
  return (
    <div className="border-b last:border-b-0" style={{ borderColor: 'var(--ink-200)' }}>
      <button
        onClick={() => toggle(id)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-[var(--ink-50)] transition-colors"
        data-testid={`accordion-${id}`}
      >
        <div className="flex items-center gap-2">
          <Icon className="w-3.5 h-3.5" style={{ color: 'var(--brand-primary)' }} />
          <span className="text-[12px] font-bold uppercase tracking-wider" style={{ color: 'var(--ink-800)' }}>{title}</span>
        </div>
        <ChevronDown className="w-3.5 h-3.5 transition-transform" style={{ color: 'var(--ink-400)', transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }} />
      </button>
      <div className="overflow-hidden transition-all" style={{ maxHeight: open ? 2000 : 0, opacity: open ? 1 : 0 }}>
        <div className="px-4 pb-4 space-y-3">{children}</div>
      </div>
    </div>
  )
}

// ============ TOGGLE FIELD (purple switch + collapsing input) ============
function ToggleField({ id, label, enabled, onToggle, children }: any) {
  return (
    <div className="rounded-xl border transition-all" style={{ borderColor: enabled ? '#E5E7EB' : '#F0F0F5', background: enabled ? '#FFFFFF' : '#FAFAFB' }} data-testid={`field-${id}`}>
      <div className="flex items-center justify-between px-4 py-3">
        <label className="text-[12px] font-bold uppercase tracking-wider" style={{ color: enabled ? '#1A1A2E' : '#888888', letterSpacing: '0.05em' }}>{label}</label>
        <button
          onClick={onToggle}
          data-testid={`field-toggle-${id}`}
          role="switch"
          aria-checked={enabled}
          style={{
            width: 40, height: 22, borderRadius: 999,
            background: enabled ? '#6B4EFF' : '#CCCCCC',
            position: 'relative', transition: 'background 0.18s ease',
            cursor: 'pointer', border: 'none',
          }}
        >
          <span style={{
            position: 'absolute', top: 2, left: enabled ? 20 : 2,
            width: 18, height: 18, borderRadius: 999, background: '#FFFFFF',
            transition: 'left 0.18s ease', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
          }} />
        </button>
      </div>
      <div className="overflow-hidden transition-all" style={{ maxHeight: enabled ? 600 : 0 }}>
        <div className="px-4 pb-4 space-y-2">{enabled && children}</div>
      </div>
    </div>
  )
}

// ============ SEGMENTED PILL TABS (type switcher) ============
function SegmentedTabs({ value, onChange, options, testIdPrefix }: any) {
  return (
    <div className="flex gap-1 p-1 rounded-xl" style={{ background: '#F3F4F6' }} data-testid={`${testIdPrefix}-tabs`}>
      {options.map((opt: any) => {
        const active = value === opt.id
        const Icon = opt.icon
        return (
          <button
            key={opt.id}
            onClick={() => onChange(opt.id)}
            data-testid={`${testIdPrefix}-${opt.id}`}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg transition-all"
            style={{
              background: active ? '#FFFFFF' : 'transparent',
              color: active ? '#6B4EFF' : '#6B7280',
              fontWeight: active ? 700 : 600,
              fontSize: 12,
              boxShadow: active ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
            }}
          >
            {Icon && <Icon className="w-3.5 h-3.5" />}
            <span>{opt.label}</span>
          </button>
        )
      })}
    </div>
  )
}


// ============ MAIN PAGE ============
export default function CarouselBuilderPage() {
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const { toast } = useToast()
  const userId = user?.id || 'demo-user-001'

  // Input
  const [inputTab, setInputTab] = useState<'text' | 'video' | 'import'>('text')
  const [topic, setTopic] = useState(searchParams.get('topic') || '')
  const [importContent, setImportContent] = useState('')
  const [videoUrl, setVideoUrl] = useState('')
  const [platform, setPlatform] = useState<PlatformId>('linkedin')
  const [format, setFormat] = useState<FormatId>('linkedin-4-5')

  // Carousel state (PRELOADED)
  const [slides, setSlides] = useState<Slide[]>(() => buildDefaultCarousel())
  const [activeIdx, setActiveIdx] = useState(0)
  const [draggingIdx, setDraggingIdx] = useState<number | null>(null)

  // NEW: Selected element on canvas (for context-aware editor)
  const [selectedEl, setSelectedEl] = useState<null | 'title' | 'body' | 'tagline' | 'cta' | 'image' | 'background'>(null)

  // Nudge target for arrow-key positioning
  const [nudgeTarget, setNudgeTarget] = useState<'avatar' | 'swipe' | null>(null)

  // Export modal state
  const [showExportModal, setShowExportModal] = useState(false)
  const [exportFormat, setExportFormat] = useState<'png' | 'jpg' | 'zip'>('png')
  const [exportFrom, setExportFrom] = useState(1)
  const [exportTo, setExportTo] = useState(0) // 0 = use slides.length

  // Style - default to editorial (cream/sage)
  const [paletteId, setPaletteId] = useState('editorial')
  const [fontPairId, setFontPairId] = useState('modern')
  const [bgEffect, setBgEffect] = useState<'solid' | 'gradient' | 'grain'>('solid')
  const [showCounter, setShowCounter] = useState(true)
  const [brandLogo, setBrandLogo] = useState<string | null>(null)
  const [brandHandle, setBrandHandle] = useState('@yourhandle')
  const [brandName, setBrandName] = useState('Your Name')
  const [brandRole, setBrandRole] = useState('Your Role')

  // Loading flags
  const [generating, setGenerating] = useState(false)
  const [slideLoadingIdx, setSlideLoadingIdx] = useState<number | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [imgGenLoading, setImgGenLoading] = useState(false)

  // Right panel — accordion open sections (auto-managed by selection)
  const [openSections, setOpenSections] = useState<Set<string>>(new Set(['slide-type']))
  const toggleSection = (id: string) => {
    setOpenSections(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  // Auto-open relevant accordion based on selected element
  useEffect(() => {
    if (!selectedEl) return
    if (selectedEl === 'title' || selectedEl === 'body' || selectedEl === 'tagline' || selectedEl === 'cta') {
      setOpenSections(new Set(['text', 'ai-actions']))
    } else if (selectedEl === 'image') {
      setOpenSections(new Set(['slide-type']))
    } else if (selectedEl === 'background') {
      setOpenSections(new Set(['design']))
    }
  }, [selectedEl])

  const [imageSubTab, setImageSubTab] = useState<'search' | 'generate' | 'upload'>('search')
  const [imgSearchQuery, setImgSearchQuery] = useState('')
  const [aiImgPrompt, setAiImgPrompt] = useState('')

  // Poll
  const [pollResult, setPollResult] = useState<{ question: string; options: string[] } | null>(null)
  const [pollLoading, setPollLoading] = useState(false)

  // Canvas scaling
  const canvasContainerRef = useRef<HTMLDivElement>(null)
  const slideRef = useRef<HTMLDivElement>(null)
  const slideRefs = useRef<Array<HTMLButtonElement | null>>([])
  const activeChangeSrcRef = useRef<'hover' | 'nav' | 'init'>('init')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const logoInputRef = useRef<HTMLInputElement>(null)
  const [canvasScale, setCanvasScale] = useState(0.5)

  // Derived
  const palette = useMemo(() => PALETTES.find(p => p.id === paletteId) || PALETTES[0], [paletteId])
  const fontPair = useMemo(() => FONT_PAIRS.find(f => f.id === fontPairId) || FONT_PAIRS[0], [fontPairId])
  const activeSlide = slides[activeIdx]

  // Auto-score strengths on slide change
  useEffect(() => {
    setSlides(prev => prev.map(s => ({ ...s, strength: computeLocalStrength(s.title, s.body, s.type) })))
  }, []) // once

  useEffect(() => {
    if (!activeSlide) return
    const strength = computeLocalStrength(activeSlide.title, activeSlide.body, activeSlide.type)
    setSlides(prev => prev.map((s, i) => i === activeIdx ? { ...s, strength } : s))
  }, [activeSlide?.title, activeSlide?.body, activeIdx])

  // Compute canvas scale to fit viewport
  useEffect(() => {
    const compute = () => {
      const el = canvasContainerRef.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      const availW = rect.width - 48
      const availH = rect.height - 48
      const s = Math.min(availW / SLIDE_SIZE, availH / SLIDE_SIZE)
      setCanvasScale(Math.max(0.15, Math.min(0.9, s)))
    }
    compute()
    window.addEventListener('resize', compute)
    return () => window.removeEventListener('resize', compute)
  }, [])

  // Transform-based carousel: no scrollIntoView needed.
  // The active slide is centered via translateX on the inner flex row.

  // Update helpers
  const updateActive = (patch: Partial<Slide>) => {
    setSlides(prev => prev.map((s, i) => i === activeIdx ? { ...s, ...patch } : s))
  }
  const updateActiveToggle = (key: keyof Slide['toggles']) => {
    setSlides(prev => prev.map((s, i) => i === activeIdx ? { ...s, toggles: { ...s.toggles, [key]: !s.toggles[key] } } : s))
  }

  // Per-field visibility toggles (NEW: toggle+input pattern)
  const updateActiveFieldToggle = (key: keyof NonNullable<Slide['fieldToggles']>) => {
    setSlides(prev => prev.map((s, i) => {
      if (i !== activeIdx) return s
      const cur = s.fieldToggles || {}
      return { ...s, fieldToggles: { ...cur, [key]: !cur[key] } }
    }))
  }
  const reorderSlide = (direction: -1 | 1) => {
    const to = activeIdx + direction
    if (to < 0 || to >= slides.length) return
    moveSlide(activeIdx, to)
  }

  // Keyboard navigation + arrow-key nudge for avatar/swipe
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tg = e.target as HTMLElement
      if (tg?.tagName === 'INPUT' || tg?.tagName === 'TEXTAREA' || tg?.isContentEditable) {
        if (e.key === 'Escape') { setSelectedEl(null); setNudgeTarget(null) }
        return
      }
      if (e.key === 'Escape') { setSelectedEl(null); setNudgeTarget(null); return }

      // Arrow-key nudge when an element is selected
      if (nudgeTarget && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault()
        const step = e.shiftKey ? 10 : 1
        const dx = e.key === 'ArrowLeft' ? -step : e.key === 'ArrowRight' ? step : 0
        const dy = e.key === 'ArrowUp' ? -step : e.key === 'ArrowDown' ? step : 0
        if (nudgeTarget === 'avatar') {
          setSlides(prev => prev.map((s, i) => (i === activeIdx && !s.avatarLocked) ? { ...s, avatarPos: { dx: (s.avatarPos?.dx || 0) + dx, dy: (s.avatarPos?.dy || 0) + dy } } : s))
        } else {
          setSlides(prev => prev.map((s, i) => (i === activeIdx && !s.swipeLocked) ? { ...s, swipePos: { dx: (s.swipePos?.dx || 0) + dx, dy: (s.swipePos?.dy || 0) + dy } } : s))
        }
        return
      }

      // Slide navigation (only when no nudge target active)
      if (!nudgeTarget) {
        if (e.key === 'ArrowRight') setActiveIdx(i => Math.min(slides.length - 1, i + 1))
        else if (e.key === 'ArrowLeft') setActiveIdx(i => Math.max(0, i - 1))
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [slides.length, nudgeTarget, activeIdx])

  // ===== GENERATE CAROUSEL =====
  const handleGenerate = useCallback(async () => {
    const source = inputTab === 'import' ? importContent : topic
    if (!source.trim()) { toast('Enter a topic or paste content first', 'error'); return }
    setGenerating(true)
    try {
      const res = await fetch(`${BACKEND_URL}/api/carousel/generate`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: inputTab === 'import' ? '' : topic,
          pastedContent: inputTab === 'import' ? importContent : '',
          platform, slideCount: Math.max(5, slides.length), userId,
        })
      })
      const d = await res.json()
      if (!d.success) throw new Error(d.detail || 'Failed')
      const newSlides: Slide[] = (d.data.slides || []).map((s: any, i: number) => {
        const existing = slides[i]
        const isLast = i === d.data.slides.length - 1
        return {
          id: existing?.id || uid(),
          type: (s.type as SlideType) || (i === 0 ? 'hook' : isLast ? 'cta' : 'value'),
          layout: existing?.layout || 'text',
          title: s.title || '',
          body: s.body || '',
          tagline: s.tagline || '',
          ctaText: existing?.ctaText || (isLast ? 'Follow For More' : ''),
          toggles: existing?.toggles || { title: true, body: Boolean(s.body), tagline: Boolean(s.tagline), cta: isLast },
          image: existing?.image || null,
          introStyle: existing?.introStyle || 'standard',
          emoji: existing?.emoji,
          strength: computeLocalStrength(s.title || '', s.body || '', s.type),
        }
      })
      if (newSlides.length > 0) {
        setSlides(newSlides); setActiveIdx(0); toast('Carousel updated with your content!')
      }
    } catch (e: any) {
      toast(e.message || 'Generation failed', 'error')
    } finally {
      setGenerating(false)
    }
  }, [inputTab, topic, importContent, platform, slides.length, userId, toast])

  // ===== PLATFORM SWITCH =====
  const handlePlatformSwitch = async (p: PlatformId) => {
    if (p === platform) return
    setPlatform(p)
    if (slides.length === 0) return
    setActionLoading('platform')
    try {
      const res = await fetch(`${BACKEND_URL}/api/carousel/balance-text`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slides: slides.map(s => ({ type: s.type, title: s.title, body: s.body, tagline: s.tagline })), platform: p })
      })
      const d = await res.json()
      if (d.success && d.data.slides?.length) {
        setSlides(prev => prev.map((s, i) => {
          const ns = d.data.slides[i]; if (!ns) return s
          return { ...s, title: ns.title || s.title, body: ns.body || s.body, tagline: ns.tagline || s.tagline }
        }))
        toast(`Adapted for ${p}`)
      }
    } catch { /* silent */ } finally { setActionLoading(null) }
  }

  // ===== INLINE AI ACTIONS =====
  const handleSlideAction = async (action: 'improve' | 'viral' | 'rewrite-hook' | 'simplify' | 'curiosity') => {
    if (!activeSlide) return
    setSlideLoadingIdx(activeIdx)
    try {
      const res = await fetch(`${BACKEND_URL}/api/slide-assist`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slideText: `${activeSlide.title}${activeSlide.body ? '\n' + activeSlide.body : ''}`,
          action, context: slides.map(s => s.title).join(' | ').substring(0, 600), userId,
        })
      })
      const d = await res.json()
      if (!d.success) throw new Error(d.detail || 'Failed')
      const newText = String(d.data.text || '').trim()
      const lines = newText.split('\n').filter(Boolean)
      const newTitle = lines[0]?.substring(0, 120) || activeSlide.title
      const newBody = lines.slice(1).join(' ').substring(0, 400) || (newText.length > 80 ? newText : '')
      updateActive({ title: newTitle, body: newBody || activeSlide.body })
      toast(`Slide ${activeIdx + 1} updated!`)
    } catch (e: any) { toast(e.message || 'AI action failed', 'error') }
    finally { setSlideLoadingIdx(null) }
  }

  const handleRegenerateSlide = async () => {
    if (!activeSlide) return
    setSlideLoadingIdx(activeIdx)
    try {
      const res = await fetch(`${BACKEND_URL}/api/carousel/regenerate-slide`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slideType: activeSlide.type, slideTitle: activeSlide.title, slideBody: activeSlide.body,
          context: slides.map(s => `[${s.type}] ${s.title}`).join('\n'),
          platform, topic: topic || importContent, userId,
        })
      })
      const d = await res.json()
      if (!d.success) throw new Error(d.detail || 'Failed')
      updateActive({ title: d.data.title || activeSlide.title, body: d.data.body || activeSlide.body, tagline: d.data.tagline || activeSlide.tagline })
      toast('Slide regenerated!')
    } catch (e: any) { toast(e.message || 'Regeneration failed', 'error') }
    finally { setSlideLoadingIdx(null) }
  }

  const handleHookSwitch = async (style: 'bold' | 'story' | 'controversial') => {
    const hook = slides[0]
    if (!hook) return
    setActionLoading('hook')
    try {
      const res = await fetch(`${BACKEND_URL}/api/carousel/hook-switch`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentHook: `${hook.title}\n${hook.body}`, style, topic: topic || importContent, platform })
      })
      const d = await res.json()
      if (!d.success) throw new Error(d.detail || 'Failed')
      setSlides(prev => prev.map((s, i) => i === 0 ? { ...s, title: d.data.title || s.title, body: d.data.body || s.body } : s))
      setActiveIdx(0); toast(`Hook switched to ${style}`)
    } catch (e: any) { toast(e.message || 'Switch failed', 'error') }
    finally { setActionLoading(null) }
  }

  const handleFlowOptimize = async () => {
    setActionLoading('flow')
    try {
      const res = await fetch(`${BACKEND_URL}/api/carousel/flow-optimize`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slides: slides.map(s => ({ type: s.type, title: s.title, body: s.body })), topic: topic || importContent, platform })
      })
      const d = await res.json()
      if (!d.success) throw new Error(d.detail || 'Failed')
      const newSlides: Slide[] = (d.data.slides || []).map((ns: any, i: number) => {
        const base = slides[i] || slides[0]
        return { ...base, id: uid(), type: ns.type || base.type, title: ns.title || base.title, body: ns.body || base.body, tagline: ns.tagline || base.tagline }
      })
      if (newSlides.length) { setSlides(newSlides); toast('Flow optimized!') }
    } catch (e: any) { toast(e.message || 'Optimization failed', 'error') }
    finally { setActionLoading(null) }
  }

  const handleBalanceText = async () => {
    setActionLoading('balance')
    try {
      const res = await fetch(`${BACKEND_URL}/api/carousel/balance-text`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slides: slides.map(s => ({ type: s.type, title: s.title, body: s.body })), platform })
      })
      const d = await res.json()
      if (!d.success) throw new Error(d.detail || 'Failed')
      setSlides(prev => prev.map((s, i) => {
        const ns = d.data.slides?.[i]; if (!ns) return s
        return { ...s, title: ns.title || s.title, body: ns.body || s.body }
      }))
      toast('Text balanced!')
    } catch (e: any) { toast(e.message || 'Balance failed', 'error') }
    finally { setActionLoading(null) }
  }

  const handleConvertToPoll = async () => {
    const source = slides.map(s => `${s.title} ${s.body}`).join(' ')
    setPollLoading(true); setPollResult(null)
    try {
      const res = await fetch(`${BACKEND_URL}/api/generate-poll`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourceContent: source, platform, userId })
      })
      const d = await res.json()
      if (!d.success) throw new Error(d.detail || 'Failed')
      setPollResult(d.data); toast('Poll generated!')
    } catch (e: any) { toast(e.message || 'Poll failed', 'error') }
    finally { setPollLoading(false) }
  }

  // ===== SLIDE CRUD =====
  const addSlide = () => {
    const newSlide: Slide = {
      id: uid(), type: 'value', layout: 'text', title: 'New slide', body: 'Click to edit.', tagline: '', ctaText: '',
      toggles: { title: true, body: true, tagline: false, cta: false }, image: null,
    }
    setSlides(prev => [...prev, newSlide]); setActiveIdx(slides.length)
  }
  const duplicateSlide = () => {
    if (!activeSlide) return
    const copy: Slide = { ...activeSlide, id: uid() }
    setSlides(prev => {
      const next = [...prev]
      next.splice(activeIdx + 1, 0, copy)
      return next
    })
    setActiveIdx(activeIdx + 1)
    toast('Slide duplicated!')
  }
  const removeSlide = (idx: number) => {
    if (slides.length <= 1) { toast('Need at least 1 slide', 'error'); return }
    setSlides(prev => prev.filter((_, i) => i !== idx))
    if (activeIdx >= slides.length - 1) setActiveIdx(Math.max(0, slides.length - 2))
  }
  const moveSlide = (from: number, to: number) => {
    if (from === to) return
    setSlides(prev => {
      const copy = [...prev]
      const [m] = copy.splice(from, 1); copy.splice(to, 0, m)
      return copy
    })
    setActiveIdx(to)
  }

  // ===== IMAGES =====
  const applyImage = (url: string) => {
    updateActive({ image: { url, pos: activeSlide?.image?.pos || 'right', scale: activeSlide?.image?.scale || 1 }, layout: activeSlide?.layout === 'text' ? 'text-image' : activeSlide?.layout || 'text-image' })
    toast('Image applied!')
  }
  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return
    const reader = new FileReader(); reader.onload = () => applyImage(reader.result as string); reader.readAsDataURL(file)
  }
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return
    const reader = new FileReader(); reader.onload = () => setBrandLogo(reader.result as string); reader.readAsDataURL(file)
  }
  const handleAIImageGen = async () => {
    if (!aiImgPrompt.trim()) { toast('Describe the image first', 'error'); return }
    setImgGenLoading(true)
    try {
      const res = await fetch(`${BACKEND_URL}/api/generate-image`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: aiImgPrompt, userId })
      })
      const d = await res.json()
      if (!d.success) throw new Error(d.detail || 'Failed')
      applyImage(d.data.image)
    } catch (e: any) { toast(e.message || 'Image gen failed', 'error') }
    finally { setImgGenLoading(false) }
  }

  const filteredStock = useMemo(() => {
    if (!imgSearchQuery.trim()) return STOCK_POOL
    const q = imgSearchQuery.toLowerCase()
    return STOCK_POOL.filter(s => s.tag.toLowerCase().includes(q))
  }, [imgSearchQuery])

  // ===== EXPORT =====
  const exportSlides = async (fromIdx: number, toIdx: number, format: 'png' | 'jpg'): Promise<{ dataUrl: string; idx: number }[]> => {
    const imgs: { dataUrl: string; idx: number }[] = []
    for (let i = fromIdx; i <= toIdx; i++) {
      setActiveIdx(i)
      await new Promise(r => setTimeout(r, 350))
      if (slideRef.current) {
        const dataUrl = format === 'jpg'
          ? await toJpeg(slideRef.current, { quality: 0.92, pixelRatio: 2, cacheBust: true })
          : await toPng(slideRef.current, { quality: 0.95, pixelRatio: 2, cacheBust: true })
        imgs.push({ dataUrl, idx: i })
      }
    }
    return imgs
  }
  const handleExport = async () => {
    const from = Math.max(0, (exportFrom || 1) - 1)
    const to = Math.min(slides.length - 1, (exportTo || slides.length) - 1)
    if (from > to) { toast('Invalid range', 'error'); return }
    setActionLoading('export')
    setShowExportModal(false)
    try {
      if (exportFormat === 'zip') {
        const imgs = await exportSlides(from, to, 'png')
        const zip = new JSZip()
        imgs.forEach(({ dataUrl, idx }) => {
          const base64 = dataUrl.split(',')[1]
          zip.file(`slide-${idx + 1}.png`, base64, { base64: true })
        })
        const blob = await zip.generateAsync({ type: 'blob' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a'); a.href = url; a.download = `carousel-${Date.now()}.zip`; a.click()
        URL.revokeObjectURL(url)
        toast(`Exported ${imgs.length} slides as ZIP`)
      } else {
        const imgs = await exportSlides(from, to, exportFormat)
        imgs.forEach(({ dataUrl, idx }) => {
          const a = document.createElement('a')
          a.href = dataUrl; a.download = `slide-${idx + 1}.${exportFormat}`; a.click()
        })
        toast(`Exported ${imgs.length} slides as ${exportFormat.toUpperCase()}`)
      }
    } catch (e: any) { toast(e.message || 'Export failed', 'error') }
    finally { setActionLoading(null) }
  }
  const handleExportPNG = async () => {
    setActionLoading('png')
    try {
      const imgs = await exportSlides(0, slides.length - 1, 'png')
      imgs.forEach(({ dataUrl, idx }) => {
        const a = document.createElement('a')
        a.href = dataUrl; a.download = `carousel-slide-${idx + 1}.png`; a.click()
      })
      toast(`Exported ${imgs.length} slides as PNG`)
    } catch (e: any) { toast(e.message || 'Export failed', 'error') }
    finally { setActionLoading(null) }
  }
  const handleExportPDF = async () => {
    setActionLoading('pdf')
    try {
      const imgs = await exportSlides(0, slides.length - 1, 'png')
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'px', format: [1080, 1080] })
      imgs.forEach(({ dataUrl, idx }) => {
        if (idx > 0) pdf.addPage([1080, 1080], 'portrait')
        pdf.addImage(dataUrl, 'PNG', 0, 0, 1080, 1080)
      })
      pdf.save(`carousel-${Date.now()}.pdf`)
      toast('PDF downloaded!')
    } catch (e: any) { toast(e.message || 'PDF export failed', 'error') }
    finally { setActionLoading(null) }
  }
  const handleCopySlideToClipboard = async () => {
    setActionLoading('copy')
    try {
      if (!slideRef.current) return
      const dataUrl = await toPng(slideRef.current, { quality: 0.95, pixelRatio: 2 })
      const blob = await (await fetch(dataUrl)).blob()
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
      toast('Slide image copied!')
    } catch { toast('Copy failed (browser may not support)', 'error') }
    finally { setActionLoading(null) }
  }
  const handleCopyText = () => {
    const text = slides.map((s, i) => `Slide ${i + 1}: ${s.title}${s.body ? '\n' + s.body : ''}`).join('\n\n')
    navigator.clipboard.writeText(text); toast('Text copied!')
  }
  const handleSaveLibrary = async () => {
    setActionLoading('save')
    try {
      const content = slides.map(s => `${s.title}\n${s.body}`).join('\n\n')
      await fetch(`${BACKEND_URL}/api/library/save`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, content, hook: slides[0]?.title || '', contentType: 'carousel', contentStrength: 'Medium' })
      })
      toast('Saved to Library!')
    } catch { toast('Save failed', 'error') }
    finally { setActionLoading(null) }
  }

  const strengthColor = (strength?: string) =>
    strength === 'Strong' ? '#10B981' : strength === 'Weak' ? '#EF4444' : '#F59E0B'

  // ===== EDITOR NODE (bound to active slide, rendered inside active column) =====
  const editorNode: any = (() => {
    if (!activeSlide) return null
    const role: 'intro' | 'content' | 'outro' = activeIdx === 0 ? 'intro' : activeIdx === slides.length - 1 ? 'outro' : 'content'
    const ft = activeSlide.fieldToggles || {}
    const introType: 'standard' | 'emoji' | 'headshot' | 'image' = (() => {
      const s = activeSlide.introStyle
      if (s === 'full-image') return 'image'
      if (s === 'emoji') return 'emoji'
      if (s === 'headshot') return 'headshot'
      return 'standard'
    })()
    const setIntroType = (t: 'standard' | 'emoji' | 'headshot' | 'image') => {
      updateActive({ introStyle: t === 'image' ? 'full-image' : t })
    }
    const contentType: 'text' | 'text-image' | 'image' = activeSlide.layout
    const setContentType = (t: 'text' | 'text-image' | 'image') => updateActive({ layout: t })
    const outroType = activeSlide.outroStyle || 'standard'
    const setOutroType = (t: 'standard' | 'headshot' | 'image') => updateActive({ outroStyle: t })

    return (
      <div
        key={`editor-${activeIdx}`}
        className="mt-3 editor-fade-up"
        data-testid="editor-panel-wrapper"
        style={{ width: 420, maxWidth: 'calc(100vw - 24px)' }}
      >
        {/* Attached editor card — scrolls with page, no overlap */}
        <div
          data-testid="editor-panel"
          style={{
            width: '100%',
            background: '#FFFFFF',
            borderRadius: 16,
            boxShadow: '0 10px 30px rgba(0,0,0,0.06), 0 2px 6px rgba(0,0,0,0.04)',
            border: '1px solid #EEF0F2',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {/* Compact toolbar (icon-only) */}
          <div className="shrink-0 flex items-center gap-1 px-3 py-2 border-b" style={{ borderColor: '#F0F0F5' }}>
            <button onClick={() => reorderSlide(-1)} disabled={activeIdx === 0} data-testid="reorder-prev-btn"
              title="Move slide left"
              className="w-8 h-8 rounded-lg border flex items-center justify-center transition-all hover:bg-[#F9FAFB] disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ borderColor: '#E5E7EB', color: '#1A1A2E' }}>
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => removeSlide(activeIdx)} disabled={slides.length <= 1} data-testid="delete-slide-btn"
              title="Delete slide"
              className="w-8 h-8 rounded-lg border flex items-center justify-center transition-all hover:bg-[#FEF2F2] hover:border-[#FECACA] hover:text-[#DC2626] disabled:opacity-40"
              style={{ borderColor: '#E5E7EB', color: '#1A1A2E' }}>
              <Trash2 className="w-3.5 h-3.5" />
            </button>
            <button onClick={addSlide} data-testid="add-slide-btn"
              title="Add new slide"
              className="h-8 px-2.5 rounded-lg flex items-center gap-1 text-[11px] font-bold transition-all"
              style={{ background: '#6B4EFF', color: '#FFFFFF' }}>
              <Plus className="w-3 h-3" /> Add
            </button>
            <button onClick={() => reorderSlide(1)} disabled={activeIdx === slides.length - 1} data-testid="reorder-next-btn"
              title="Move slide right"
              className="w-8 h-8 rounded-lg border flex items-center justify-center transition-all hover:bg-[#F9FAFB] disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ borderColor: '#E5E7EB', color: '#1A1A2E' }}>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
            <div className="ml-auto flex items-center gap-1.5">
              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider" style={{ background: '#F3F4F6', color: '#6B7280', letterSpacing: '0.05em' }}>{role}</span>
              <span className="text-[10px] font-semibold tabular-nums" style={{ color: '#6B7280' }}>{activeIdx + 1}/{slides.length}</span>
            </div>
          </div>

          {/* Panel body — natural height, page scrolls */}
          <div data-testid="editor-panel-body">
            <div className="p-2 space-y-1.5">
            {/* ===== Accordion: Slide Type ===== */}
            <div className="rounded-xl border overflow-hidden" style={{ borderColor: '#EEF0F2' }}>
            <Accordion id="slide-type" title="Slide Type" icon={LayoutGrid} openSet={openSections} toggle={toggleSection}>
            {/* ===== Type switcher ===== */}
            {role === 'intro' && (
              <SegmentedTabs value={introType} onChange={setIntroType} testIdPrefix="intro-type"
                options={[
                  { id: 'standard', label: 'Standard', icon: Type },
                  { id: 'emoji', label: 'Emoji', icon: Sparkles },
                  { id: 'headshot', label: 'Headshot', icon: Users },
                  { id: 'image', label: 'Image', icon: ImageIcon },
                ]} />
            )}
            {role === 'content' && (
              <SegmentedTabs value={contentType} onChange={setContentType} testIdPrefix="content-type"
                options={[
                  { id: 'text', label: 'Text', icon: Type },
                  { id: 'text-image', label: 'Text + Image', icon: LayoutGrid },
                  { id: 'image', label: 'Image', icon: ImageIcon },
                ]} />
            )}
            {role === 'outro' && (
              <SegmentedTabs value={outroType} onChange={setOutroType} testIdPrefix="outro-type"
                options={[
                  { id: 'standard', label: 'Standard', icon: Type },
                  { id: 'headshot', label: 'Headshot', icon: Users },
                  { id: 'image', label: 'Image', icon: ImageIcon },
                ]} />
            )}

            {/* ===== Emoji picker (intro only, when emoji selected) ===== */}
            {role === 'intro' && introType === 'emoji' && (
              <div className="rounded-xl border p-4" style={{ borderColor: '#E5E7EB' }} data-testid="emoji-picker">
                <label className="text-[12px] font-bold uppercase tracking-wider mb-2 block" style={{ color: '#1A1A2E' }}>Choose Emoji</label>
                <div className="grid grid-cols-8 gap-2">
                  {['🚀','💡','🔥','⚡','🎯','✨','📈','💎','🎨','🧠','💪','🌟','🏆','📚','🎁','🛠','🌱','☕','🎧','📱','💼','🌈','🔮','⏰','🍀','🎬','📊','🔔','🎉','💬','🗺','🧩'].map(em => (
                    <button key={em} onClick={() => updateActive({ emoji: em })} data-testid={`emoji-${em}`}
                      className="rounded-lg border transition-all hover:scale-110"
                      style={{
                        padding: 10, fontSize: 24, lineHeight: 1,
                        borderColor: activeSlide.emoji === em ? '#6B4EFF' : '#E5E7EB',
                        background: activeSlide.emoji === em ? '#EEEBFF' : '#FFFFFF',
                      }}>{em}</button>
                  ))}
                </div>
              </div>
            )}

            {/* ===== Headshot uploader (intro & outro) ===== */}
            {((role === 'intro' && introType === 'headshot') || (role === 'outro' && outroType === 'headshot')) && (
              <div className="rounded-xl border p-4 space-y-3" style={{ borderColor: '#E5E7EB' }} data-testid="headshot-section">
                <label className="text-[12px] font-bold uppercase tracking-wider block" style={{ color: '#1A1A2E' }}>Headshot</label>
                {activeSlide.headshot && (
                  <img src={activeSlide.headshot} alt="headshot" className="w-20 h-20 rounded-full object-cover border" style={{ borderColor: '#E5E7EB' }} />
                )}
                <input type="file" ref={fileInputRef} onChange={(e) => {
                  const file = e.target.files?.[0]; if (!file) return
                  const reader = new FileReader(); reader.onload = () => updateActive({ headshot: reader.result as string }); reader.readAsDataURL(file)
                }} accept="image/*" className="hidden" data-testid="file-input" />
                <button onClick={() => fileInputRef.current?.click()} data-testid="upload-headshot-btn"
                  className="w-full px-3 py-2 rounded-lg border text-[12px] font-semibold flex items-center justify-center gap-2 hover:bg-[#F9FAFB] transition-all"
                  style={{ borderColor: '#E5E7EB', color: '#1A1A2E' }}>
                  <Upload className="w-3.5 h-3.5" /> Upload Headshot
                </button>
                <div className="flex items-center gap-3 my-1">
                  <div className="flex-1 h-px" style={{ background: '#E5E7EB' }} />
                  <span className="text-[10px] uppercase font-bold" style={{ color: '#888888' }}>or</span>
                  <div className="flex-1 h-px" style={{ background: '#E5E7EB' }} />
                </div>
                <button
                  onClick={() => toast('AI headshot generation coming soon — beta', 'info')}
                  data-testid="generate-headshot-btn"
                  className="w-full px-3 py-2 rounded-lg text-[12px] font-semibold flex items-center justify-center gap-2 transition-all"
                  style={{ background: '#EEEBFF', color: '#6B4EFF', border: '1px solid #D9D0FF' }}>
                  <Sparkles className="w-3.5 h-3.5" /> Generate Headshot
                  <span className="text-[9px] px-1.5 py-0.5 rounded-md ml-1" style={{ background: '#6B4EFF', color: '#FFFFFF' }}>BETA</span>
                </button>
              </div>
            )}

            {/* ===== Image picker (reusable) ===== */}
            {((role === 'intro' && introType === 'image') ||
              (role === 'content' && (contentType === 'text-image' || contentType === 'image')) ||
              (role === 'outro' && outroType === 'image')) && (
              <ImagePickerSubPanel
                slide={activeSlide}
                imageSubTab={imageSubTab} setImageSubTab={setImageSubTab}
                imgSearchQuery={imgSearchQuery} setImgSearchQuery={setImgSearchQuery}
                aiImgPrompt={aiImgPrompt} setAiImgPrompt={setAiImgPrompt}
                filteredStock={filteredStock} applyImage={applyImage}
                fileInputRef={fileInputRef} handleUpload={handleUpload}
                imgGenLoading={imgGenLoading} handleAIImageGen={handleAIImageGen}
                updateActive={updateActive} topic={topic || importContent}
                toast={toast}
              />
            )}
            </Accordion>
            </div>

            {/* ===== Accordion: Text ===== */}
            <div className="rounded-xl border overflow-hidden" style={{ borderColor: '#EEF0F2' }}>
            <Accordion id="text" title="Text" icon={Type} openSet={openSections} toggle={toggleSection}>
            {/* ===== INTRO FIELDS ===== */}
            {role === 'intro' && (
              <>
                <ToggleField id="tagline" label="Tagline" enabled={ft.tagline !== false} onToggle={() => updateActiveFieldToggle('tagline')}>
                  <input value={activeSlide.tagline} onChange={e => updateActive({ tagline: e.target.value })}
                    placeholder="A SHORT TAGLINE"
                    className="w-full px-3 py-2 rounded-md border text-[13px]" maxLength={100}
                    style={{ borderColor: '#E5E7EB' }} data-testid="tagline-input" />
                </ToggleField>
                <ToggleField id="title" label="Title" enabled={ft.title !== false} onToggle={() => updateActiveFieldToggle('title')}>
                  <input value={activeSlide.title} onChange={e => updateActive({ title: e.target.value })}
                    placeholder="Your **Powerful** Hook Goes Here"
                    className="w-full px-3 py-2 rounded-md border text-[13px]" maxLength={160}
                    style={{ borderColor: '#E5E7EB' }} data-testid="title-input" />
                  <p className="text-[10px]" style={{ color: '#888888' }}>Wrap a word in <code>**word**</code> to highlight it in accent color.</p>
                </ToggleField>
                <ToggleField id="body" label="Paragraph" enabled={ft.body !== false} onToggle={() => updateActiveFieldToggle('body')}>
                  <textarea value={activeSlide.body} onChange={e => updateActive({ body: e.target.value })}
                    placeholder="A clear value statement..."
                    className="w-full px-3 py-2 rounded-md border text-[13px] resize-none" rows={3} maxLength={400}
                    style={{ borderColor: '#E5E7EB' }} data-testid="body-input" />
                </ToggleField>
                <ToggleField id="swipe" label="Swipe Indicator" enabled={ft.swipe !== false} onToggle={() => updateActiveFieldToggle('swipe')}>
                  <input value={activeSlide.swipeText || ''} onChange={e => updateActive({ swipeText: e.target.value })}
                    placeholder="Swipe"
                    className="w-full px-3 py-2 rounded-md border text-[13px]" maxLength={20}
                    style={{ borderColor: '#E5E7EB' }} data-testid="swipe-input" />
                  <div className="flex items-center gap-1 mt-1">
                    {(activeSlide.swipePos?.dx || activeSlide.swipePos?.dy) ? (
                      <button onClick={() => updateActive({ swipePos: { dx: 0, dy: 0 } })}
                        className="text-[11px] font-semibold px-2 py-0.5 rounded-md transition-all hover:bg-[#EEEBFF] flex-1"
                        style={{ color: '#6B4EFF' }}>
                        ↩ Reset position
                      </button>
                    ) : <div className="flex-1" />}
                    <button
                      onClick={() => updateActive({ swipeLocked: !activeSlide.swipeLocked })}
                      title={activeSlide.swipeLocked ? 'Unlock position' : 'Lock position'}
                      className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold transition-all hover:bg-[#EEEBFF]"
                      style={{ color: activeSlide.swipeLocked ? '#6B4EFF' : '#9CA3AF' }}>
                      {activeSlide.swipeLocked ? <Lock className="w-3 h-3" /> : <LockOpen className="w-3 h-3" />}
                      {activeSlide.swipeLocked ? 'Locked' : 'Lock'}
                    </button>
                  </div>
                </ToggleField>
                <ToggleField id="bgImage" label="Background Image" enabled={!!ft.bgImage} onToggle={() => updateActiveFieldToggle('bgImage')}>
                  <input type="file" onChange={(e) => {
                    const file = e.target.files?.[0]; if (!file) return
                    const reader = new FileReader(); reader.onload = () => updateActive({ backgroundImage: reader.result as string }); reader.readAsDataURL(file)
                  }} accept="image/*" className="text-[12px]" data-testid="bg-image-upload" />
                </ToggleField>
              </>
            )}

            {/* ===== CONTENT FIELDS ===== */}
            {role === 'content' && (
              <>
                <ToggleField id="title" label="Title" enabled={ft.title !== false} onToggle={() => updateActiveFieldToggle('title')}>
                  <input value={activeSlide.title} onChange={e => updateActive({ title: e.target.value })}
                    placeholder="Title with **accent** word"
                    className="w-full px-3 py-2 rounded-md border text-[13px]" maxLength={160}
                    style={{ borderColor: '#E5E7EB' }} data-testid="title-input" />
                  <p className="text-[10px]" style={{ color: '#888888' }}>Wrap a word in <code>**word**</code> to highlight it.</p>
                </ToggleField>
                <ToggleField id="body" label="Paragraph" enabled={ft.body !== false} onToggle={() => updateActiveFieldToggle('body')}>
                  <textarea value={activeSlide.body} onChange={e => updateActive({ body: e.target.value })}
                    placeholder="Write your paragraph..."
                    className="w-full px-3 py-2 rounded-md border text-[13px] resize-none" rows={4} maxLength={500}
                    style={{ borderColor: '#E5E7EB' }} data-testid="body-input" />
                </ToggleField>
                <div className="rounded-xl border px-4 py-3 flex items-center justify-between" style={{ borderColor: '#E5E7EB' }} data-testid="field-hide-counter">
                  <label className="text-[12px] font-bold uppercase tracking-wider" style={{ color: '#1A1A2E' }}>Hide Counter</label>
                  <button
                    onClick={() => updateActive({ hideCounter: !activeSlide.hideCounter })}
                    data-testid="hide-counter-toggle"
                    role="switch"
                    aria-checked={!!activeSlide.hideCounter}
                    style={{
                      width: 40, height: 22, borderRadius: 999,
                      background: activeSlide.hideCounter ? '#6B4EFF' : '#CCCCCC',
                      position: 'relative', transition: 'background 0.18s ease',
                      cursor: 'pointer', border: 'none',
                    }}>
                    <span style={{
                      position: 'absolute', top: 2, left: activeSlide.hideCounter ? 20 : 2,
                      width: 18, height: 18, borderRadius: 999, background: '#FFFFFF',
                      transition: 'left 0.18s ease', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                    }} />
                  </button>
                </div>
              </>
            )}

            {/* ===== OUTRO FIELDS ===== */}
            {role === 'outro' && (
              <>
                <ToggleField id="tagline" label="Tagline" enabled={ft.tagline !== false} onToggle={() => updateActiveFieldToggle('tagline')}>
                  <input value={activeSlide.tagline} onChange={e => updateActive({ tagline: e.target.value })}
                    placeholder="THE TAKEAWAY"
                    className="w-full px-3 py-2 rounded-md border text-[13px]" maxLength={100}
                    style={{ borderColor: '#E5E7EB' }} data-testid="tagline-input" />
                </ToggleField>
                <ToggleField id="title" label="Title" enabled={ft.title !== false} onToggle={() => updateActiveFieldToggle('title')}>
                  <input value={activeSlide.title} onChange={e => updateActive({ title: e.target.value })}
                    placeholder="Found this **useful**?"
                    className="w-full px-3 py-2 rounded-md border text-[13px]" maxLength={160}
                    style={{ borderColor: '#E5E7EB' }} data-testid="title-input" />
                </ToggleField>
                <ToggleField id="body" label="Paragraph" enabled={ft.body !== false} onToggle={() => updateActiveFieldToggle('body')}>
                  <textarea value={activeSlide.body} onChange={e => updateActive({ body: e.target.value })}
                    className="w-full px-3 py-2 rounded-md border text-[13px] resize-none" rows={3} maxLength={400}
                    style={{ borderColor: '#E5E7EB' }} data-testid="body-input" />
                </ToggleField>
                <ToggleField id="cta" label="Call To Action" enabled={ft.cta !== false} onToggle={() => updateActiveFieldToggle('cta')}>
                  <input value={activeSlide.ctaText} onChange={e => updateActive({ ctaText: e.target.value })}
                    placeholder="Visit us at yourbrand.com"
                    className="w-full px-3 py-2 rounded-md border text-[13px]" maxLength={60}
                    style={{ borderColor: '#E5E7EB' }} data-testid="cta-input" />
                </ToggleField>
                <ToggleField id="icons" label="Icons (Comment, Like, Save)" enabled={!!ft.icons} onToggle={() => updateActiveFieldToggle('icons')}>
                  <p className="text-[11px]" style={{ color: '#6B7280' }}>Social icons will render at the bottom-right of the slide.</p>
                </ToggleField>
              </>
            )}

            {/* ===== BRAND IDENTITY (intro & outro) ===== */}
            </Accordion>
            </div>

            {/* ===== Accordion: Brand ===== */}
            {(role === 'intro' || role === 'outro') && (
              <div className="rounded-xl border overflow-hidden" style={{ borderColor: '#EEF0F2' }}>
              <Accordion id="brand" title="Brand" icon={Users} openSet={openSections} toggle={toggleSection}>
              <div className="space-y-2" data-testid="brand-section">
                <input type="file" ref={logoInputRef} onChange={handleLogoUpload} accept="image/*" className="hidden" />
                <button onClick={() => logoInputRef.current?.click()} data-testid="logo-btn"
                  className="w-full px-3 py-2 rounded-lg border text-[12px] font-semibold flex items-center justify-center gap-2 hover:bg-[#F9FAFB] transition-all"
                  style={{ borderColor: '#E5E7EB', color: '#1A1A2E' }}>
                  {brandLogo ? <img src={brandLogo} alt="logo" className="w-4 h-4 rounded object-cover" /> : <Upload className="w-3.5 h-3.5" />}
                  {brandLogo ? 'Change Avatar' : 'Upload Avatar'}
                </button>
                <div className="grid grid-cols-2 gap-2">
                  <input value={brandName} onChange={e => setBrandName(e.target.value)} data-testid="brand-name"
                    placeholder="Your Name" className="px-3 py-2 rounded-md border text-[13px]" style={{ borderColor: '#E5E7EB' }} maxLength={40} />
                  <input value={brandRole} onChange={e => setBrandRole(e.target.value)} data-testid="brand-role"
                    placeholder="Your Role" className="px-3 py-2 rounded-md border text-[13px]" style={{ borderColor: '#E5E7EB' }} maxLength={40} />
                </div>
                <input value={brandHandle} onChange={e => setBrandHandle(e.target.value)} data-testid="brand-handle"
                  placeholder="@yourhandle" className="w-full px-3 py-2 rounded-md border text-[13px]" style={{ borderColor: '#E5E7EB' }} maxLength={40} />
                <div className="flex items-center gap-1">
                  {(activeSlide.avatarPos?.dx || activeSlide.avatarPos?.dy) ? (
                    <button onClick={() => updateActive({ avatarPos: { dx: 0, dy: 0 } })}
                      className="text-[11px] font-semibold px-2 py-0.5 rounded-md transition-all hover:bg-[#EEEBFF] flex-1"
                      style={{ color: '#6B4EFF' }}>
                      ↩ Reset avatar position
                    </button>
                  ) : <div className="flex-1" />}
                  <button
                    onClick={() => updateActive({ avatarLocked: !activeSlide.avatarLocked })}
                    title={activeSlide.avatarLocked ? 'Unlock avatar position' : 'Lock avatar position'}
                    className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold transition-all hover:bg-[#EEEBFF]"
                    style={{ color: activeSlide.avatarLocked ? '#6B4EFF' : '#9CA3AF' }}>
                    {activeSlide.avatarLocked ? <Lock className="w-3 h-3" /> : <LockOpen className="w-3 h-3" />}
                    {activeSlide.avatarLocked ? 'Locked' : 'Lock'}
                  </button>
                </div>
              </div>
              </Accordion>
              </div>
            )}

            {/* ===== DESIGN / STYLE section (always available) ===== */}
            <div className="rounded-xl border overflow-hidden" style={{ borderColor: '#EEF0F2' }} data-testid="design-section">
              <Accordion id="design" title="Design" icon={Palette} openSet={openSections} toggle={toggleSection}>
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-wider mb-1.5" style={{ color: '#888888' }}>Palette</p>
                  <div className="grid grid-cols-4 gap-1.5">
                    {PALETTES.map(p => (
                      <button key={p.id} onClick={() => setPaletteId(p.id)} data-testid={`palette-${p.id}`}
                        className="p-1.5 rounded-lg border transition-all"
                        style={{
                          borderColor: paletteId === p.id ? '#6B4EFF' : '#E5E7EB',
                          boxShadow: paletteId === p.id ? '0 0 0 3px rgba(107,78,255,0.15)' : 'none',
                        }}>
                        <div className="h-8 rounded-md mb-1" style={{ background: p.bgPreview }} />
                        <span className="text-[9px] font-bold" style={{ color: paletteId === p.id ? '#6B4EFF' : '#6B7280' }}>{p.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-wider mb-1.5 mt-3" style={{ color: '#888888' }}>Font Pair</p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {FONT_PAIRS.map(f => (
                      <button key={f.id} onClick={() => setFontPairId(f.id)} data-testid={`font-${f.id}`}
                        className="px-3 py-1.5 rounded-lg border transition-all text-left"
                        style={{
                          borderColor: fontPairId === f.id ? '#6B4EFF' : '#E5E7EB',
                          background: fontPairId === f.id ? '#EEEBFF' : '#FFFFFF',
                        }}>
                        <div className="text-[12px] font-bold" style={{ fontFamily: f.heading, color: fontPairId === f.id ? '#6B4EFF' : '#1A1A2E' }}>{f.label}</div>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-wider mb-1.5 mt-3" style={{ color: '#888888' }}>Background Effect</p>
                  <div className="grid grid-cols-3 gap-1.5">
                    {([
                      { id: 'solid' as const, label: 'Solid' },
                      { id: 'gradient' as const, label: 'Gradient' },
                      { id: 'grain' as const, label: 'Grain' },
                    ]).map(b => (
                      <button key={b.id} onClick={() => setBgEffect(b.id)} data-testid={`bg-${b.id}`}
                        className="px-2 py-1.5 rounded-lg border text-[10px] font-semibold transition-all"
                        style={{
                          borderColor: bgEffect === b.id ? '#6B4EFF' : '#E5E7EB',
                          background: bgEffect === b.id ? '#EEEBFF' : '#FFFFFF',
                          color: bgEffect === b.id ? '#6B4EFF' : '#6B7280',
                        }}>
                        {b.label}
                      </button>
                    ))}
                  </div>
                </div>
              </Accordion>
            </div>

            {/* ===== AI ACTIONS section ===== */}
            <div className="rounded-xl border overflow-hidden" style={{ borderColor: '#E5E7EB' }} data-testid="ai-actions-section">
              <Accordion id="ai-actions" title="AI Actions" icon={Sparkles} openSet={openSections} toggle={toggleSection}>
                <div className="grid grid-cols-2 gap-1.5">
                  {([
                    { id: 'improve' as const, label: 'Improve', icon: Sparkles },
                    { id: 'viral' as const, label: 'More Viral', icon: Flame },
                    { id: 'rewrite-hook' as const, label: 'Rewrite Hook', icon: PenLine },
                    { id: 'simplify' as const, label: 'Simplify', icon: AlignJustify },
                    { id: 'curiosity' as const, label: 'Add Curiosity', icon: Lightbulb },
                  ]).map(a => (
                    <button key={a.id} onClick={() => handleSlideAction(a.id)} disabled={slideLoadingIdx !== null}
                      data-testid={`ai-${a.id}`}
                      className="flex items-center gap-1.5 px-2 py-2 rounded-lg border text-[10.5px] font-semibold transition-all hover:border-[#6B4EFF] hover:bg-[#EEEBFF] disabled:opacity-40"
                      style={{ borderColor: '#E5E7EB', color: '#6B7280' }}>
                      {slideLoadingIdx !== null ? <Loader2 className="w-3 h-3 animate-spin" /> : <a.icon className="w-3 h-3" />}
                      {a.label}
                    </button>
                  ))}
                </div>
                <button onClick={handleRegenerateSlide} disabled={slideLoadingIdx !== null} data-testid="regen-slide"
                  className="w-full mt-2 px-3 py-2 rounded-lg text-[11px] font-bold text-white flex items-center justify-center gap-1.5 disabled:opacity-50"
                  style={{ background: '#6B4EFF' }}>
                  {slideLoadingIdx === activeIdx ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                  Regenerate This Slide
                </button>
                <div className="pt-3 mt-2" style={{ borderTop: '1px dashed #E5E7EB' }}>
                  <p className="text-[9px] font-bold uppercase tracking-wider mb-1.5" style={{ color: '#888888' }}><Target className="w-3 h-3 inline mr-1" />Hook Switcher</p>
                  <div className="grid grid-cols-3 gap-1.5">
                    {([
                      { id: 'bold' as const, label: 'Bold' },
                      { id: 'story' as const, label: 'Story' },
                      { id: 'controversial' as const, label: 'Edgy' },
                    ]).map(h => (
                      <button key={h.id} onClick={() => handleHookSwitch(h.id)} disabled={actionLoading === 'hook'} data-testid={`hook-${h.id}`}
                        className="px-2 py-1.5 rounded-lg border text-[10px] font-semibold hover:bg-[#EEEBFF] transition-all disabled:opacity-40"
                        style={{ borderColor: '#E5E7EB', color: '#6B7280' }}>
                        {actionLoading === 'hook' ? '...' : h.label}
                      </button>
                    ))}
                  </div>
                </div>
                <button onClick={handleFlowOptimize} disabled={actionLoading === 'flow'} data-testid="flow-opt-btn"
                  className="w-full mt-1.5 px-3 py-2 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1.5 border hover:bg-[#EEEBFF] transition-all disabled:opacity-50"
                  style={{ borderColor: '#E5E7EB', color: '#1A1A2E' }}>
                  {actionLoading === 'flow' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <GitBranch className="w-3.5 h-3.5" />}Optimize Flow
                </button>
                <button onClick={handleBalanceText} disabled={actionLoading === 'balance'} data-testid="balance-btn"
                  className="w-full mt-1.5 px-3 py-2 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1.5 border hover:bg-[#EEEBFF] transition-all disabled:opacity-50"
                  style={{ borderColor: '#E5E7EB', color: '#1A1A2E' }}>
                  {actionLoading === 'balance' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Shuffle className="w-3.5 h-3.5" />}Balance Text
                </button>
                <button onClick={handleConvertToPoll} disabled={pollLoading} data-testid="poll-btn"
                  className="w-full mt-1.5 px-3 py-2 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1.5 border hover:bg-[#EEEBFF] transition-all disabled:opacity-50"
                  style={{ borderColor: '#E5E7EB', color: '#1A1A2E' }}>
                  {pollLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <BarChart3 className="w-3.5 h-3.5" />}Convert to Poll
                </button>
                {pollResult && (
                  <div className="mt-2 p-2 rounded-lg" style={{ background: '#EEEBFF', border: '1px solid #D9D0FF' }} data-testid="poll-result">
                    <p className="text-[10px] font-bold mb-1" style={{ color: '#1A1A2E' }}>{pollResult.question}</p>
                    {pollResult.options.map((o, i) => (
                      <div key={i} className="text-[9px] py-0.5 px-2 bg-white rounded mt-0.5" style={{ color: '#1A1A2E' }}>{String.fromCharCode(65 + i)}. {o}</div>
                    ))}
                  </div>
                )}
              </Accordion>
            </div>


          </div>
        </div>
        </div>
      </div>
    )
  })()

  // ===== RENDER =====
  return (
    <div className="h-screen flex flex-col" data-testid="carousel-builder" style={{ background: 'var(--bg-page)' }}>
      {/* ===== TOP: EDITOR HEADER (sticky, replaces dashboard header) ===== */}
      <div
        className="shrink-0 px-5 py-3 bg-white border-b"
        style={{ borderColor: '#e5e7eb', position: 'sticky', top: 0, zIndex: 40 }}
        data-testid="input-bar"
      >
        <div className="flex gap-3 flex-wrap items-center">
          {/* LEFT: Input tabs + field */}
          <div className="flex items-center gap-2 flex-1 min-w-[320px]">
            <div className="flex gap-0.5 p-0.5 rounded-lg shrink-0" style={{ background: 'var(--ink-100)' }}>
              {[
                { id: 'text' as const, label: 'Topic', icon: Type },
                { id: 'video' as const, label: 'Video', icon: FileImage },
                { id: 'import' as const, label: 'Paste', icon: FileText },
              ].map(t => (
                <button key={t.id} onClick={() => setInputTab(t.id)} data-testid={`input-tab-${t.id}`}
                  className={`px-2.5 py-1.5 rounded-md text-[11px] font-semibold transition-all flex items-center gap-1 ${inputTab === t.id ? 'bg-white shadow-sm' : ''}`}
                  style={{ color: inputTab === t.id ? 'var(--ink-900)' : 'var(--ink-400)' }}>
                  <t.icon className="w-3 h-3" />{t.label}
                </button>
              ))}
            </div>
            {inputTab === 'text' && (
              <input value={topic} onChange={e => setTopic(e.target.value)} data-testid="topic-input"
                placeholder="e.g. 5 lessons from building a $10K MRR SaaS in 90 days"
                className="d-input text-[13px] flex-1" />
            )}
            {inputTab === 'video' && (
              <input value={videoUrl} onChange={e => setVideoUrl(e.target.value)} data-testid="video-input"
                placeholder="Paste YouTube / TikTok URL (coming soon)"
                className="d-input text-[13px] flex-1" />
            )}
            {inputTab === 'import' && (
              <input value={importContent} onChange={e => setImportContent(e.target.value)} data-testid="import-input"
                placeholder="Paste post, article, or notes to convert..."
                className="d-input text-[13px] flex-1" />
            )}
          </div>

          {/* CENTER: Platform icons */}
          <div className="hidden md:flex gap-1 shrink-0">
            {PLATFORMS.map(p => (
              <button key={p.id} onClick={() => handlePlatformSwitch(p.id)} data-testid={`platform-${p.id}`}
                title={p.label}
                className={`w-9 h-9 rounded-lg flex items-center justify-center border transition-all ${platform === p.id ? 'border-[var(--brand-primary)] bg-[var(--brand-soft)]' : 'border-[#e5e7eb] hover:border-[var(--ink-400)]'}`}
                style={{ color: platform === p.id ? 'var(--brand-primary)' : 'var(--ink-400)' }}>
                <p.icon className="w-4 h-4" />
              </button>
            ))}
          </div>

          {/* Format dropdown — platform-aware aspect ratio */}
          <select
            value={format}
            onChange={e => setFormat(e.target.value as FormatId)}
            data-testid="format-select"
            aria-label="Preview format"
            className="hidden md:block shrink-0 px-3 py-2 rounded-lg text-[12px] font-semibold border bg-white hover:border-[var(--brand-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)] transition-all"
            style={{ borderColor: '#e5e7eb', color: '#1A1A2E', maxWidth: 200 }}
          >
            <optgroup label="LinkedIn">
              <option value="linkedin-4-5">LinkedIn (4:5 Recommended)</option>
              <option value="linkedin-1-1">LinkedIn (1:1)</option>
            </optgroup>
            <optgroup label="Instagram">
              <option value="instagram-1-1">Instagram Feed (1:1)</option>
              <option value="instagram-4-5">Instagram Feed (4:5)</option>
              <option value="instagram-stories">Instagram Stories (9:16)</option>
            </optgroup>
            <optgroup label="X / Twitter">
              <option value="twitter-1-1">X / Twitter (1:1)</option>
            </optgroup>
            <optgroup label="Threads">
              <option value="threads-3-4">Threads (3:4)</option>
            </optgroup>
            <optgroup label="TikTok">
              <option value="tiktok-9-16">TikTok (9:16)</option>
            </optgroup>
          </select>

          {/* RIGHT: Primary + secondary actions */}
          <button onClick={handleGenerate} disabled={generating || actionLoading === 'platform'} data-testid="generate-btn"
            className="px-4 py-2 rounded-xl font-bold text-[12px] text-white disabled:opacity-50 transition-all flex items-center gap-1.5 shrink-0"
            style={{ background: 'var(--brand-gradient)', boxShadow: 'var(--shadow-brand)' }}>
            {generating ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Updating...</> : <><Sparkles className="w-3.5 h-3.5" /> Generate</>}
          </button>
          <button
            onClick={() => { setExportFrom(1); setExportTo(slides.length); setShowExportModal(true) }}
            disabled={actionLoading === 'export'}
            data-testid="export-btn"
            style={{ padding: '8px 14px', fontSize: 12, background: '#f9fafb', border: '1px solid #e5e7eb', color: '#111827', borderRadius: 10, fontWeight: 600 }}
            className="hover:!bg-[#f3f4f6] transition-colors flex items-center gap-1.5 shrink-0">
            {actionLoading === 'export' ? <Loader2 className="w-3 h-3 animate-spin" /> : <FileImage className="w-3 h-3" />} Export
          </button>
          <button onClick={handleCopyText} data-testid="publish-btn"
            style={{ padding: '8px 14px', fontSize: 12, background: '#f9fafb', border: '1px solid #e5e7eb', color: '#111827', borderRadius: 10, fontWeight: 600 }}
            className="hover:!bg-[#f3f4f6] transition-colors flex items-center gap-1.5 shrink-0">
            <ArrowRight className="w-3 h-3" /> Publish
          </button>
        </div>
      </div>

      {/* ===== MAIN: Scrollable workspace (Preview on top, Editor attached below) ===== */}
      <div
        className="flex-1 overflow-y-auto overflow-x-hidden"
        data-testid="main-grid"
        style={{
          backgroundColor: '#f9fafb',
          backgroundImage: 'radial-gradient(#d1d5db 1px, transparent 1px)',
          backgroundSize: '16px 16px',
        }}
      >
        {/* Cover-flow preview strip — arrow navigation, no scrollbar */}
        <div
          className="w-full relative"
          data-testid="preview-strip"
          style={{ padding: '40px 0 8px' }}
          onClick={(e) => { if (e.target === e.currentTarget) { setSelectedEl(null); setNudgeTarget(null) } }}
        >
          <div
            ref={canvasContainerRef}
            className="w-full overflow-hidden hide-scrollbar"
          >
            <div
              className="flex items-start gap-0"
              style={{
                transform: `translateX(-${activeIdx * 420}px)`,
                paddingLeft: 'calc(50% - 210px)',
                paddingRight: 'calc(50% - 210px)',
                transition: 'transform 0.5s cubic-bezier(0.22, 1, 0.36, 1)',
                willChange: 'transform',
              }}
              data-testid="thumbnail-strip"
            >
              {slides.map((s, i) => {
                const isActive = i === activeIdx
                const frameWidth = 420
                // aspect ratio "W / H" — parse to compute frame height
                const [arW, arH] = FORMATS[format].aspect.split('/').map(v => parseFloat(v.trim()))
                const frameHeight = frameWidth * (arH / arW)
                // "cover" scale: slide must fill frame (no letterbox bars)
                const coverScale = Math.max(frameWidth, frameHeight) / SLIDE_SIZE
                const scaledSize = SLIDE_SIZE * coverScale
                return (
                  <div
                    key={s.id}
                    className="shrink-0 flex flex-col items-center"
                    style={{ width: frameWidth }}
                    data-testid={`slide-column-${i}`}
                  >
                    <div
                      ref={(el) => { slideRefs.current[i] = el as any }}
                      onClick={() => { activeChangeSrcRef.current = 'nav'; setActiveIdx(i) }}
                      data-testid={`thumb-${i}`}
                      className="relative"
                      style={{
                        width: frameWidth,
                        aspectRatio: FORMATS[format].aspect,
                        cursor: isActive ? 'default' : 'pointer',
                        overflow: 'hidden',
                        padding: 0,
                        background: '#FFFFFF',
                        border: 'none',
                        outline: 'none',
                        boxShadow: isActive ? '0 20px 50px rgba(0,0,0,0.12)' : 'none',
                        opacity: isActive ? 1 : 0.6,
                        transform: 'translateZ(0) scale(1)',
                        transition: 'opacity 0.3s ease, box-shadow 0.3s ease',
                        willChange: 'transform, opacity',
                      }}
                      title={s.title}
                    >
                      <div
                        style={{
                          position: 'absolute',
                          top: `${(frameHeight - scaledSize) / 2}px`,
                          left: `${(frameWidth - scaledSize) / 2}px`,
                          width: SLIDE_SIZE,
                          height: SLIDE_SIZE,
                          transform: `scale(${coverScale})`,
                          transformOrigin: 'top left',
                        }}
                      >
                        <SlidePreview
                          slide={s}
                          palette={palette}
                          fontPair={fontPair}
                          bgEffect={bgEffect}
                          showCounter={showCounter}
                          idx={i}
                          total={slides.length}
                          brandLogo={brandLogo}
                          brandHandle={brandHandle}
                          brandName={brandName}
                          brandRole={brandRole}
                          onEditTitle={isActive ? (v: string) => updateActive({ title: v }) : undefined}
                          onEditBody={isActive ? (v: string) => updateActive({ paragraph: v }) : undefined}
                          onEditTagline={isActive ? (v: string) => updateActive({ tagline: v }) : undefined}
                          onEditCta={isActive ? (v: string) => updateActive({ cta: v }) : undefined}
                          interactive={isActive}
                          selectMode={false}
                          selectedEl={isActive ? selectedEl : null}
                          onElementSelect={isActive ? setSelectedEl : undefined}
                          onAvatarDrag={isActive && !s.avatarLocked ? (dx: number, dy: number) => updateActive({ avatarPos: { dx, dy } }) : undefined}
                          onSwipeDrag={isActive && !s.swipeLocked ? (dx: number, dy: number) => updateActive({ swipePos: { dx, dy } }) : undefined}
                          dragScale={coverScale}
                          onAvatarSelect={isActive && !s.avatarLocked ? () => setNudgeTarget('avatar') : undefined}
                          onSwipeSelect={isActive && !s.swipeLocked ? () => setNudgeTarget('swipe') : undefined}
                          nudgeTarget={isActive ? nudgeTarget : null}
                        />
                      </div>
                      {isActive && (
                        <div className="absolute top-3 left-3 z-10 px-2 py-1 rounded-md text-[10px] font-bold tabular-nums" style={{ background: '#6B4EFF', color: '#FFFFFF' }}>
                          {i + 1} / {slides.length}
                        </div>
                      )}
                      {s.strength && (
                        <div className="absolute top-3 right-3 w-2.5 h-2.5 rounded-full" style={{ background: strengthColor(s.strength.strength) }} />
                      )}
                    </div>
                    {isActive && editorNode}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Nav arrows (aligned to active slide's vertical center) */}
          {(() => {
            const [arW, arH] = FORMATS[format].aspect.split('/').map(v => parseFloat(v.trim()))
            const activeFrameHeight = 420 * (arH / arW)
            const arrowTop = 40 + activeFrameHeight / 2
            return (
              <>
                <button
                  onClick={() => { activeChangeSrcRef.current = 'nav'; setActiveIdx(i => Math.max(0, i - 1)) }}
                  disabled={activeIdx === 0}
                  data-testid="preview-arrow-prev"
                  aria-label="Previous slide"
                  className="absolute -translate-y-1/2 left-4 w-11 h-11 rounded-full flex items-center justify-center transition-all hover:scale-105 disabled:opacity-30 disabled:cursor-not-allowed z-20"
                  style={{ top: arrowTop, background: '#FFFFFF', border: '1px solid #E5E7EB', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', color: '#1A1A2E' }}
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={() => { activeChangeSrcRef.current = 'nav'; setActiveIdx(i => Math.min(slides.length - 1, i + 1)) }}
                  disabled={activeIdx === slides.length - 1}
                  data-testid="preview-arrow-next"
                  aria-label="Next slide"
                  className="absolute -translate-y-1/2 right-4 w-11 h-11 rounded-full flex items-center justify-center transition-all hover:scale-105 disabled:opacity-30 disabled:cursor-not-allowed z-20"
                  style={{ top: arrowTop, background: '#FFFFFF', border: '1px solid #E5E7EB', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', color: '#1A1A2E' }}
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )
          })()}

          {/* Loading overlay on active slide */}
          {slideLoadingIdx === activeIdx && (
            <div className="absolute inset-0 bg-black/20 flex items-center justify-center z-20 pointer-events-none">
              <div className="bg-white rounded-xl px-4 py-2 flex items-center gap-2 shadow-lg">
                <Loader2 className="w-4 h-4 animate-spin" style={{ color: '#6B4EFF' }} />
                <span className="text-[12px] font-semibold" style={{ color: '#1A1A2E' }}>AI working...</span>
              </div>
            </div>
          )}
        </div>

        {/* Hidden full-size ref for export */}
        <div style={{ position: 'absolute', left: -99999, top: -99999, pointerEvents: 'none' }} aria-hidden="true">
          <SlidePreview
            ref={slideRef}
            slide={activeSlide}
            palette={palette}
            fontPair={fontPair}
            bgEffect={bgEffect}
            showCounter={showCounter}
            idx={activeIdx}
            total={slides.length}
            brandLogo={brandLogo}
            brandHandle={brandHandle}
            brandName={brandName}
            brandRole={brandRole}
            interactive={false}
          />
        </div>

      </div>

      {/* ===== EXPORT MODAL ===== */}
      {showExportModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.45)' }}
          onClick={() => setShowExportModal(false)}
          data-testid="export-modal-backdrop"
        >
          <div
            className="bg-white rounded-2xl shadow-2xl p-6 w-[360px] flex flex-col gap-5"
            onClick={(e: any) => e.stopPropagation()}
            data-testid="export-modal"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-[15px] font-bold" style={{ color: '#1A1A2E' }}>Export Carousel</h2>
              <button onClick={() => setShowExportModal(false)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
            </div>

            {/* Format selector */}
            <div className="space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: '#6B7280' }}>Format</p>
              <div className="grid grid-cols-3 gap-2">
                {([
                  { id: 'png' as const, label: 'PNG', sub: 'Lossless' },
                  { id: 'jpg' as const, label: 'JPG', sub: 'Compressed' },
                  { id: 'zip' as const, label: 'ZIP', sub: 'All as PNG' },
                ] as { id: 'png' | 'jpg' | 'zip'; label: string; sub: string }[]).map(f => (
                  <button
                    key={f.id}
                    onClick={() => setExportFormat(f.id)}
                    className="py-3 rounded-xl border-2 flex flex-col items-center gap-0.5 transition-all"
                    style={{
                      borderColor: exportFormat === f.id ? '#6B4EFF' : '#E5E7EB',
                      background: exportFormat === f.id ? '#F8F6FF' : '#FAFAFA',
                      color: exportFormat === f.id ? '#6B4EFF' : '#374151',
                    }}
                    data-testid={`export-fmt-${f.id}`}
                  >
                    <span className="text-[13px] font-bold">{f.label}</span>
                    <span className="text-[10px]" style={{ color: '#9CA3AF' }}>{f.sub}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Slide range selector */}
            <div className="space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: '#6B7280' }}>Slide Range</p>
              <div className="flex items-center gap-3">
                <div className="flex flex-col gap-1 flex-1">
                  <label className="text-[10px] text-gray-500">From</label>
                  <input
                    type="number"
                    min={1}
                    max={slides.length}
                    value={exportFrom}
                    onChange={(e: any) => setExportFrom(Math.max(1, Math.min(slides.length, Number(e.target.value))))}
                    className="w-full px-3 py-2 rounded-lg border text-[13px] font-semibold text-center"
                    style={{ borderColor: '#E5E7EB', color: '#1A1A2E' }}
                    data-testid="export-from"
                  />
                </div>
                <span className="text-gray-400 mt-4">–</span>
                <div className="flex flex-col gap-1 flex-1">
                  <label className="text-[10px] text-gray-500">To</label>
                  <input
                    type="number"
                    min={1}
                    max={slides.length}
                    value={exportTo}
                    onChange={(e: any) => setExportTo(Math.max(1, Math.min(slides.length, Number(e.target.value))))}
                    className="w-full px-3 py-2 rounded-lg border text-[13px] font-semibold text-center"
                    style={{ borderColor: '#E5E7EB', color: '#1A1A2E' }}
                    data-testid="export-to"
                  />
                </div>
              </div>
              <p className="text-[10px]" style={{ color: '#9CA3AF' }}>
                {exportTo - exportFrom + 1 > 0 ? `${exportTo - exportFrom + 1} slide(s) — of ${slides.length} total` : 'Invalid range'}
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setShowExportModal(false)}
                className="flex-1 py-2.5 rounded-xl border text-[13px] font-semibold hover:bg-gray-50 transition-colors"
                style={{ borderColor: '#E5E7EB', color: '#6B7280' }}
              >
                Cancel
              </button>
              <button
                onClick={handleExport}
                disabled={exportTo < exportFrom}
                className="flex-1 py-2.5 rounded-xl text-[13px] font-bold text-white disabled:opacity-40 flex items-center justify-center gap-1.5 transition-all"
                style={{ background: 'var(--brand-gradient)' }}
                data-testid="export-confirm-btn"
              >
                <FileImage className="w-3.5 h-3.5" /> Export {exportFormat.toUpperCase()}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

// ============ IMAGE PICKER SUB-PANEL (reusable) ============
function ImagePickerSubPanel({ slide, imageSubTab, setImageSubTab, imgSearchQuery, setImgSearchQuery, aiImgPrompt, setAiImgPrompt, filteredStock, applyImage, fileInputRef, handleUpload, imgGenLoading, handleAIImageGen, updateActive, topic, toast }: any) {
  const suggestTerms = () => {
    const words = (topic || slide?.title || '').split(/\s+/).filter((w: string) => w.length > 3).slice(0, 2).join(' ')
    setImgSearchQuery(words || 'abstract')
  }
  return (
    <div className="rounded-xl border p-4 space-y-3" style={{ borderColor: '#E5E7EB' }} data-testid="image-picker">
      <label className="text-[12px] font-bold uppercase tracking-wider block" style={{ color: '#1A1A2E' }}>Image</label>
      <div className="flex gap-1 p-1 rounded-lg" style={{ background: '#F3F4F6' }}>
        {([
          { id: 'search' as const, label: 'Search Image', icon: Search },
          { id: 'generate' as const, label: 'Generate with AI', icon: Wand2 },
          { id: 'upload' as const, label: 'Upload Image', icon: Upload },
        ]).map(t => (
          <button key={t.id} onClick={() => setImageSubTab(t.id)} data-testid={`img-tab-${t.id}`}
            className="flex-1 flex items-center justify-center gap-1 py-1.5 px-2 rounded-md text-[10.5px] font-semibold transition-all"
            style={{
              background: imageSubTab === t.id ? '#FFFFFF' : 'transparent',
              color: imageSubTab === t.id ? '#6B4EFF' : '#6B7280',
              boxShadow: imageSubTab === t.id ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
            }}>
            <t.icon className="w-3 h-3" />{t.label}
          </button>
        ))}
      </div>

      {imageSubTab === 'search' && (
        <div className="space-y-2">
          <button onClick={suggestTerms} data-testid="suggest-terms-btn"
            className="w-full px-3 py-1.5 rounded-lg border text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-all"
            style={{ borderColor: '#D9D0FF', background: '#F8F6FF', color: '#6B4EFF' }}>
            <Sparkles className="w-3 h-3" /> Suggest Search Terms
          </button>
          <input value={imgSearchQuery} onChange={(e: any) => setImgSearchQuery(e.target.value)} data-testid="img-search-input"
            placeholder="Search keyword..." className="w-full px-3 py-2 rounded-md border text-[12px]" style={{ borderColor: '#E5E7EB' }} />
          <button data-testid="search-image-btn" onClick={() => { /* client-side filter already drives it */ }}
            className="w-full px-3 py-2 rounded-lg text-[11px] font-bold text-white"
            style={{ background: '#6B4EFF' }}>
            Search Image
          </button>
          <div className="grid grid-cols-3 gap-1.5 max-h-[180px] overflow-y-auto">
            {filteredStock.map((img: any, i: number) => (
              <button key={i} onClick={() => applyImage(img.url)} data-testid={`stock-${i}`}
                className="relative group rounded-md overflow-hidden border hover:border-[#6B4EFF] transition-all"
                style={{ borderColor: '#E5E7EB' }}>
                <img src={img.url} alt={img.tag} className="w-full h-14 object-cover" />
              </button>
            ))}
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#888888' }}>Orientation</label>
            <div className="grid grid-cols-2 gap-1">
              {([
                { id: 'horizontal', label: 'Horizontal' },
                { id: 'vertical', label: 'Vertical' },
              ]).map((o: any) => (
                <button key={o.id} onClick={() => updateActive({ imageOrientation: o.id })} data-testid={`orient-${o.id}`}
                  className="px-2 py-1.5 rounded-md border text-[10px] font-semibold transition-all"
                  style={{
                    borderColor: (slide.imageOrientation || 'horizontal') === o.id ? '#6B4EFF' : '#E5E7EB',
                    background: (slide.imageOrientation || 'horizontal') === o.id ? '#EEEBFF' : '#FFFFFF',
                    color: (slide.imageOrientation || 'horizontal') === o.id ? '#6B4EFF' : '#6B7280',
                  }}>
                  {o.label}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#888888' }}>Scale</label>
            <div className="flex items-center gap-1.5">
              {([
                { id: 'fit', label: 'Fit' },
                { id: 'fill', label: 'Fill' },
                { id: 'zoom-in', label: 'Zoom In' },
                { id: 'zoom-out', label: 'Zoom Out' },
                { id: 'expand', label: 'Expand' },
              ]).map((s: any) => (
                <button key={s.id} onClick={() => updateActive({ imageScaleMode: s.id })} data-testid={`scale-${s.id}`}
                  className="flex-1 px-1.5 py-1.5 rounded-md border text-[9px] font-semibold transition-all"
                  style={{
                    borderColor: (slide.imageScaleMode || 'fit') === s.id ? '#6B4EFF' : '#E5E7EB',
                    background: (slide.imageScaleMode || 'fit') === s.id ? '#EEEBFF' : '#FFFFFF',
                    color: (slide.imageScaleMode || 'fit') === s.id ? '#6B4EFF' : '#6B7280',
                  }}>
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {imageSubTab === 'generate' && (
        <div className="space-y-2">
          <textarea value={aiImgPrompt} onChange={(e: any) => setAiImgPrompt(e.target.value)} data-testid="ai-prompt"
            placeholder="e.g. Abstract gradient, soft teal/sage..."
            className="w-full px-3 py-2 rounded-md border text-[12px] resize-none" rows={3} maxLength={500}
            style={{ borderColor: '#E5E7EB' }} />
          <button onClick={handleAIImageGen} disabled={imgGenLoading || !aiImgPrompt.trim()} data-testid="gen-img-btn"
            className="w-full px-3 py-2 rounded-lg text-[11px] font-bold text-white flex items-center justify-center gap-1.5 disabled:opacity-50"
            style={{ background: '#6B4EFF' }}>
            {imgGenLoading ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Generating (~30s)...</> : <><Wand2 className="w-3.5 h-3.5" /> Generate</>}
          </button>
        </div>
      )}

      {imageSubTab === 'upload' && (
        <>
          <input type="file" ref={fileInputRef} onChange={handleUpload} accept="image/*" className="hidden" data-testid="file-input" />
          <button onClick={() => fileInputRef.current?.click()} data-testid="upload-btn"
            className="w-full py-6 rounded-xl border-2 border-dashed flex flex-col items-center gap-2 hover:border-[#6B4EFF] hover:bg-[#F8F6FF] transition-all"
            style={{ borderColor: '#E5E7EB' }}>
            <Upload className="w-5 h-5" style={{ color: '#888888' }} />
            <span className="text-[11px] font-semibold" style={{ color: '#6B7280' }}>Click to upload</span>
          </button>
        </>
      )}
    </div>
  )
}


// ============ HELPER: Render title with **accent word** markup ============
function renderTitleWithAccent(text: string, accentColor: string): React.ReactNode {
  if (!text) return null
  // Match **word** pattern, replace with highlighted span
  const parts = text.split(/(\*\*[^*]+\*\*)/g)
  return parts.map((p, i) => {
    const m = p.match(/^\*\*([^*]+)\*\*$/)
    if (m) return <span key={i} style={{ color: accentColor }}>{m[1]}</span>
    return <span key={i}>{p}</span>
  })
}

// ============ SLIDE PREVIEW COMPONENT (1080x1080 base, three templates: intro/content/outro) ============
const SlidePreview = forwardRef<HTMLDivElement, any>(({ slide, palette, fontPair, bgEffect, showCounter, idx, total, brandLogo, brandHandle, brandName, brandRole, onEditTitle, onEditBody, onEditTagline, onEditCta, interactive = true, selectMode = false, selectedEl = null, onElementSelect, onAvatarDrag, onSwipeDrag, dragScale = 1, onAvatarSelect, onSwipeSelect, nudgeTarget }, ref) => {
  const makeDragStart = (getPos: () => { dx: number; dy: number }, onDrag: (dx: number, dy: number) => void, onSelect?: () => void) => (e: any) => {
    if (!interactive || !onDrag) return
    e.stopPropagation()
    e.preventDefault()
    onSelect?.();
    const startX = e.clientX
    const startY = e.clientY
    const startPos = getPos()
    const onMove = (me: MouseEvent) => {
      const ndx = startPos.dx + (me.clientX - startX) / dragScale
      const ndy = startPos.dy + (me.clientY - startY) / dragScale
      onDrag(ndx, ndy)
    }
    const onUp = () => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
    }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }
  if (!slide) return <div ref={ref}>No slide</div>

  // Role detection
  const role: 'intro' | 'content' | 'outro' = idx === 0 ? 'intro' : idx === total - 1 ? 'outro' : 'content'
  const ft = slide.fieldToggles || {}
  const isEditorial = palette.id === 'editorial'

  // Background resolution
  const bgColor: string = (() => {
    if (slide.bgOverride?.color) return slide.bgOverride.color
    if (isEditorial) {
      // Two-tone editorial: cream for intro/outro, sage for content
      return role === 'content' ? '#7AB5A0' : '#F5F0E8'
    }
    if (bgEffect === 'gradient') return palette.bg
    if (bgEffect === 'solid') {
      const firstColor = String(palette.bg).includes('linear-gradient')
        ? String(palette.bg).split(',')[1]?.trim().split(' ')[0] || palette.subtle
        : palette.bg
      return firstColor
    }
    return palette.bg
  })()

  // Text colors
  const isDarkBg = role === 'content' ? true : false // sage content = white text; cream intro/outro = dark
  const titleColor = slide.titleStyle?.color || (isEditorial ? (role === 'content' ? '#FFFFFF' : '#1A1A2E') : palette.text)
  const bodyColor = slide.bodyStyle?.color || (isEditorial ? (role === 'content' ? 'rgba(255,255,255,0.88)' : '#4A4A6A') : palette.text)
  const taglineColor = slide.taglineStyle?.color || (isEditorial ? (role === 'content' ? 'rgba(255,255,255,0.75)' : '#888888') : palette.text)
  const accentColor = isEditorial ? (role === 'content' ? '#FFD27A' : '#7AB5A0') : palette.accent

  // Texture overlay
  const textureBg = (() => {
    const t = slide.bgOverride?.texture
    if (t && t !== 'none') {
      if (t === 'dots') return { bg: 'radial-gradient(rgba(0,0,0,0.12) 1.5px, transparent 1.5px)', size: '20px 20px' }
      if (t === 'grid') return { bg: 'linear-gradient(rgba(0,0,0,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.06) 1px, transparent 1px)', size: '32px 32px' }
      if (t === 'lines') return { bg: 'repeating-linear-gradient(45deg, rgba(0,0,0,0.05) 0 2px, transparent 2px 14px)', size: undefined }
    }
    // Default editorial textures: linen for cream, grid for sage
    if (isEditorial && role !== 'content') {
      return { bg: 'linear-gradient(90deg, rgba(0,0,0,0.025) 1px, transparent 1px), linear-gradient(rgba(0,0,0,0.025) 1px, transparent 1px)', size: '16px 16px' }
    }
    if (isEditorial && role === 'content') {
      return { bg: 'linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)', size: '40px 40px' }
    }
    return null
  })()

  // Image handling
  const imagePos = slide.image?.pos || 'right'
  const showImage = slide.image && (slide.layout === 'text-image' || slide.layout === 'image')
  const imageScale = slide.image?.scale || 1
  const orientation = slide.imageOrientation || 'horizontal'

  // Determine visual type for this slide
  const introType: 'standard' | 'emoji' | 'headshot' | 'image' = (() => {
    const s = slide.introStyle
    if (s === 'full-image') return 'image'
    if (s === 'emoji') return 'emoji'
    if (s === 'headshot') return 'headshot'
    return 'standard'
  })()
  const outroType: 'standard' | 'headshot' | 'image' = slide.outroStyle || 'standard'

  // Edit handlers (inline contentEditable OR hover-to-select)
  const editableProps = (cb?: (v: string) => void, testId?: string, elType?: 'title' | 'body' | 'tagline' | 'cta') => {
    if (interactive) {
      const isSel = elType && selectedEl === elType
      return {
        contentEditable: true,
        suppressContentEditableWarning: true,
        onBlur: (e: any) => cb?.(e.currentTarget.textContent || ''),
        onMouseEnter: (elType && onElementSelect) ? (e: any) => { e.stopPropagation(); onElementSelect(elType) } : undefined,
        'data-testid': testId,
        style: {
          outline: isSel ? '2px solid #7c3aed' : 'none',
          outlineOffset: 2,
          borderRadius: 4,
          cursor: 'text',
          transition: 'outline 0.12s ease',
          wordWrap: 'break-word' as const,
          overflowWrap: 'break-word' as const,
        },
      }
    }
    if (selectMode && elType && onElementSelect) {
      const isSel = selectedEl === elType
      return {
        'data-testid': testId,
        onMouseEnter: (e: any) => { e.stopPropagation(); onElementSelect(elType) },
        style: {
          cursor: 'pointer',
          outline: isSel ? '2px solid #7c3aed' : '2px dashed transparent',
          outlineOffset: 2,
          borderRadius: 4,
          transition: 'outline 0.12s ease',
          pointerEvents: 'auto' as const,
        },
      }
    }
    return { 'data-testid': testId, style: { pointerEvents: 'none' as const } }
  }

  const avatarInitial = (brandName || brandHandle?.replace('@', '') || 'Y').charAt(0).toUpperCase()

  return (
    <div
      ref={ref}
      data-testid="slide-preview"
      data-role={role}
      className="relative overflow-hidden"
      style={{
        width: 1080, height: 1080,
        background: bgColor,
        color: titleColor,
        fontFamily: fontPair.body,
        borderRadius: 24,
      }}
    >
      {/* Texture overlay */}
      {textureBg && (
        <div className="absolute inset-0 pointer-events-none"
          style={{ backgroundImage: textureBg.bg, backgroundSize: textureBg.size, opacity: 1 }} />
      )}

      {/* Grain */}
      {bgEffect === 'grain' && (
        <div className="absolute inset-0 opacity-[0.08] pointer-events-none mix-blend-overlay"
          style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%270 0 200 200%27 xmlns=%27http://www.w3.org/2000/svg%27%3E%3Cfilter id=%27n%27%3E%3CfeTurbulence type=%27fractalNoise%27 baseFrequency=%270.9%27/%3E%3C/filter%3E%3Crect width=%27200%27 height=%27200%27 filter=%27url(%23n)%27/%3E%3C/svg%3E")' }} />
      )}

      {/* Full-bleed image background for intro-image / outro-image / content-image */}
      {((role === 'intro' && introType === 'image') || (role === 'outro' && outroType === 'image') || (role === 'content' && slide.layout === 'image')) && slide.image && (
        <>
          <img src={slide.image.url} alt="" className="absolute inset-0 w-full h-full object-cover"
            style={{ transform: `scale(${imageScale})` }} />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.65) 100%)' }} />
        </>
      )}

      {/* Background image toggle (non-full-bleed) */}
      {slide.backgroundImage && ft.bgImage && (
        <>
          <img src={slide.backgroundImage} alt="" className="absolute inset-0 w-full h-full object-cover opacity-30" />
        </>
      )}

      {/* Counter badge — content only */}
      {role === 'content' && !slide.hideCounter && (
        <div className="absolute z-20" style={{ top: 48, left: '50%', transform: 'translateX(-50%)' }} data-testid="counter-badge">
          <div style={{
            width: 72, height: 72, borderRadius: 999,
            background: '#1A1A2E', color: '#FFFFFF',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 32, fontWeight: 800, fontFamily: fontPair.heading,
          }}>
            {idx + 1}
          </div>
        </div>
      )}

      {/* ============ INTRO TEMPLATE ============ */}
      {role === 'intro' && (
        <div className="relative w-full h-full flex flex-col items-center justify-center" style={{ padding: 96, zIndex: 10 }}>
          {/* Intro visual: emoji / headshot / image (image handled as full-bleed above) */}
          {introType === 'emoji' && slide.emoji && (
            <div style={{ fontSize: 160, lineHeight: 1, marginBottom: 40 }} data-testid="slide-emoji">{slide.emoji}</div>
          )}
          {introType === 'headshot' && (
            <div className="rounded-full overflow-hidden mb-8 flex items-center justify-center"
              style={{ width: 180, height: 180, background: accentColor, color: '#1A1A2E', fontSize: 72, fontWeight: 800 }}>
              {slide.headshot ? <img src={slide.headshot} alt="headshot" className="w-full h-full object-cover" /> : avatarInitial}
            </div>
          )}

          {/* Tagline */}
          {ft.tagline && slide.tagline && (
            <p {...editableProps(onEditTagline, 'slide-editable-tagline', 'tagline')}
              style={{
                fontSize: slide.taglineStyle?.fontSize ?? 24,
                fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase',
                color: taglineColor, textAlign: 'center', marginBottom: 32,
                cursor: interactive ? 'text' : 'default',
              }}>
              {slide.tagline}
            </p>
          )}

          {/* Title with accent word */}
          {ft.title !== false && slide.title && (
            <h1 {...editableProps(onEditTitle, 'slide-editable-title', 'title')}
              style={{
                fontFamily: fontPair.heading,
                fontSize: slide.titleStyle?.fontSize ?? 96,
                fontWeight: slide.titleStyle?.fontWeight ?? 800,
                lineHeight: 1.05, letterSpacing: '-0.02em',
                color: titleColor,
                textAlign: slide.titleStyle?.align || 'center',
                maxWidth: 900, marginBottom: 40,
                cursor: interactive ? 'text' : 'default',
              }}>
              {interactive ? slide.title : renderTitleWithAccent(slide.title, accentColor)}
            </h1>
          )}

          {/* Paragraph */}
          {ft.body && slide.body && (
            <p {...editableProps(onEditBody, 'slide-editable-body', 'body')}
              style={{
                fontSize: slide.bodyStyle?.fontSize ?? 32,
                lineHeight: slide.bodyStyle?.lineHeight ?? 1.5,
                color: bodyColor, textAlign: 'center',
                maxWidth: 800,
                cursor: interactive ? 'text' : 'default',
              }}>
              {slide.body}
            </p>
          )}

          {/* Brand footer — bottom left avatar + name + role */}
          <div
            className="absolute flex items-center gap-4 z-20"
            style={{
              bottom: 56, left: 72,
              transform: `translate(${slide.avatarPos?.dx || 0}px, ${slide.avatarPos?.dy || 0}px)`,
              cursor: interactive ? (slide.avatarLocked ? 'not-allowed' : onAvatarDrag ? (nudgeTarget === 'avatar' ? 'grabbing' : 'grab') : 'default') : 'default',
              userSelect: 'none',
              outline: interactive ? (slide.avatarLocked ? '2px dashed rgba(150,150,150,0.5)' : onAvatarDrag ? (nudgeTarget === 'avatar' ? '2px solid #6B4EFF' : '2px dashed rgba(108,75,255,0.4)') : 'none') : 'none',
              outlineOffset: 8, borderRadius: 8,
            }}
            onMouseDown={onAvatarDrag ? makeDragStart(() => slide.avatarPos || { dx: 0, dy: 0 }, (dx, dy) => onAvatarDrag(dx, dy), onAvatarSelect) : undefined}
          >
            {brandLogo ? (
              <img src={brandLogo} alt="logo" style={{ width: 56, height: 56, borderRadius: 999, objectFit: 'cover' }} />
            ) : (
              <div style={{ width: 56, height: 56, borderRadius: 999, background: accentColor, color: '#1A1A2E', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 800 }}>
                {avatarInitial}
              </div>
            )}
            <div style={{ lineHeight: 1.2 }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: isEditorial ? '#1A1A2E' : titleColor }}>{brandName || brandHandle || 'Your Name'}</div>
              <div style={{ fontSize: 16, color: '#888888' }}>{brandRole || 'Your Role'}</div>
            </div>
            {interactive && slide.avatarLocked && (
              <div style={{ position: 'absolute', top: -22, left: 0, display: 'flex', alignItems: 'center', gap: 3, fontSize: 11, fontWeight: 700, color: '#6B7280', background: 'rgba(255,255,255,0.92)', padding: '2px 6px', borderRadius: 4, pointerEvents: 'none' }}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                Locked
              </div>
            )}
            {nudgeTarget === 'avatar' && interactive && !slide.avatarLocked && (
              <div style={{ position: 'absolute', top: -28, left: 0, fontSize: 11, fontWeight: 700, color: '#6B4EFF', background: 'rgba(255,255,255,0.92)', padding: '2px 6px', borderRadius: 4, whiteSpace: 'nowrap', pointerEvents: 'none' }}>
                ← ↑ → ↓ Arrow keys to nudge · Shift+arrow = 10px
              </div>
            )}
          </div>

          {/* Swipe pill — bottom right */}
          {ft.swipe !== false && slide.swipeText && (
            <div
              className="absolute z-20"
              style={{
                bottom: 56, right: 72,
                transform: `translate(${slide.swipePos?.dx || 0}px, ${slide.swipePos?.dy || 0}px)`,
                cursor: interactive ? (slide.swipeLocked ? 'not-allowed' : onSwipeDrag ? (nudgeTarget === 'swipe' ? 'grabbing' : 'grab') : 'default') : 'default',
                userSelect: 'none',
                outline: interactive ? (slide.swipeLocked ? '2px dashed rgba(150,150,150,0.5)' : onSwipeDrag ? (nudgeTarget === 'swipe' ? '2px solid #6B4EFF' : '2px dashed rgba(108,75,255,0.4)') : 'none') : 'none',
                outlineOffset: 8, borderRadius: 999,
              }}
              onMouseDown={onSwipeDrag ? makeDragStart(() => slide.swipePos || { dx: 0, dy: 0 }, (dx, dy) => onSwipeDrag(dx, dy), onSwipeSelect) : undefined}
            >
              <div style={{
                background: accentColor, color: '#1A1A2E',
                padding: '16px 28px', borderRadius: 999,
                fontSize: 20, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 10,
              }} data-testid="swipe-pill">
                {slide.swipeText} <span style={{ fontSize: 24, fontWeight: 900 }}>›</span>
              </div>
              {interactive && slide.swipeLocked && (
                <div style={{ position: 'absolute', top: -22, right: 0, display: 'flex', alignItems: 'center', gap: 3, fontSize: 11, fontWeight: 700, color: '#6B7280', background: 'rgba(255,255,255,0.92)', padding: '2px 6px', borderRadius: 4, pointerEvents: 'none' }}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                  Locked
                </div>
              )}
              {nudgeTarget === 'swipe' && interactive && !slide.swipeLocked && (
                <div style={{ position: 'absolute', top: -28, right: 0, fontSize: 11, fontWeight: 700, color: '#6B4EFF', background: 'rgba(255,255,255,0.92)', padding: '2px 6px', borderRadius: 4, whiteSpace: 'nowrap', pointerEvents: 'none' }}>
                  ← ↑ → ↓ Arrow keys · Shift = 10px
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ============ CONTENT TEMPLATE ============ */}
      {role === 'content' && (
        <div className="relative w-full h-full flex" style={{ padding: 96, zIndex: 10, paddingTop: 160 }}>
          {/* Text + Image layout */}
          {slide.layout === 'text-image' && slide.image ? (
            <>
              <div className="flex-1 flex flex-col justify-center" style={{ paddingRight: 40 }}>
                {ft.title !== false && slide.title && (
                  <h2 {...editableProps(onEditTitle, 'slide-editable-title', 'title')}
                    style={{
                      fontFamily: fontPair.heading,
                      fontSize: slide.titleStyle?.fontSize ?? 84,
                      fontWeight: slide.titleStyle?.fontWeight ?? 800,
                      lineHeight: 1.1, letterSpacing: '-0.02em',
                      color: titleColor, marginBottom: 32,
                      textAlign: slide.titleStyle?.align || 'left',
                      cursor: interactive ? 'text' : 'default',
                    }}>
                    {interactive ? slide.title : renderTitleWithAccent(slide.title, accentColor)}
                  </h2>
                )}
                {ft.body && slide.body && (
                  <p {...editableProps(onEditBody, 'slide-editable-body', 'body')}
                    style={{
                      fontSize: slide.bodyStyle?.fontSize ?? 30,
                      lineHeight: slide.bodyStyle?.lineHeight ?? 1.5,
                      color: bodyColor,
                      cursor: interactive ? 'text' : 'default',
                    }}>
                    {slide.body}
                  </p>
                )}
              </div>
              <div className="flex items-center justify-center" style={{ width: 420 }}>
                <div className="rounded-3xl overflow-hidden flex items-center justify-center"
                  style={{ width: orientation === 'vertical' ? 380 : 420, height: orientation === 'vertical' ? 520 : 420, background: '#FFFFFF' }}>
                  <img src={slide.image.url} alt="" className="w-full h-full object-cover" style={{ transform: `scale(${imageScale})` }} />
                </div>
              </div>
            </>
          ) : slide.layout === 'image' ? (
            // Full-bleed handled above; still show title/body overlay if provided
            <div className="flex-1 flex flex-col justify-end">
              {ft.title !== false && slide.title && (
                <h2 {...editableProps(onEditTitle, 'slide-editable-title', 'title')}
                  style={{
                    fontFamily: fontPair.heading,
                    fontSize: slide.titleStyle?.fontSize ?? 72,
                    fontWeight: 800, lineHeight: 1.1,
                    color: '#FFFFFF', marginBottom: 16,
                    cursor: interactive ? 'text' : 'default',
                  }}>
                  {interactive ? slide.title : renderTitleWithAccent(slide.title, accentColor)}
                </h2>
              )}
            </div>
          ) : (
            // Text only
            <div className="flex-1 flex flex-col justify-center">
              {ft.title !== false && slide.title && (
                <h2 {...editableProps(onEditTitle, 'slide-editable-title', 'title')}
                  style={{
                    fontFamily: fontPair.heading,
                    fontSize: slide.titleStyle?.fontSize ?? 96,
                    fontWeight: slide.titleStyle?.fontWeight ?? 800,
                    lineHeight: 1.05, letterSpacing: '-0.02em',
                    color: titleColor, marginBottom: 40,
                    textAlign: slide.titleStyle?.align || 'left',
                    cursor: interactive ? 'text' : 'default',
                  }}>
                  {interactive ? slide.title : renderTitleWithAccent(slide.title, accentColor)}
                </h2>
              )}
              {ft.body && slide.body && (
                <p {...editableProps(onEditBody, 'slide-editable-body', 'body')}
                  style={{
                    fontSize: slide.bodyStyle?.fontSize ?? 36,
                    lineHeight: slide.bodyStyle?.lineHeight ?? 1.5,
                    color: bodyColor, maxWidth: 880,
                    textAlign: slide.bodyStyle?.align || 'left',
                    cursor: interactive ? 'text' : 'default',
                  }}>
                  {slide.body}
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* ============ OUTRO TEMPLATE ============ */}
      {role === 'outro' && (
        <div className="relative w-full h-full flex flex-col items-center justify-center" style={{ padding: 96, zIndex: 10 }}>
          {outroType === 'headshot' && (
            <div className="rounded-full overflow-hidden mb-8 flex items-center justify-center"
              style={{ width: 160, height: 160, background: accentColor, color: '#1A1A2E', fontSize: 64, fontWeight: 800 }}>
              {slide.headshot ? <img src={slide.headshot} alt="headshot" className="w-full h-full object-cover" /> : avatarInitial}
            </div>
          )}

          {ft.tagline && slide.tagline && (
            <p {...editableProps(onEditTagline, 'slide-editable-tagline', 'tagline')}
              style={{
                fontSize: slide.taglineStyle?.fontSize ?? 24,
                fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase',
                color: taglineColor, textAlign: 'center', marginBottom: 32,
                cursor: interactive ? 'text' : 'default',
              }}>
              {slide.tagline}
            </p>
          )}

          {ft.title !== false && slide.title && (
            <h1 {...editableProps(onEditTitle, 'slide-editable-title', 'title')}
              style={{
                fontFamily: fontPair.heading,
                fontSize: slide.titleStyle?.fontSize ?? 96,
                fontWeight: 800, lineHeight: 1.05, letterSpacing: '-0.02em',
                color: titleColor, textAlign: 'center',
                maxWidth: 900, marginBottom: 32,
                cursor: interactive ? 'text' : 'default',
              }}>
              {interactive ? slide.title : renderTitleWithAccent(slide.title, accentColor)}
            </h1>
          )}

          {ft.body && slide.body && (
            <p {...editableProps(onEditBody, 'slide-editable-body', 'body')}
              style={{
                fontSize: slide.bodyStyle?.fontSize ?? 30,
                lineHeight: slide.bodyStyle?.lineHeight ?? 1.5,
                color: bodyColor, textAlign: 'center',
                maxWidth: 780, marginBottom: 48,
                cursor: interactive ? 'text' : 'default',
              }}>
              {slide.body}
            </p>
          )}

          {/* CTA pill */}
          {ft.cta !== false && slide.ctaText && (
            <div {...editableProps(onEditCta, 'slide-editable-cta', 'cta')}
              style={{
                background: slide.ctaStyle?.bg || '#1A1A2E',
                color: slide.ctaStyle?.textColor || '#FFFFFF',
                padding: '20px 40px', borderRadius: slide.ctaStyle?.shape === 'square' ? 12 : 999,
                fontSize: 24, fontWeight: 700,
                cursor: interactive ? 'text' : 'default',
              }} data-testid="outro-cta-pill">
              {slide.ctaText}
            </div>
          )}

          {/* Brand footer — bottom left */}
          <div
            className="absolute flex items-center gap-4 z-20"
            style={{
              bottom: 56, left: 72,
              transform: `translate(${slide.avatarPos?.dx || 0}px, ${slide.avatarPos?.dy || 0}px)`,
              cursor: interactive ? (slide.avatarLocked ? 'not-allowed' : onAvatarDrag ? (nudgeTarget === 'avatar' ? 'grabbing' : 'grab') : 'default') : 'default',
              userSelect: 'none',
              outline: interactive ? (slide.avatarLocked ? '2px dashed rgba(150,150,150,0.5)' : onAvatarDrag ? (nudgeTarget === 'avatar' ? '2px solid #6B4EFF' : '2px dashed rgba(108,75,255,0.4)') : 'none') : 'none',
              outlineOffset: 8, borderRadius: 8,
            }}
            onMouseDown={onAvatarDrag ? makeDragStart(() => slide.avatarPos || { dx: 0, dy: 0 }, (dx, dy) => onAvatarDrag(dx, dy), onAvatarSelect) : undefined}
          >
            {brandLogo ? (
              <img src={brandLogo} alt="logo" style={{ width: 56, height: 56, borderRadius: 999, objectFit: 'cover' }} />
            ) : (
              <div style={{ width: 56, height: 56, borderRadius: 999, background: accentColor, color: '#1A1A2E', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 800 }}>
                {avatarInitial}
              </div>
            )}
            <div style={{ lineHeight: 1.2 }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#1A1A2E' }}>{brandName || brandHandle || 'Your Name'}</div>
              <div style={{ fontSize: 16, color: '#888888' }}>{brandRole || 'Your Role'}</div>
            </div>
            {interactive && slide.avatarLocked && (
              <div style={{ position: 'absolute', top: -22, left: 0, display: 'flex', alignItems: 'center', gap: 3, fontSize: 11, fontWeight: 700, color: '#6B7280', background: 'rgba(255,255,255,0.92)', padding: '2px 6px', borderRadius: 4, pointerEvents: 'none' }}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                Locked
              </div>
            )}
            {nudgeTarget === 'avatar' && interactive && !slide.avatarLocked && (
              <div style={{ position: 'absolute', top: -28, left: 0, fontSize: 11, fontWeight: 700, color: '#6B4EFF', background: 'rgba(255,255,255,0.92)', padding: '2px 6px', borderRadius: 4, whiteSpace: 'nowrap', pointerEvents: 'none' }}>
                ← ↑ → ↓ Arrow keys to nudge · Shift+arrow = 10px
              </div>
            )}
          </div>

          {/* Icons row — bottom right */}
          {ft.icons && (
            <div className="absolute flex items-center gap-6 z-20" style={{ bottom: 64, right: 72 }} data-testid="social-icons">
              {/* comment */}
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#1A1A2E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
              {/* like */}
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#1A1A2E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
              {/* save */}
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#1A1A2E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>
            </div>
          )}
        </div>
      )}
    </div>
  )
})
SlidePreview.displayName = 'SlidePreview'
