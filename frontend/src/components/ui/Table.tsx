'use client'

import { cn } from '@/utils'

interface Column<T> {
  key: string
  header: string
  render?: (item: T) => React.ReactNode
  className?: string
}

interface TableProps<T> {
  columns: Column<T>[]
  data: T[]
  emptyMessage?: string
}

export default function Table<T extends Record<string, any>>({ columns, data, emptyMessage = 'No data found' }: TableProps<T>) {
  if (data.length === 0) {
    return (
      <div className="text-center py-12 text-txt-muted text-sm" data-testid="table-empty">
        {emptyMessage}
      </div>
    )
  }

  return (
    <div className="overflow-x-auto" data-testid="data-table">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border">
            {columns.map((col) => (
              <th key={col.key} className={cn('px-4 py-3 text-left text-xs font-medium text-txt-muted uppercase tracking-wider', col.className)}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {data.map((item, i) => (
            <tr key={i} className="hover:bg-section/50 transition-colors">
              {columns.map((col) => (
                <td key={col.key} className={cn('px-4 py-3 text-sm text-txt-primary', col.className)}>
                  {col.render ? col.render(item) : item[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
