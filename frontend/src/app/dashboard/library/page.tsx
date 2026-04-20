'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { FolderOpen, Search, Pencil, Copy, Sparkles, Trash2, Plus, LayoutGrid, BarChart3, MessageSquare, List, FileText, X } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { useToast } from '@/lib/toast'
import Modal from '@/components/ui/Modal'

const BACKEND_URL = process.env.NEXT_PUBLIC_APP_URL || ''

const FILTER_OPTIONS = [
  { id: 'all', label: 'All' },
  { id: 'carousel', label: 'Carousel' },
  { id: 'poll', label: 'Poll' },
  { id: 'viral-post', label: 'Viral Post' },
  { id: 'thread', label: 'Thread' },
]

interface LibraryItem {
  id: string
  userId: string
  content: string
  hook: string
  contentType: string
  contentStrength: string
  title: string
  createdAt: string
}

function StrengthBadge({ strength }: { strength: string }) {
  const color = strength === 'Strong' ? 'var(--green-500)' : strength === 'Weak' ? 'var(--red-500)' : 'var(--amber-500)'
  const bg = strength === 'Strong' ? 'var(--green-50)' : strength === 'Weak' ? 'var(--red-50)' : 'rgba(245,158,11,0.1)'
  return (
    <span className="text-[10px] font-bold px-2 py-0.5 rounded inline-flex items-center" style={{ color, background: bg }}>
      {strength}
    </span>
  )
}

function TypeBadge({ type }: { type: string }) {
  return (
    <span className="text-[10px] font-bold px-2 py-0.5 rounded uppercase" style={{ background: 'var(--brand-soft)', color: 'var(--brand-primary)' }}>
      {type}
    </span>
  )
}

