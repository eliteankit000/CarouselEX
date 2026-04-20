'use client'

import { ReactNode } from 'react'

export default function PillBadge({
  children,
  tone = 'neutral',
  'data-testid': testId,
  className = '',
}: {
  children: ReactNode
  tone?: 'brand' | 'blue' | 'green' | 'amber' | 'red' | 'neutral'
  'data-testid'?: string
  className?: string
}) {
  const toneStyles: Record<string, string> = {
    brand: 'bg-[var(--brand-soft)] text-[var(--brand-primary)] border-[rgba(91,63,232,0.15)]',
    blue: 'bg-[rgba(59,130,246,0.1)] text-[var(--blue-500)] border-[rgba(59,130,246,0.18)]',
    green: 'bg-[var(--green-50)] text-[var(--green-500)] border-[rgba(16,185,129,0.18)]',
    amber: 'bg-[rgba(245,158,11,0.1)] text-[#D97706] border-[rgba(245,158,11,0.22)]',
    red: 'bg-[var(--red-50)] text-[var(--red-500)] border-[rgba(239,68,68,0.18)]',
    neutral: 'bg-[var(--ink-100)] text-[var(--ink-600)] border-[var(--ink-200)]',
  }
  return (
    <span
      data-testid={testId}
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${toneStyles[tone]} ${className}`}
    >
      {children}
    </span>
  )
}
