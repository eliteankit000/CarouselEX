'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { Star } from 'lucide-react'

const testimonials = [
  { name: 'Sarah Chen', role: 'LinkedIn Creator', quote: 'I used to spend 3 hours on a single carousel. With CarouselEx, it takes 10 minutes — and the engagement is 3x higher.', metric: '3x engagement', initials: 'SC' },
  { name: 'Mike Ross', role: 'SaaS Founder', quote: 'The AI nails the hook every single time. My LinkedIn posts went from 200 to 8,000+ impressions in two weeks.', metric: '40x reach', initials: 'MR' },
  { name: 'Emma Wilson', role: 'Personal Brand Coach', quote: 'The templates are genuinely beautiful — my clients think I hired a designer. No one believes I made these myself.', metric: 'Pro quality', initials: 'EW' },
  { name: 'James Park', role: 'Agency Owner', quote: 'We replaced Canva + ChatGPT + Notion with one tool. My team creates 5 carousels in the time it used to take to make one.', metric: '5x output', initials: 'JP' },
  { name: 'Priya Sharma', role: 'Instagram Creator', quote: 'The virality scoring actually works. Every post I score above 85 blows up. It\'s become my pre-post ritual.', metric: '12K saves', initials: 'PS' },
  { name: 'David Chen', role: 'B2B Marketer', quote: "CarouselEx is the only tool I've paid for and immediately felt like I was getting 10x the value. The speed is insane.", metric: '$0 design cost', initials: 'DC' },
]

const stats = [
  { value: '2,000+', label: 'Active Creators' },
  { value: '50K+', label: 'Carousels Created' },
  { value: '3.5x', label: 'Avg Engagement Boost' },
  { value: '4.9/5', label: 'User Rating' },
]

export default function TestimonialsSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-60px' })

  return (
    <section className="section section-alt" data-testid="testimonials-section">
      <div className="container-main" ref={ref}>
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <p className="section-label mb-3">SOCIAL PROOF</p>
          <h2 className="text-h2 mb-4" style={{ color: 'var(--ink-900)' }}>
            Loved by <span className="text-gradient-brand">creators</span>
          </h2>
          <p className="text-[18px]" style={{ color: 'var(--ink-400)' }}>Real carousels. Real results. No fluff.</p>
        </motion.div>

        {/* 6 testimonial cards in 3-col grid */}
        <div className="grid md:grid-cols-3 gap-5 mb-16">
          {testimonials.map((t, idx) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 32 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: idx * 0.08 }}
              className={`card-base p-7 group ${idx === 1 ? 'card-featured' : ''}`}
              data-testid={`testimonial-${t.name.toLowerCase().replace(/\s/g, '-')}`}
            >
              <div className="flex items-center justify-between mb-5">
                <div className="flex gap-[3px]">
                  {[1,2,3,4,5].map(i => (
                    <Star key={i} className="w-[14px] h-[14px] fill-[var(--amber-500)]" style={{ color: 'var(--amber-500)' }} />
                  ))}
                </div>
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-md"
                  style={{ background: 'var(--brand-soft)', color: 'var(--brand-primary)' }}>
                  {t.metric}
                </span>
              </div>
              <p className="text-[14px] italic mb-7 leading-[1.7]" style={{ color: 'var(--ink-800)' }}>
                &ldquo;{t.quote}&rdquo;
              </p>
              <div className="flex items-center gap-3 pt-5" style={{ borderTop: '1px solid var(--ink-100)' }}>
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-[12px] font-bold"
                  style={{ background: 'var(--brand-soft)', color: 'var(--brand-primary)', border: '1px solid rgba(91,63,232,0.15)' }}>
                  {t.initials}
                </div>
                <div>
                  <p className="text-[13px] font-semibold" style={{ color: 'var(--ink-800)' }}>{t.name}</p>
                  <p className="text-[12px]" style={{ color: 'var(--ink-400)' }}>{t.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Metrics strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
          {stats.map((s, idx) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.5 + idx * 0.1 }}
              className="text-center rounded-2xl p-6"
              style={{ background: 'var(--brand-soft)', border: '1px solid rgba(91,63,232,0.15)' }}
              data-testid={`stat-${s.label.toLowerCase().replace(/\s/g, '-')}`}
            >
              <p className="text-[36px] font-extrabold tracking-[-0.02em]" style={{ color: 'var(--ink-900)', fontFamily: 'var(--font-display)' }}>
                {s.value}
              </p>
              <p className="text-[14px] font-medium" style={{ color: 'var(--ink-400)' }}>{s.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
