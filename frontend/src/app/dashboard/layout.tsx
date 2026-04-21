'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Zap, Home, Sparkles, FolderOpen, Settings, Menu, X, LogOut,
  Search, Bell, TrendingUp, PanelLeftClose,
} from 'lucide-react'
import { useAuth } from '@/lib/auth-context'

const mainNav = [
  { href: '/dashboard', label: 'Home', icon: Home },
  { href: '/dashboard/create', label: 'Create Content', icon: Sparkles },
  { href: '/dashboard/library', label: 'Content Library', icon: FolderOpen },
  { href: '/dashboard/trends', label: 'Trends', icon: TrendingUp },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
]

function Sidebar({
  mobileOpen,
  setMobileOpen,
}: {
  mobileOpen: boolean
  setMobileOpen: (v: boolean) => void
}) {
  const pathname = usePathname()
  const { user, signOut } = useAuth()

  const isActive = (href: string) =>
    href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(href)

  const initial = (user?.full_name || user?.email || 'U')[0].toUpperCase()

  const content = (
    <>
      <div className="cx-sidebar-header">
        <Link href="/dashboard" className="cx-logo" data-testid="sidebar-logo">
          <span className="cx-logo-mark">
            <Zap width="14" height="14" strokeWidth={2.5} />
          </span>
          <span className="cx-logo-text">CarouselEx</span>
        </Link>
        <button
          className="cx-sidebar-toggle"
          data-testid="sidebar-collapse-btn"
          aria-label="Toggle sidebar"
          onClick={() => setMobileOpen(false)}
        >
          <PanelLeftClose width="16" height="16" />
        </button>
      </div>

      <div className="cx-nav-label">MAIN</div>
      <nav className="cx-nav" data-testid="sidebar-nav">
        {mainNav.map((item) => {
          const active = isActive(item.href)
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`cx-nav-item ${active ? 'cx-active' : ''}`}
              data-testid={`sidebar-link-${item.label.toLowerCase().replace(/\s/g, '-')}`}
            >
              <Icon />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      <Link
        href="/dashboard/settings?tab=billing"
        className="cx-upgrade"
        data-testid="sidebar-upgrade-cta"
      >
        <div className="cx-upgrade-title">
          <Zap width="14" height="14" strokeWidth={2.5} />
          Upgrade to Pro
        </div>
        <div className="cx-upgrade-sub">Unlock unlimited content</div>
      </Link>

      <div className="cx-user">
        <span className="cx-avatar">{initial}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="cx-user-name">{user?.full_name || 'User'}</div>
          <div className="cx-user-email">{user?.email}</div>
        </div>
        <button
          onClick={signOut}
          className="cx-logout-btn"
          aria-label="Sign out"
          data-testid="sidebar-logout-btn"
        >
          <LogOut width="16" height="16" />
        </button>
      </div>
    </>
  )

  return (
    <>
      {/* Mobile toggle */}
      <button
        aria-label="Open menu"
        className="cx-sidebar-toggle"
        onClick={() => setMobileOpen(true)}
        data-testid="mobile-sidebar-toggle"
        style={{
          position: 'fixed', top: 12, left: 12, zIndex: 60,
          width: 40, height: 40, background: '#fff',
          border: '1px solid var(--cx-border)',
          borderRadius: 10,
          display: 'none',
        }}
      >
        <Menu width="18" height="18" />
      </button>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 70 }} className="cx-mobile-drawer">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)' }}
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: -260 }}
              animate={{ x: 0 }}
              exit={{ x: -260 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="cx-sidebar"
              style={{ position: 'absolute', top: 0, left: 0 }}
            >
              <button
                onClick={() => setMobileOpen(false)}
                style={{
                  position: 'absolute', top: 14, right: 14,
                  background: 'transparent', border: 'none', padding: 6,
                  borderRadius: 6, cursor: 'pointer', color: 'var(--cx-muted-2)',
                }}
              >
                <X width="16" height="16" />
              </button>
              {content}
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      {/* Desktop sidebar */}
      <aside className="cx-sidebar cx-sidebar-desktop" data-testid="sidebar">
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
  const pageName =
    Object.entries(pageNames).find(([k]) => pathname.startsWith(k))?.[1] || 'Home'

  return (
    <header className="cx-header" data-testid="dashboard-header">
      <div className="cx-crumb">
        <Link
          href="/dashboard"
          style={{ color: 'var(--cx-muted-2)', textDecoration: 'none' }}
        >
          Home
        </Link>
        <span className="cx-crumb-sep">›</span>
        <span className="cx-crumb-current">{pageName}</span>
      </div>
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
        <label className="cx-search" data-testid="search-bar">
          <Search width="14" height="14" style={{ color: 'var(--cx-muted-2)' }} />
          <input placeholder="Search..." data-testid="search-input" />
          <span className="cx-kbd">⌘K</span>
        </label>
        <button className="cx-bell-btn" aria-label="Notifications" data-testid="notifications-btn">
          <Bell />
          <span className="cx-bell-dot" />
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

  const isEditorRoute = pathname?.startsWith('/dashboard/create')

  useEffect(() => {
    if (!loading && !user) router.push('/login')
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="cx-theme" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{
          width: 32, height: 32, borderRadius: '50%',
          border: '2px solid var(--cx-brand)',
          borderTopColor: 'transparent',
          animation: 'spin 0.9s linear infinite',
        }} />
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="cx-theme" style={{ minHeight: '100vh', display: 'flex' }} data-testid="dashboard-layout">
      <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        {!isEditorRoute && <TopHeader />}
        <main style={{ flex: 1 }}>
          {children}
        </main>
      </div>
      <style jsx global>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 1023px) {
          .cx-sidebar-desktop { display: none !important; }
          .cx-theme > button[data-testid="mobile-sidebar-toggle"] { display: inline-flex !important; }
          .cx-header { padding: 0 20px 0 64px !important; }
        }
      `}</style>
    </div>
  )
}
