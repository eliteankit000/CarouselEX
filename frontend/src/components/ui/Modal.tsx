'use client'

import { X } from 'lucide-react'
import { useEffect, ReactNode } from 'react'

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  maxWidth?: string
}

export default function Modal({ open, onClose, title, children, maxWidth = 'max-w-lg' }: ModalProps) {
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" data-testid="modal-overlay">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative bg-white rounded-2xl shadow-lg w-full mx-4 ${maxWidth}`} style={{ border: '1px solid var(--ink-200)' }}>
        {title && (
          <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid var(--ink-200)' }}>
            <h3 className="text-[16px] font-bold" style={{ color: 'var(--ink-900)', fontFamily: 'var(--font-display)' }}>{title}</h3>
            <button onClick={onClose} className="p-1 rounded-lg hover:bg-[var(--ink-100)] transition-colors" data-testid="modal-close-btn">
              <X className="w-5 h-5" style={{ color: 'var(--ink-400)' }} />
            </button>
          </div>
        )}
        <div className="p-6">{children}</div>
      </div>
    </div>
  )
}
