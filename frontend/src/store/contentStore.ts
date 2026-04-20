import { create } from 'zustand'
import type { Hook, Slide, Platform, CarouselDesign } from '@/types'

const DEFAULT_DESIGN: CarouselDesign = {
  fontFamily: 'Plus Jakarta Sans',
  bgStyle: 'gradient-brand',
  accentColor: '#5B3FE8',
  textColor: '#FFFFFF',
  layout: 'centered',
  fontSize: 100,
  spacing: 100,
}

interface ContentStore {
  input: string
  inputType: 'text' | 'video' | 'url'
  videoUrl: string
  hooks: Hook[]
  selectedHook: Hook | null
  slides: Slide[]
  platform: Platform
  loading: boolean
  loadingStep: string
  step: 'input' | 'hooks' | 'editor'
  cta: string
  engagementScore: number
  readabilityScore: number
  design: CarouselDesign

  setInput: (input: string) => void
  setInputType: (type: 'text' | 'video' | 'url') => void
  setVideoUrl: (url: string) => void
  setHooks: (hooks: Hook[]) => void
  setSelectedHook: (hook: Hook | null) => void
  setSlides: (slides: Slide[]) => void
  setPlatform: (platform: Platform) => void
  setLoading: (loading: boolean) => void
  setLoadingStep: (step: string) => void
  setStep: (step: 'input' | 'hooks' | 'editor') => void
  setCta: (cta: string) => void
  setEngagementScore: (score: number) => void
  setReadabilityScore: (score: number) => void
  setDesign: (design: Partial<CarouselDesign>) => void
  updateSlide: (index: number, text: string) => void
  addSlide: (slide: Slide) => void
  removeSlide: (index: number) => void
  reorderSlides: (from: number, to: number) => void
  reset: () => void
}

export const useContentStore = create<ContentStore>((set, get) => ({
  input: '',
  inputType: 'text',
  videoUrl: '',
  hooks: [],
  selectedHook: null,
  slides: [],
  platform: 'linkedin',
  loading: false,
  loadingStep: '',
  step: 'input',
  cta: '',
  engagementScore: 0,
  readabilityScore: 0,
  design: { ...DEFAULT_DESIGN },

  setInput: (input) => set({ input }),
  setInputType: (inputType) => set({ inputType }),
  setVideoUrl: (videoUrl) => set({ videoUrl }),
  setHooks: (hooks) => set({ hooks }),
  setSelectedHook: (hook) => set({ selectedHook: hook }),
  setSlides: (slides) => set({ slides }),
  setPlatform: (platform) => set({ platform }),
  setLoading: (loading) => set({ loading }),
  setLoadingStep: (step) => set({ loadingStep: step }),
  setStep: (step) => set({ step }),
  setCta: (cta) => set({ cta }),
  setEngagementScore: (engagementScore) => set({ engagementScore }),
  setReadabilityScore: (readabilityScore) => set({ readabilityScore }),
  setDesign: (partial) => set({ design: { ...get().design, ...partial } }),
  updateSlide: (index, text) => {
    const slides = [...get().slides]
    if (slides[index]) slides[index] = { ...slides[index], text }
    set({ slides })
  },
  addSlide: (slide) => {
    const slides = [...get().slides]
    const ctaIdx = slides.findIndex(s => s.type === 'cta')
    if (ctaIdx >= 0) {
      slides.splice(ctaIdx, 0, slide)
    } else {
      slides.push(slide)
    }
    set({ slides })
  },
  removeSlide: (index) => set({ slides: get().slides.filter((_, i) => i !== index) }),
  reorderSlides: (from, to) => {
    const slides = [...get().slides]
    const [moved] = slides.splice(from, 1)
    slides.splice(to, 0, moved)
    set({ slides })
  },
  reset: () => set({
    input: '',
    inputType: 'text',
    videoUrl: '',
    hooks: [],
    selectedHook: null,
    slides: [],
    loading: false,
    loadingStep: '',
    step: 'input',
    cta: '',
    engagementScore: 0,
    readabilityScore: 0,
    design: { ...DEFAULT_DESIGN },
  }),
}))
