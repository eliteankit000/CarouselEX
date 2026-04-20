'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { Lightbulb, Wand2, Share2, Zap, Clock, TrendingUp, Layers } from 'lucide-react'

const steps = [
  {
    num: '01',
    title: 'Input Your Idea',
    desc: 'Type a topic, paste a script, or drop a video URL. CarouselEx understands your content and knows what your audience needs to hear.',
    icon: Lightbulb,
    color: 'var(--brand-primary)',
  },
  {
    num: '02',
    title: 'AI Builds Your Carousel',
    desc: 'Hook, value slides, and CTA — all generated instantly. Premium templates, smart layouts, and platform-optimized structure applied automatically.',
    icon: Wand2,
    color: '#8B5CF6',
  },
  {
    num: '03',
    title: 'Edit, Export & Post',
    desc: 'Click any element to edit live. Adjust colors, fonts, and layout in real-time. Export pixel-perfect slides for Instagram, LinkedIn, TikTok, or Threads.',
    icon: Share2,
    color: 'var(--green-500)',
  },
]

const metrics = [
  { icon: Clock, value: '< 3 min', label: 'Idea to carousel' },
  { icon: Layers, value: '10+', label: 'Premium templates' },
  { icon: TrendingUp, value: '3.5x', label: 'Engagement boost' },
  { icon: Zap, value: '4 Platforms', label: 'IG, LinkedIn, TikTok, Threads' },
]

export default function HowItWorksSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-60px' })

  return (
    <section id="how-it-works" className="section section-dark relative overflow-hidden noise-overlay" data-testid="how-it-works-section">
      <div className="container-main relative z-10" ref={ref}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <p className="text-[12px] font-bold uppercase tracking-[0.1em] mb-3" style={{ color: '#A78BFA' }}>
            HOW IT WORKS
          </p>
          <h2 className="text-h2 text-white mb-4">From idea to posted — in minutes</h2>
          <p className="text-[18px]" style={{ color: 'rgba(255,255,255,0.5)' }}>
            No design skills. No copywriting struggle. No switching between tools.
          </p>
        </motion.div>

        {/* 3 Steps */}
        <div className="grid md:grid-cols-3 gap-8 relative mb-20">
          {/* Dashed connection line */}
          <div className="hidden md:block absolute top-[52px] left-[20%] right-[20%]">
            <svg width="100%" height="4" className="overflow-visible">
              <line x1="0" y1="2" x2="100%" y2="2"
                stroke="rgba(255,255,255,0.15)" strokeWidth="2" strokeDasharray="8 8"
                className={isInView ? 'animate-dash' : ''} />
            </svg>
          </div>

          {steps.map((s, idx) => (
            <motion.div
              key={s.num}
              initial={{ opacity: 0, y: 32 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: idx * 0.15 }}
              className="text-center relative"
              data-testid={`step-${s.num}`}
            >
              <div className="relative z-10 w-[72px] h-[72px] rounded-2xl flex items-center justify-center mx-auto mb-6 transition-all duration-300"
                style={{
                  background: 'var(--ink-800)',
                  border: '2px solid rgba(255,255,255,0.1)',
                  boxShadow: `0 0 30px ${s.color}22`,
                }}>
                <s.icon className="w-7 h-7" style={{ color: s.color }} />
              </div>
              <span className="text-[11px] font-bold uppercase tracking-[0.2em] mb-3 block" style={{ color: s.color, opacity: 0.6 }}>
                Step {s.num}
              </span>
              <h3 className="text-[18px] font-bold text-white mb-3" style={{ fontFamily: 'var(--font-display)' }}>{s.title}</h3>
              <p className="text-[14px] leading-[1.7] max-w-[300px] mx-auto" style={{ color: 'rgba(255,255,255,0.5)' }}>
                {s.desc}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Metric cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {metrics.map((m, idx) => (
            <motion.div
              key={m.label}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.5 + idx * 0.1 }}
              className="rounded-2xl p-6 text-center"
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.08)',
                backdropFilter: 'blur(8px)',
              }}
              data-testid={`metric-${m.label.toLowerCase().replace(/\s/g, '-')}`}
            >
              <m.icon className="w-5 h-5 mx-auto mb-3" style={{ color: 'var(--brand-light)' }} />
              <p className="text-[28px] font-extrabold text-white tracking-[-0.02em] mb-1" style={{ fontFamily: 'var(--font-display)' }}>
                {m.value}
              </p>
              <p className="text-[12px] font-medium" style={{ color: 'rgba(255,255,255,0.4)' }}>{m.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
