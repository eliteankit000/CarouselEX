'use client'

import { createContext, useContext, useState, useCallback, useMemo, ReactNode } from 'react'
import { X, CheckCircle, AlertCircle } from 'lucide-react'

interface Toast {
  id: string
  message: string
  type: 'success' | 'error' | 'info'
}

interface ToastContextType {
  toast: (message: string, type?: 'success' | 'error' | 'info') => void
}

const ToastContext = createContext<ToastContextType>({ toast: () => {} })

export function useToast() {
  return useContext(ToastContext)
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const toast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Date.now().toString()
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500)
  }, [setToasts])

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [setToasts])

  const contextValue = useMemo(() => ({ toast }), [toast])

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2">
        {toasts.map(t => (
          <div
            key={t.id}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg bg-white animate-in slide-in-from-right-full duration-200 ${
              t.type === 'error' ? 'border-red-200' : t.type === 'success' ? 'border-green-200' : 'border-border'
            }`}
            data-testid="toast-message"
          >
            {t.type === 'success' && <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />}
            {t.type === 'error' && <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />}
            <span className="text-sm text-txt-primary">{t.message}</span>
            <button onClick={() => dismiss(t.id)} className="ml-2 shrink-0">
              <X className="w-3.5 h-3.5 text-txt-muted" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
