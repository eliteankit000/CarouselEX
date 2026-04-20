import { create } from 'zustand'
import type { Platform } from '@/types'

export interface PollHook {
  text: string
  type: 'curiosity' | 'pain' | 'contrarian' | 'authority' | 'story'
  score: number
}

export type PollTheme = 'minimal' | 'gradient' | 'dark' | 'bold' | 'neon' | 'pastel'

interface PollContentStore {
  idea: string
  hooks: PollHook[]
  selectedHook: PollHook | null
  question: string
  options: string[]
  cta: string
  caption: string
  theme: PollTheme
  platform: Platform
  loading: boolean
  loadingStep: string
  step: 'input' | 'editor'
  fontFamily: string
  fontSize: number

  setIdea: (idea: string) => void
  setHooks: (hooks: PollHook[]) => void
  setSelectedHook: (hook: PollHook | null) => void
  setQuestion: (question: string) => void
  setOptions: (options: string[]) => void
  updateOption: (index: number, value: string) => void
  addOption: () => void
  removeOption: (index: number) => void
  setCta: (cta: string) => void
  setCaption: (caption: string) => void
  setTheme: (theme: PollTheme) => void
  setPlatform: (platform: Platform) => void
  setLoading: (loading: boolean) => void
  setLoadingStep: (step: string) => void
  setStep: (step: 'input' | 'editor') => void
  setFontFamily: (font: string) => void
  setFontSize: (size: number) => void
  reset: () => void
}

export const usePollContentStore = create<PollContentStore>((set, get) => ({
  idea: '',
  hooks: [],
  selectedHook: null,
  question: '',
  options: [],
  cta: '',
  caption: '',
  theme: 'gradient',
  platform: 'linkedin',
  loading: false,
  loadingStep: '',
  step: 'input',
  fontFamily: 'Plus Jakarta Sans',
  fontSize: 100,

  setIdea: (idea) => set({ idea }),
  setHooks: (hooks) => set({ hooks }),
  setSelectedHook: (hook) => set({ selectedHook: hook }),
  setQuestion: (question) => set({ question }),
  setOptions: (options) => set({ options }),
  updateOption: (index, value) => {
    const options = [...get().options]
    options[index] = value
    set({ options })
  },
  addOption: () => {
    const options = get().options
    if (options.length < 4) set({ options: [...options, ''] })
  },
  removeOption: (index) => {
    const options = get().options
    if (options.length > 2) set({ options: options.filter((_, i) => i !== index) })
  },
  setCta: (cta) => set({ cta }),
  setCaption: (caption) => set({ caption }),
  setTheme: (theme) => set({ theme }),
  setPlatform: (platform) => set({ platform }),
  setLoading: (loading) => set({ loading }),
  setLoadingStep: (step) => set({ loadingStep: step }),
  setStep: (step) => set({ step }),
  setFontFamily: (fontFamily) => set({ fontFamily }),
  setFontSize: (fontSize) => set({ fontSize }),
  reset: () => set({
    idea: '',
    hooks: [],
    selectedHook: null,
    question: '',
    options: [],
    cta: '',
    caption: '',
    loading: false,
    loadingStep: '',
    step: 'input',
  }),
}))
