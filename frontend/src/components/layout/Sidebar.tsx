'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Zap, LayoutDashboard, PenTool, Settings, Menu, X, LogOut } from 'lucide-react'
import { cn } from '@/utils'
import { useAuth } from '@/lib/auth-context'
import { motion, AnimatePresence } from 'framer-motion'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/create', label: 'Create Content', icon: PenTool },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
]

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const pathname = usePathname()
  const { user, signOut } = useAuth()

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard'
    return pathname.startsWith(href)
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-5 flex items-center gap-2.5 border-b border-[#F1F5F9]">
        <div className="w-9 h-9 bg-gradient-primary rounded-xl flex items-center justify-center shadow-[0_2px_8px_rgba(37,99,235,0.25)] shrink-0">
          <Zap className="w-5 h-5 text-white" />
        </div>
        {!collapsed && <span className="text-lg font-bold tracking-tight text-txt-primary">CarouselEx</span>}
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1" data-testid="sidebar-nav">
        {navItems.map(item => {
          const active = isActive(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              data-testid={`sidebar-link-${item.label.toLowerCase().replace(/\s/g, '-')}`}
              className={cn(
                'flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200 relative group',
                active
                  ? 'bg-primary/[0.08] text-primary'
                  : 'text-txt-secondary hover:bg-[#F8FAFC] hover:text-txt-primary'
              )}
            >
              {active && (
                <motion.div
                  layoutId="sidebar-indicator"
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-primary rounded-r-full"
                  transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                />
              )}
              <item.icon className={cn('w-[18px] h-[18px] shrink-0 transition-colors', active ? 'text-primary' : 'text-txt-muted group-hover:text-txt-secondary')} />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          )
        })}
      </nav>

      <div className="px-3 pb-4 space-y-2 border-t border-[#F1F5F9] pt-4">
        {!collapsed && user && (
          <div className="px-3.5 py-2.5">
            <p className="text-sm font-semibold text-txt-primary truncate">{user.full_name || user.email}</p>
            <p className="text-xs text-txt-muted truncate mt-0.5">{user.email}</p>
          </div>
        )}
        <button
          onClick={signOut}
          data-testid="sidebar-logout-btn"
          className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[13px] font-medium text-txt-muted hover:bg-red-50 hover:text-red-600 transition-all w-full group"
        >
          <LogOut className="w-[18px] h-[18px] shrink-0 group-hover:text-red-500" />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>
    </div>
  )

  return (
    <>
      <button
        className="lg:hidden fixed top-4 left-4 z-50 p-2.5 bg-white border border-[#E2E8F0] rounded-xl shadow-premium"
        onClick={() => setMobileOpen(true)}
        data-testid="mobile-sidebar-toggle"
      >
        <Menu className="w-5 h-5 text-txt-secondary" />
      </button>

      <AnimatePresence>
        {mobileOpen && (
          <div className="lg:hidden fixed inset-0 z-50">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/20 backdrop-blur-sm"
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="relative w-[264px] h-full bg-white border-r border-[#E2E8F0] shadow-2xl"
            >
              <button
                className="absolute top-5 right-4 p-1.5 rounded-lg hover:bg-[#F1F5F9] transition-colors"
                onClick={() => setMobileOpen(false)}
              >
                <X className="w-4 h-4 text-txt-muted" />
              </button>
              <SidebarContent />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <aside
        className={cn(
          'hidden lg:flex flex-col h-screen sticky top-0 bg-white border-r border-[#E2E8F0]/80 transition-all duration-300',
          collapsed ? 'w-[72px]' : 'w-[260px]'
        )}
        data-testid="sidebar"
      >
        <SidebarContent />
      </aside>
    </>
  )
}
