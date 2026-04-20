'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Zap, Home, Sparkles, FolderOpen, Settings, Menu, X, LogOut, ChevronRight, ChevronLeft, Search, Bell, TrendingUp, PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'

const mainNav = [
  { href: '/dashboard', label: 'Home', icon: Home },
  { href: '/dashboard/create', label: 'Create Content', icon: Sparkles },
  { href: '/dashboard/library', label: 'Content Library', icon: FolderOpen },
  { href: '/dashboard/trends', label: 'Trends', icon: TrendingUp },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
]

function Sidebar({ mobileOpen, setMobileOpen, open, setOpen }: { mobileOpen: boolean; setMobileOpen: (v: boolean) => void; open: boolean; setOpen: (v: boolean) => void }) {
  const pathname = usePathname()
  const { user, signOut } = useAuth()

  const isActive = (href: string) => href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(href)

  const NavItem = ({ item }: { item: typeof mainNav[0] }) => {
    const active = isActive(item.href)
    return (
      <Link
        href={item.href}
        onClick={() => setMobileOpen(false)}
        title={!open ? item.label : undefined}
        data-testid={`sidebar-link-${item.label.toLowerCase().replace(/\s/g, '-')}`}
        className={`flex items-center gap-3 ${open ? 'px-3' : 'px-0 justify-center'} py-2.5 rounded-lg text-[14px] font-medium transition-all relative group ${
          active
            ? 'text-[var(--brand-primary)] bg-[var(--brand-soft)]'
            : 'text-[var(--ink-400)] hover:text-[var(--ink-900)] hover:bg-[var(--ink-100)]'
        }`}
      >
        {active && (
          <motion.div
            layoutId="sidebar-active"
            className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-5 rounded-r-full"
            style={{ background: 'var(--brand-primary)' }}
            transition={{ type: 'spring', stiffness: 350, damping: 30 }}
          />
        )}
        <item.icon className={`w-[18px] h-[18px] shrink-0 ${active ? 'text-[var(--brand-primary)]' : 'text-[var(--ink-400)] group-hover:text-[var(--ink-600)]'}`} />
        {open && <span className="truncate">{item.label}</span>}
      </Link>
    )
  }

  const content = (
    <div className="flex flex-col h-full">
      {/* Logo + Toggle */}
      <div className={`h-[72px] flex items-center ${open ? 'px-5 justify-between' : 'px-2 justify-center'} border-b shrink-0`} style={{ borderColor: 'var(--ink-200)' }}>
        {open ? (
          <>
            <Link href="/dashboard" className="flex items-center gap-2.5 min-w-0">
              <div className="w-[36px] h-[36px] rounded-[10px] flex items-center justify-center shrink-0"
                style={{ background: 'var(--brand-gradient)' }}>
                <Zap className="w-[14px] h-[14px] text-white" />
              </div>
              <span className="text-[18px] font-extrabold tracking-[-0.03em] truncate" style={{ color: 'var(--ink-900)', fontFamily: 'var(--font-display)' }} data-testid="sidebar-logo-text">CarouselEx</span>
            </Link>
            <button onClick={() => setOpen(false)} className="hidden lg:flex p-1.5 rounded-lg hover:bg-[var(--ink-100)] transition-colors" data-testid="sidebar-toggle-btn" title="Collapse">
              <PanelLeftClose className="w-4 h-4" style={{ color: 'var(--ink-400)' }} />
            </button>
          </>
        ) : (
          <button onClick={() => setOpen(true)} className="w-[40px] h-[40px] rounded-[10px] flex items-center justify-center transition-all hover:scale-105"
            style={{ background: 'var(--brand-gradient)' }} data-testid="sidebar-toggle-btn" title="Expand">
            <Zap className="w-[14px] h-[14px] text-white" />
          </button>
        )}
      </div>

      {/* Main nav */}
      <nav className={`flex-1 ${open ? 'px-3' : 'px-2'} py-4 space-y-1 overflow-y-auto`} data-testid="sidebar-nav">
        {open && <p className="text-[10px] font-semibold uppercase tracking-[0.08em] px-3 py-1.5" style={{ color: 'var(--ink-400)' }}>Main</p>}
        {mainNav.map(item => <NavItem key={item.href} item={item} />)}
      </nav>

      {/* Upgrade CTA (only when open) */}
      {open && (
        <div className="px-3 pb-3 shrink-0">
          <Link href="/dashboard/settings?tab=billing" className="block p-3 rounded-xl relative overflow-hidden group"
            style={{ background: 'var(--brand-soft)', border: '1px solid rgba(91,63,232,0.12)' }}>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
            <div className="relative flex items-center gap-2 mb-1">
              <Zap className="w-3.5 h-3.5" style={{ color: 'var(--brand-primary)' }} />
              <span className="text-[12px] font-bold" style={{ color: 'var(--ink-900)' }}>Upgrade to Pro</span>
            </div>
            <p className="text-[11px] relative" style={{ color: 'var(--ink-400)' }}>Unlock unlimited content</p>
          </Link>
        </div>
      )}

      {/* User footer */}
      <div className={`h-[72px] flex items-center gap-3 border-t shrink-0 ${open ? 'px-4' : 'px-0 justify-center'}`} style={{ borderColor: 'var(--ink-200)' }}>
        <div className="w-[34px] h-[34px] rounded-full flex items-center justify-center text-[12px] font-bold text-white shrink-0"
          style={{ background: 'var(--brand-gradient)' }} title={!open ? (user?.email || '') : undefined}>
          {(user?.full_name || user?.email || 'U')[0].toUpperCase()}
        </div>
        {open && (
          <>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold truncate" style={{ color: 'var(--ink-900)' }}>{user?.full_name || 'User'}</p>
              <p className="text-[11px] truncate" style={{ color: 'var(--ink-400)' }}>{user?.email}</p>
            </div>
            <button onClick={signOut} className="p-1.5 rounded-lg transition-all hover:bg-[var(--red-50)]"
              style={{ color: 'var(--ink-400)' }}
              title="Sign out"
              data-testid="sidebar-logout-btn">
              <LogOut className="w-4 h-4 hover:text-[var(--red-500)]" />
            </button>
          </>
        )}
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile toggle */}
      <button
        className="lg:hidden fixed top-4 left-4 z-50 p-2.5 rounded-xl border"
        style={{ background: 'var(--bg-card)', borderColor: 'var(--ink-200)', boxShadow: 'var(--shadow-sm)' }}
        onClick={() => setMobileOpen(true)}
        data-testid="mobile-sidebar-toggle"
      >
        <Menu className="w-5 h-5" style={{ color: 'var(--ink-400)' }} />
      </button>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <div className="lg:hidden fixed inset-0 z-50">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
            <motion.div initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="relative w-[260px] h-full bg-white border-r shadow-2xl" style={{ borderColor: 'var(--ink-200)' }}>
              <button className="absolute top-5 right-4 p-1.5 rounded-lg hover:bg-[var(--ink-100)]" onClick={() => setMobileOpen(false)}>
                <X className="w-4 h-4" style={{ color: 'var(--ink-400)' }} />
              </button>
              {content}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Desktop sidebar — width transitions smoothly */}
      <aside
        className="hidden lg:flex flex-col h-screen sticky top-0 border-r shrink-0 bg-white overflow-hidden"
        style={{
          width: open ? 240 : 64,
          borderColor: 'var(--ink-200)',
          transition: 'width 0.25s ease',
        }}
        data-testid="sidebar"
        data-sidebar-open={open}
      >
        {content}
      </aside>
    </>
  )
}

