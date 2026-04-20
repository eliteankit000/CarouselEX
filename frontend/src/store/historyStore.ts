import { create } from 'zustand'
import type { HistoryItem, Platform } from '@/types'

const STORAGE_KEY = 'carouselex_content_history'
const EXPIRY_DAYS = 7

function loadHistory(): HistoryItem[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const items: HistoryItem[] = JSON.parse(raw)
    const now = new Date().toISOString()
    const valid = items.filter(item => item.expires_at > now)
    if (valid.length !== items.length) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(valid))
    }
    return valid
  } catch {
    return []
  }
}

function saveHistory(items: HistoryItem[]) {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
}

interface HistoryStore {
  items: HistoryItem[]
  loadItems: () => void
  addItem: (item: Omit<HistoryItem, 'id' | 'created_at' | 'expires_at'>) => string
  removeItem: (id: string) => void
  getItem: (id: string) => HistoryItem | undefined
  clearAll: () => void
}

export const useHistoryStore = create<HistoryStore>((set, get) => ({
  items: [],

  loadItems: () => {
    set({ items: loadHistory() })
  },

  addItem: (item) => {
    const id = `hist_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    const now = new Date()
    const expires = new Date(now.getTime() + EXPIRY_DAYS * 24 * 60 * 60 * 1000)
    const newItem: HistoryItem = {
      ...item,
      id,
      created_at: now.toISOString(),
      expires_at: expires.toISOString(),
    }
    const updated = [newItem, ...get().items].slice(0, 50)
    saveHistory(updated)
    set({ items: updated })
    return id
  },

  removeItem: (id) => {
    const updated = get().items.filter(i => i.id !== id)
    saveHistory(updated)
    set({ items: updated })
  },

  getItem: (id) => {
    return get().items.find(i => i.id === id)
  },

  clearAll: () => {
    saveHistory([])
    set({ items: [] })
  },
}))