function timeAgo(dateStr: string): string {
  const now = new Date()
  const date = new Date(dateStr)
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days} day${days > 1 ? 's' : ''} ago`
  const months = Math.floor(days / 30)
  return `${months} month${months > 1 ? 's' : ''} ago`
}

export default function ContentLibraryPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { toast } = useToast()

  const [items, setItems] = useState<LibraryItem[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)

  // Edit modal
  const [editItem, setEditItem] = useState<LibraryItem | null>(null)
  const [editContent, setEditContent] = useState('')
  const [editSaving, setEditSaving] = useState(false)

  // Delete confirmation
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const fetchItems = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        userId: user?.id || 'demo-user-001',
        page: page.toString(),
        limit: '20',
      })
      if (search) params.set('search', search)
      if (filter !== 'all') params.set('contentType', filter)

      const res = await fetch(`${BACKEND_URL}/api/library?${params}`)
      const data = await res.json()
      if (data.success) {
        setItems(data.data || [])
        setTotal(data.total || 0)
      }
    } catch {
      toast('Failed to load library', 'error')
    } finally {
      setLoading(false)
    }
  }, [user, page, search, filter, toast])

  useEffect(() => { fetchItems() }, [fetchItems])

  const handleEdit = (item: LibraryItem) => {
    setEditItem(item)
    setEditContent(item.content)
  }

  const handleEditSave = async () => {
    if (!editItem) return
    setEditSaving(true)
    try {
      const res = await fetch(`${BACKEND_URL}/api/library/${editItem.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: editContent }),
      })
      if (!res.ok) throw new Error('Edit failed')
      setEditItem(null)
      toast('Content updated!')
      fetchItems()
    } catch {
      toast('Edit failed', 'error')
    } finally {
      setEditSaving(false)
    }
  }

  const handleDuplicate = async (id: string) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/library/${id}/duplicate`, { method: 'POST' })
      if (!res.ok) throw new Error('Duplicate failed')
      toast('Content duplicated!')
      fetchItems()
    } catch {
      toast('Duplicate failed', 'error')
    }
  }

  const handleImprove = (item: LibraryItem) => {
    router.push(`/dashboard/rewrite?content=${encodeURIComponent(item.content)}`)
  }

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      const res = await fetch(`${BACKEND_URL}/api/library/${deleteId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Delete failed')
      setDeleteId(null)
      toast('Content deleted!')
      fetchItems()
    } catch {
      toast('Delete failed', 'error')
    }
  }

  return (
    <div className="space-y-6 max-w-[1120px] mx-auto d-page-enter" data-testid="content-library-page">
      <div>
        <h1 className="text-[24px] font-bold" style={{ color: 'var(--ink-900)' }}>Content Library</h1>
        <p className="text-[14px] mt-1" style={{ color: 'var(--ink-400)' }}>Your saved content collection</p>
      </div>

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--ink-400)' }} />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            placeholder="Search your content..."
            className="d-input pl-10"
            data-testid="library-search-input"
          />
        </div>
        <div className="flex gap-2 flex-wrap" data-testid="library-filters">
          {FILTER_OPTIONS.map(f => (
            <button
              key={f.id}
              onClick={() => { setFilter(f.id); setPage(1) }}
              className={`px-3 py-2 rounded-xl text-[12px] font-semibold border transition-all ${
                filter === f.id
                  ? 'border-[var(--brand-primary)] bg-[var(--brand-soft)]'
                  : 'border-[var(--ink-200)] hover:border-[var(--ink-400)]'
              }`}
              style={{ color: filter === f.id ? 'var(--brand-primary)' : 'var(--ink-600)' }}
              data-testid={`filter-${f.id}`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content Grid */}
      {loading ? (
        <div className="grid md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="d-skeleton h-40 rounded-xl" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="d-card text-center py-16" data-testid="library-empty-state">
          <FileText className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--ink-200)' }} />
          <p className="text-[16px] font-semibold mb-1" style={{ color: 'var(--ink-600)' }}>No content yet</p>
          <p className="text-[13px] mb-5" style={{ color: 'var(--ink-400)' }}>Create your first piece of content.</p>
          <button onClick={() => router.push('/dashboard/create')} className="d-btn-primary" data-testid="library-create-btn">
            <Plus className="w-4 h-4" /> Create Content
          </button>
        </div>
      ) : (
        <>
          <div className="grid md:grid-cols-2 gap-4" data-testid="library-grid">
            {items.map(item => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="d-card !p-5 group"
                data-testid={`library-item-${item.id}`}
              >
                <div className="flex items-center gap-2 mb-3">
                  <TypeBadge type={item.contentType} />
                  <StrengthBadge strength={item.contentStrength} />
                  <span className="text-[10px] ml-auto" style={{ color: 'var(--ink-400)' }}>{timeAgo(item.createdAt)}</span>
                </div>
                <p className="text-[13px] leading-relaxed mb-4 line-clamp-3" style={{ color: 'var(--ink-800)' }}>
                  {item.content.substring(0, 120)}{item.content.length > 120 ? '...' : ''}
                </p>
                <div className="flex items-center gap-2">
                  <button onClick={() => handleEdit(item)} className="d-btn-ghost text-[11px] !px-2 !py-1" data-testid={`library-edit-${item.id}`}>
                    <Pencil className="w-3 h-3" /> Edit
                  </button>
                  <button onClick={() => handleDuplicate(item.id)} className="d-btn-ghost text-[11px] !px-2 !py-1" data-testid={`library-duplicate-${item.id}`}>
                    <Copy className="w-3 h-3" /> Duplicate
                  </button>
                  <button onClick={() => handleImprove(item)} className="d-btn-ghost text-[11px] !px-2 !py-1" data-testid={`library-improve-${item.id}`}>
                    <Sparkles className="w-3 h-3" /> Improve
                  </button>
                  <button onClick={() => setDeleteId(item.id)} className="d-btn-ghost text-[11px] !px-2 !py-1 !text-[var(--red-500)] hover:!bg-[var(--red-50)]" data-testid={`library-delete-${item.id}`}>
                    <Trash2 className="w-3 h-3" /> Delete
                  </button>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Pagination */}
          {total > 20 && (
            <div className="flex items-center justify-center gap-2" data-testid="library-pagination">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="d-btn-ghost text-[12px] !px-3 !py-1.5 disabled:opacity-40"
              >
                Previous
              </button>
              <span className="text-[12px] font-medium" style={{ color: 'var(--ink-400)' }}>
                Page {page} of {Math.ceil(total / 20)}
              </span>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={page >= Math.ceil(total / 20)}
                className="d-btn-ghost text-[12px] !px-3 !py-1.5 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {/* Edit Modal */}
      <Modal open={!!editItem} onClose={() => setEditItem(null)} title="Edit Content" maxWidth="max-w-lg">
        <div data-testid="library-edit-modal">
          <textarea
            value={editContent}
            onChange={e => setEditContent(e.target.value)}
            className="d-input resize-none min-h-[200px] mb-4"
            rows={8}
            data-testid="edit-content-textarea"
          />
          <div className="flex justify-end gap-2">
            <button onClick={() => setEditItem(null)} className="d-btn-ghost text-[13px]" data-testid="edit-cancel-btn">Cancel</button>
            <button onClick={handleEditSave} disabled={editSaving} className="d-btn-primary text-[13px]" data-testid="edit-save-btn">
              {editSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Delete Content" maxWidth="max-w-sm">
        <div data-testid="library-delete-modal">
          <p className="text-[14px] mb-5" style={{ color: 'var(--ink-600)' }}>Are you sure you want to delete this content? This action cannot be undone.</p>
          <div className="flex justify-end gap-2">
            <button onClick={() => setDeleteId(null)} className="d-btn-ghost text-[13px]" data-testid="delete-cancel-btn">Cancel</button>
            <button onClick={handleDelete} className="px-4 py-2 rounded-xl text-[13px] font-semibold text-white" style={{ background: 'var(--red-500)' }} data-testid="delete-confirm-btn">
              Delete
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
