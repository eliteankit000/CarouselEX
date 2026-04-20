export interface User {
  id: string
  email: string
  full_name: string
  avatar_url: string | null
  plan: 'starter' | 'pro' | 'growth'
}

export type Platform = 'linkedin' | 'instagram' | 'x' | 'tiktok'

export interface Hook {
  text: string
  type: 'curiosity' | 'pain' | 'contrarian' | 'authority' | 'story'
  score: number
}

export interface Slide {
  type: 'hook' | 'problem' | 'value' | 'insight' | 'summary' | 'cta'
  text: string
}

export interface CarouselData {
  hooks: Hook[]
  selectedHook: Hook | null
  slides: Slide[]
  cta: string
  engagementScore: number
  readabilityScore: number
}

export interface PollData {
  question: string
  options: string[]
  hook: string
  caption: string
}

export interface Content {
  id: string
  user_id: string
  type: 'carousel' | 'poll'
  data: CarouselData | PollData
  platform: Platform
  created_at: string
}

export interface HistoryItem {
  id: string
  type: 'carousel' | 'poll'
  platform: Platform
  title: string
  preview: string
  data: any
  created_at: string
  expires_at: string
}

export interface CarouselDesign {
  fontFamily: string
  bgStyle: string
  accentColor: string
  textColor: string
  layout: 'centered' | 'left' | 'minimal'
  fontSize: number
  spacing: number
}
