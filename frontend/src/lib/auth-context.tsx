'use client'

import { createContext, useContext, useState, useEffect, useMemo, useCallback, ReactNode } from 'react'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import type { User } from '@/types'

interface AuthContextType {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error?: string }>
  signUp: (email: string, password: string, fullName: string) => Promise<{ error?: string }>
  signOut: () => Promise<void>
  updateProfile: (data: Partial<User>) => Promise<void>
  isDemo: boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

const DEMO_USER: User = {
  id: 'demo-user-001',
  email: 'demo@carouselex.com',
  full_name: 'Demo User',
  avatar_url: null,
  plan: 'starter',
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    if (typeof window !== 'undefined' && !isSupabaseConfigured) {
      const saved = localStorage.getItem('carouselex_demo_user')
      return saved ? JSON.parse(saved) : null
    }
    return null
  })
  const [loading, setLoading] = useState(true)
  const isDemo = !isSupabaseConfigured

  useEffect(() => {
    if (isDemo) {
      setLoading(false)
      return
    }

    const getSession = async () => {
      const { data: { session } } = await supabase!.auth.getSession()
      if (session?.user) {
        const { data } = await supabase!.from('users').select('*').eq('id', session.user.id).single()
        setUser(data || { id: session.user.id, email: session.user.email!, full_name: '', avatar_url: null, plan: 'starter' })
      }
      setLoading(false)
    }

    getSession()

    const { data: { subscription } } = supabase!.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const { data } = await supabase!.from('users').select('*').eq('id', session.user.id).single()
        setUser(data || { id: session.user.id, email: session.user.email!, full_name: '', avatar_url: null, plan: 'starter' })
      } else {
        setUser(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [isDemo, setUser, setLoading])

  const signIn = useCallback(async (email: string, password: string) => {
    if (isDemo) {
      const demoUser = { ...DEMO_USER, email }
      setUser(demoUser)
      localStorage.setItem('carouselex_demo_user', JSON.stringify(demoUser))
      return {}
    }
    const { error } = await supabase!.auth.signInWithPassword({ email, password })
    return error ? { error: error.message } : {}
  }, [isDemo])

  const signUp = useCallback(async (email: string, password: string, fullName: string) => {
    if (isDemo) {
      const demoUser = { ...DEMO_USER, email, full_name: fullName }
      setUser(demoUser)
      localStorage.setItem('carouselex_demo_user', JSON.stringify(demoUser))
      return {}
    }
    const { data, error } = await supabase!.auth.signUp({ email, password, options: { data: { full_name: fullName } } })
    if (error) return { error: error.message }
    if (data.user) {
      await supabase!.from('users').insert({ id: data.user.id, email, full_name: fullName, plan: 'starter' })
    }
    return {}
  }, [isDemo])

  const signOut = useCallback(async () => {
    if (isDemo) {
      setUser(null)
      localStorage.removeItem('carouselex_demo_user')
      return
    }
    await supabase!.auth.signOut()
    setUser(null)
  }, [isDemo])

  const updateProfile = useCallback(async (data: Partial<User>) => {
    setUser(prev => {
      if (!prev) return null
      const updated = { ...prev, ...data }
      if (isDemo) {
        localStorage.setItem('carouselex_demo_user', JSON.stringify(updated))
      } else {
        supabase!.from('users').update(data).eq('id', prev.id)
      }
      return updated
    })
  }, [isDemo])

  const contextValue = useMemo(
    () => ({ user, loading, signIn, signUp, signOut, updateProfile, isDemo }),
    [user, loading, signIn, signUp, signOut, updateProfile, isDemo]
  )

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be inside AuthProvider')
  return ctx
}
