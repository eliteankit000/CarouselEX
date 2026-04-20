'use client'

import Link from 'next/link'
import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Zap, ArrowRight, Menu, X } from 'lucide-react'

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  const handleScroll = useCallback(() => {
    setScrolled(window.scrollY > 16)
  }, [])

  useEffect(() => {
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [handleScroll])

  const navLinks = [
    { href: '/#features', label: 'Features' },
    { href: '/#how-it-works', label: 'How It Works' },
    { href: '/pricing', label: 'Pricing' },
    { href: '/results', label: 'Results' },
  ]

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'nav-glass shadow-sm' : 'bg-transparent'
      }`}
      data-testid="navbar"
    >
      <div className="container-main">
        <div className="flex items-center justify-between h-[64px]">
          <Link href="/" className="flex items-center gap-2.5" data-testid="logo">
            <div className="w-[36px] h-[36px] rounded-[10px] flex items-center justify-center"
              style={{ background: 'var(--brand-gradient)' }}>
              <Zap className="w-[14px] h-[14px] text-white" />
            </div>
            <span className="text-[18px] font-extrabold tracking-[-0.03em]"
              style={{ color: 'var(--ink-900)', fontFamily: 'var(--font-display)' }}>
              CarouselEx
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            {navLinks.map(l => (
              <Link
                key={l.href}
                href={l.href}
                className="text-[15px] font-medium transition-colors duration-200 relative group"
                style={{ color: 'var(--ink-600)' }}
                data-testid={`nav-link-${l.label.toLowerCase().replace(/\s/g, '-')}`}
              >
                <span className="group-hover:text-[var(--ink-900)]">{l.label}</span>
                <span className="absolute -bottom-1 left-0 w-0 h-[2px] group-hover:w-full transition-all duration-300"
                  style={{ background: 'var(--brand-primary)' }} />
              </Link>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            <Link href="/login" className="text-[15px] font-medium px-4 py-2 transition-colors"
              style={{ color: 'var(--ink-600)' }}
              data-testid="nav-login-btn">
              Log in
            </Link>
            <Link href="/signup">
              <button className="btn-primary btn-sm" data-testid="nav-start-free-btn">
                Start Free <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </Link>
          </div>

          <button
            className="md:hidden p-2 rounded-xl transition-colors"
            style={{ color: 'var(--ink-600)' }}
            onClick={() => setMobileOpen(!mobileOpen)}
            data-testid="mobile-menu-btn"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="md:hidden py-4 space-y-1 bg-white rounded-b-2xl border-t"
            style={{ borderColor: 'var(--ink-200)' }}
            data-testid="mobile-menu"
          >
            {navLinks.map(l => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setMobileOpen(false)}
                className="block px-4 py-3 text-[15px] font-medium rounded-xl"
                style={{ color: 'var(--ink-600)' }}
              >
                {l.label}
              </Link>
            ))}
            <div className="flex gap-3 pt-3 px-4">
              <Link href="/login">
                <button className="btn-secondary btn-sm">Log in</button>
              </Link>
              <Link href="/signup">
                <button className="btn-primary btn-sm">Start Free</button>
              </Link>
            </div>
          </motion.div>
        )}
      </div>
    </motion.nav>
  )
}
