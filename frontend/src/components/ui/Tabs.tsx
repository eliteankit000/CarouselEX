'use client'

import { cn } from '@/utils'

interface Tab {
  id: string
  label: string
}

interface TabsProps {
  tabs: Tab[]
  active: string
  onChange: (id: string) => void
  className?: string
}

export default function Tabs({ tabs, active, onChange, className }: TabsProps) {
  return (
    <div className={cn('flex gap-1 p-1 bg-section rounded-xl border border-border', className)} data-testid="tabs-container">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          data-testid={`tab-${tab.id}`}
          className={cn(
            'px-4 py-2 text-sm font-medium rounded-lg transition-all duration-150',
            active === tab.id
              ? 'bg-white text-txt-primary shadow-sm'
              : 'text-txt-secondary hover:text-txt-primary'
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}
