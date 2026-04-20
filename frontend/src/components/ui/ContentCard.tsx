'use client'

import { ReactNode, useState } from 'react'
import { Copy, Check } from 'lucide-react'

export default function ContentCard({
  title,
  children,
  copyText,
  icon,
  className = '',
  'data-testid': testId,
}: {
  title: string
  children: ReactNode
  copyText?: string
  icon?: ReactNode
  className?: string
  'data-testid'?: string
}) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    if (!copyText) return
    try {
      await navigator.clipboard.writeText(copyText)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
    } catch {
      /* ignore */
    }
  }

  return (
    <div
      data-testid={testId}
      className={`d-card !p-5 flex flex-col gap-3 ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          {icon && <span className="text-[var(--brand-primary)]">{icon}</span>}
          <h4
            className="text-[13px] font-semibold uppercase tracking-[0.08em]"
            style={{ color: 'var(--ink-400)' }}
          >
            {title}
          </h4>
        </div>
        {copyText && (
          <button
            onClick={handleCopy}
            data-testid={testId ? `${testId}-copy-btn` : undefined}
            className="p-1.5 rounded-lg transition-colors hover:bg-[var(--ink-100)]"
            title={copied ? 'Copied!' : 'Copy'}
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-[var(--green-500)]" />
            ) : (
              <Copy className="w-3.5 h-3.5 text-[var(--ink-400)]" />
            )}
          </button>
        )}
      </div>
      <div className="flex-1">{children}</div>
    </div>
  )
}
