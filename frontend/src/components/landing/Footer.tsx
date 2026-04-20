'use client'

import Link from 'next/link'
import { Zap } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="pt-20 pb-10 bg-white" style={{ borderTop: '1px solid var(--ink-200)' }} data-testid="footer">
      <div className="container-main">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-10 mb-16">
          <div className="col-span-2 pr-8">
            <div className="flex items-center gap-2.5 mb-5">
              <div className="w-[32px] h-[32px] rounded-[10px] flex items-center justify-center"
                style={{ background: 'var(--brand-gradient)' }}>
                <Zap className="w-4 h-4 text-white" />
              </div>
              <span className="text-[17px] font-extrabold tracking-[-0.03em]"
                style={{ color: 'var(--ink-900)', fontFamily: 'var(--font-display)' }}>
                CarouselEx
              </span>
            </div>
            <p className="text-[13px] leading-[1.7] mb-5 max-w-[280px]" style={{ color: 'var(--ink-400)' }}>
              The fastest way to create viral content on the internet.
            </p>
            <div className="flex gap-3">
              {[
                { label: 'X', icon: 'X' },
                { label: 'Li', icon: 'in' },
              ].map(s => (
                <a key={s.label} href="#"
                  className="w-9 h-9 rounded-[10px] flex items-center justify-center text-[11px] font-bold transition-all hover:scale-105"
                  style={{
                    background: 'var(--ink-100)',
                    color: 'var(--ink-400)',
                    border: '1px solid var(--ink-200)',
                  }}
                  data-testid={`footer-social-${s.label.toLowerCase()}`}
                >
                  {s.icon}
                </a>
              ))}
            </div>
          </div>

          {[
            {
              title: 'PRODUCT',
              links: [
                { label: 'Features', href: '/#features' },
                { label: 'Pricing', href: '/pricing' },
                { label: 'Results', href: '/results' },
                { label: 'Changelog', href: '#' },
                { label: 'API Docs', href: '#' },
                { label: 'Integrations', href: '#' },
              ],
            },
            {
              title: 'COMPANY',
              links: [
                { label: 'Blog', href: '#' },
                { label: 'About', href: '#' },
                { label: 'Contact', href: '#' },
                { label: 'Careers', href: '#' },
                { label: 'Press Kit', href: '#' },
                { label: 'Affiliates', href: '#' },
              ],
            },
            {
              title: 'LEGAL',
              links: [
                { label: 'Privacy Policy', href: '#' },
                { label: 'Terms of Service', href: '#' },
                { label: 'Cookie Policy', href: '#' },
                { label: 'GDPR', href: '#' },
                { label: 'Security', href: '#' },
                { label: 'Status', href: '#' },
              ],
            },
          ].map(col => (
            <div key={col.title}>
              <h4 className="text-[11px] font-bold uppercase tracking-[0.15em] mb-5"
                style={{ color: 'var(--ink-900)' }}>
                {col.title}
              </h4>
              <ul className="space-y-3">
                {col.links.map(l => (
                  <li key={l.label}>
                    <Link
                      href={l.href}
                      className="text-[13px] transition-colors hover:text-[var(--ink-900)]"
                      style={{ color: 'var(--ink-400)' }}
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-3"
          style={{ borderTop: '1px solid var(--ink-100)' }}>
          <p className="text-[12px]" style={{ color: 'var(--ink-400)' }}>
            &copy; 2026 CarouselEx. All rights reserved.
          </p>
          <p className="text-[13px]" style={{ color: 'var(--ink-400)' }}>
            Built for creators who want results.
          </p>
        </div>
      </div>
    </footer>
  )
}
