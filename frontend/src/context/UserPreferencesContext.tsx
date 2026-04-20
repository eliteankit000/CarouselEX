'use client'

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  ReactNode,
} from 'react'
import { useAuth } from '@/lib/auth-context'
import type { UserPreferences } from '@/types/content'

const BACKEND_URL = process.env.NEXT_PUBLIC_APP_URL || ''
const LS_KEY = 'cx_user_prefs_v1'

interface UserPreferencesContextValue {
  platform: string | null
  niche: string | null
  isSetupComplete: boolean
  isLoading: boolean
  /** Save preferences (Supabase-first, localStorage fallback). */
  savePreferences: (prefs: UserPreferences) => Promise<{ ok: boolean; error?: string }>
  refetch: () => Promise<void>
}

const UserPreferencesContext = createContext<UserPreferencesContextValue | null>(null)

function readLocal(userId: string): UserPreferences | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(`${LS_KEY}:${userId}`)
    return raw ? (JSON.parse(raw) as UserPreferences) : null
  } catch {
    return null
  }
}

function writeLocal(userId: string, prefs: UserPreferences) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(`${LS_KEY}:${userId}`, JSON.stringify(prefs))
  } catch {
    /* ignore */
  }
}

export function UserPreferencesProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth()
  const [platform, setPlatform] = useState<string | null>(null)
  const [niche, setNiche] = useState<string | null>(null)
  const [isSetupComplete, setIsSetupComplete] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const uid = user?.id || null

  const applyPrefs = useCallback((p: UserPreferences | null) => {
    if (!p) {
      setPlatform(null)
      setNiche(null)
      setIsSetupComplete(false)
      return
    }
    setPlatform(p.platform || null)
    setNiche(p.niche || null)
    setIsSetupComplete(Boolean(p.isSetupComplete))
  }, [])

  const fetchPrefs = useCallback(async () => {
    if (!uid) {
      applyPrefs(null)
      setIsLoading(false)
      return
    }
    setIsLoading(true)
    // 1) Try localStorage first (fast path & works in demo mode)
    const local = readLocal(uid)
    if (local) {
      applyPrefs(local)
    }
    // 2) Best-effort backend fetch (Supabase-backed)
    try {
      const res = await fetch(`${BACKEND_URL}/api/user-preferences?userId=${encodeURIComponent(uid)}`)
      if (res.ok) {
        const body = await res.json()
        if (body?.data) {
          applyPrefs({
            platform: body.data.platform,
            niche: body.data.niche,
            isSetupComplete: body.data.isSetupComplete,
          })
          writeLocal(uid, {
            platform: body.data.platform,
            niche: body.data.niche,
            isSetupComplete: body.data.isSetupComplete,
          })
        }
      }
    } catch {
      /* ignore network errors, localStorage fallback is active */
    }
    setIsLoading(false)
  }, [uid, applyPrefs])

  useEffect(() => {
    if (authLoading) return
    fetchPrefs()
  }, [authLoading, fetchPrefs])

  const savePreferences = useCallback(
    async (prefs: UserPreferences): Promise<{ ok: boolean; error?: string }> => {
      if (!uid) return { ok: false, error: 'Not signed in' }
      // Always write locally first for instant UX
      writeLocal(uid, prefs)
      applyPrefs(prefs)

      // Best-effort backend save
      try {
        const res = await fetch(`${BACKEND_URL}/api/user-preferences`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: uid,
            platform: prefs.platform,
            niche: prefs.niche,
            is_setup_complete: prefs.isSetupComplete,
          }),
        })
        if (!res.ok) {
          // Backend error — still consider success locally
          return { ok: true }
        }
      } catch {
        /* ignore — localStorage save succeeded */
      }
      return { ok: true }
    },
    [uid, applyPrefs],
  )

  const value = useMemo<UserPreferencesContextValue>(
    () => ({
      platform,
      niche,
      isSetupComplete,
      isLoading,
      savePreferences,
      refetch: fetchPrefs,
    }),
    [platform, niche, isSetupComplete, isLoading, savePreferences, fetchPrefs],
  )

  return (
    <UserPreferencesContext.Provider value={value}>{children}</UserPreferencesContext.Provider>
  )
}

export function useUserPreferences() {
  const ctx = useContext(UserPreferencesContext)
  if (!ctx) throw new Error('useUserPreferences must be used within UserPreferencesProvider')
  return ctx
}
