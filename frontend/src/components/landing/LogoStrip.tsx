'use client'

export default function LogoStrip() {
  const logos = ['Instagram', 'LinkedIn', 'TikTok', 'Threads', 'YouTube', 'X / Twitter', 'Pinterest', 'Facebook']

  return (
    <section className="py-14 relative overflow-hidden" style={{ background: 'var(--ink-50)', borderTop: '1px solid var(--ink-200)', borderBottom: '1px solid var(--ink-200)' }} data-testid="logo-strip">
      <div className="text-center mb-8">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: 'var(--ink-400)' }}>
          EXPORT OPTIMIZED FOR EVERY PLATFORM
        </p>
      </div>
      <div className="relative">
        <div className="flex animate-marquee whitespace-nowrap">
          {[...logos, ...logos].map((name, i) => (
            <span key={`${name}-${i < logos.length ? 'a' : 'b'}`} className="mx-10 text-[18px] font-bold tracking-[-0.02em] select-none"
              style={{ color: 'var(--ink-200)' }} data-testid={`logo-${name.toLowerCase()}-${i}`}>
              {name}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}