function TopHeader() {
  const pathname = usePathname()
  const pageNames: Record<string, string> = {
    '/dashboard': 'Home',
    '/dashboard/create': 'Create Content',
    '/dashboard/library': 'Content Library',
    '/dashboard/trends': 'Trends',
    '/dashboard/settings': 'Settings',
  }
  const pageName = Object.entries(pageNames).find(([k]) => pathname.startsWith(k))?.[1] || 'Home'

  return (
    <header className="h-[64px] sticky top-0 z-40 flex items-center justify-between px-6 lg:px-8 border-b nav-glass"
      data-testid="dashboard-header">
      <div className="flex items-center gap-2 text-[14px]">
        <Link href="/dashboard" className="transition-colors hover:text-[var(--ink-600)]" style={{ color: 'var(--ink-400)' }}>Home</Link>
        <ChevronRight className="w-3.5 h-3.5" style={{ color: 'var(--ink-400)' }} />
        <span className="font-semibold" style={{ color: 'var(--ink-900)' }}>{pageName}</span>
      </div>
      <div className="flex items-center gap-3">
        <button className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg text-[13px] border transition-all hover:border-[var(--brand-primary)]"
          style={{ background: 'var(--bg-card)', borderColor: 'var(--ink-200)', color: 'var(--ink-400)' }}
          data-testid="search-btn">
          <Search className="w-3.5 h-3.5" />
          <span>Search...</span>
          <kbd className="text-[10px] px-1.5 py-0.5 rounded border font-mono" style={{ borderColor: 'var(--ink-200)', color: 'var(--ink-400)' }}>K</kbd>
        </button>
        <button className="relative p-2 rounded-lg hover:bg-[var(--ink-100)] transition-colors" data-testid="notifications-btn">
          <Bell className="w-[18px] h-[18px]" style={{ color: 'var(--ink-400)' }} />
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full" style={{ background: 'var(--brand-primary)' }} />
        </button>
      </div>
    </header>
  )
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)

  // Hide the dashboard header + main padding on editor routes
  const isEditorRoute = pathname?.startsWith('/dashboard/create')

  // Persist sidebar state
  useEffect(() => {
    const saved = localStorage.getItem('cx_sidebar_open')
    if (saved !== null) setSidebarOpen(saved === '1')
  }, [])
  useEffect(() => {
    localStorage.setItem('cx_sidebar_open', sidebarOpen ? '1' : '0')
  }, [sidebarOpen])

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="dark-dashboard min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--brand-primary)', borderTopColor: 'transparent' }} />
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="dark-dashboard min-h-screen flex" data-testid="dashboard-layout">
      <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} open={sidebarOpen} setOpen={setSidebarOpen} />
      <div className="flex-1 min-w-0 flex flex-col">
        {!isEditorRoute && <TopHeader />}
        <main className={isEditorRoute ? 'flex-1 min-h-0' : 'flex-1 p-6 lg:p-8 d-gradient-mesh d-page-enter'}>
          {children}
        </main>
      </div>
    </div>
  )
}
