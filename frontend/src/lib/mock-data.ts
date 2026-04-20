import { v4 as uuidv4 } from 'uuid'
import type { User, Content } from '@/types'

const DEMO_USER: User = {
  id: 'demo-user-001',
  email: 'demo@carouselex.com',
  full_name: 'Demo User',
  avatar_url: null,
  plan: 'starter',
}

let mockContent: Content[] = [
  {
    id: uuidv4(),
    user_id: DEMO_USER.id,
    type: 'carousel',
    data: {
      hooks: [
        { text: '5 LinkedIn strategies that 10x my engagement', type: 'curiosity', score: 8 },
        { text: 'Stop posting content nobody reads', type: 'pain', score: 7 },
      ],
      selectedHook: null,
      slides: [
        { type: 'hook', text: '5 LinkedIn strategies that 10x my engagement' },
        { type: 'problem', text: 'Most creators post daily but get zero leads' },
        { type: 'value', text: 'Strategy 1: Lead with a strong hook' },
        { type: 'value', text: 'Strategy 2: Add a micro-result CTA' },
        { type: 'summary', text: 'Content + funnels = predictable leads' },
        { type: 'cta', text: 'Get all 5 strategies free — link in bio' },
      ],
      cta: 'Get the full playbook',
      engagementScore: 8.5,
      readabilityScore: 9.0,
    },
    platform: 'linkedin',
    created_at: new Date(Date.now() - 86400000).toISOString(),
  },
]

export const mockDb = {
  user: {
    get: async (): Promise<User> => DEMO_USER,
    update: async (data: Partial<User>): Promise<User> => {
      Object.assign(DEMO_USER, data)
      return DEMO_USER
    },
  },
  content: {
    list: async (): Promise<Content[]> => mockContent,
    create: async (data: Omit<Content, 'id' | 'created_at'>): Promise<Content> => {
      const item: Content = { ...data, id: uuidv4(), created_at: new Date().toISOString() }
      mockContent.unshift(item)
      return item
    },
    count: async (): Promise<number> => mockContent.length,
  },
}
