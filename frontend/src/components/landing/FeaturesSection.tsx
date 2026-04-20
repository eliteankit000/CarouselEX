'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { Sparkles, Layers, Zap, ChevronRight, Star, Wand2, BarChart3, Palette } from 'lucide-react'

const features = [
  {
    icon: Sparkles,
    title: 'AI Carousel Generator',
    desc: 'From idea to scroll-stopping carousel in seconds — no writing, no designing.',
    points: [
      'Auto-generates Hook + Value slides + CTA',
      'Built-in virality & engagement scoring',
      'Topic input or video URL upload',
      'Platform-optimized content (LinkedIn, IG, TikTok, Threads)',
      'Smart hook rewriting & clarity tools',
      'Batch generate 10 carousels at once',
    ],
    gradient: 'linear-gradient(135deg, #5B3FE8, #8B5CF6)',
    featured: false,
  },
  {
    icon: Layers,
    title: 'Real-Time Slide Editor',
    desc: 'Click any element and edit instantly — like Canva, but built for carousels.',
    points: [
      'Live editing — no reloads, no friction',
      'Premium templates with modern layouts',
      'Color palettes: dark, light, gradient',
      'Font systems: modern, editorial, classic',
      'Background effects: grain, grid, textures',
      'Add images, headshots, logo & handle',
    ],
    gradient: 'linear-gradient(135deg, #7C3AED, #A78BFA)',
    featured: true,
    badge: 'Most Popular',
  },
  {
    icon: Wand2,
    title: 'Smart Content Optimizer',
    desc: 'AI tools that improve your content before you post — guaranteed better results.',
    points: [
      'Improve clarity with one click',
      'Make content more viral instantly',
      'Rewrite hooks for max attention',
      'Simplify or deepen any slide',
      'Add curiosity & retention triggers',
      'Proven structure: Hook → Value → CTA',
    ],
    gradient: 'linear-gradient(135deg, #10B981, #34D399)',
    featured: false,
  },
]

const miniFeatures = [
  { icon: Palette, title: 'Brand Kit', desc: 'Save your colors, fonts, and logo for consistent on-brand carousels every time.' },
  { icon: BarChart3, title: 'Platform Optimizer', desc: 'Export perfectly sized for Instagram, LinkedIn, TikTok, and Threads — automatically.' },
  { icon: Zap, title: 'Video to Carousel', desc: 'Upload a video URL and AI extracts key insights into ready-to-post carousel slides.' },
]

export default function FeaturesSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-60px' })

  return (
    <section id="features" className="section section-alt relative overflow-hidden" data-testid="features-section">
      <div className="container-main" ref={ref}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <span className="badge badge-brand mb-4 inline-flex">
            <Sparkles className="w-3 h-3" /> Core Features
          </span>
          <h2 className="text-h2 mb-4" style={{ color: 'var(--ink-900)' }} data-testid="features-heading">
            Everything you need to create viral carousels
          </h2>
          <p className="text-[18px] max-w-[560px] mx-auto" style={{ color: 'var(--ink-400)' }}>
            AI writing + professional design + real-time editing — one seamless workflow.
            No design skills needed. No switching tools.
          </p>
        </motion.div>

        {/* 3-column feature cards */}
        <div className="grid md:grid-cols-3 gap-5 mb-8">
          {features.map((f, idx) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 32 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: idx * 0.08 }}
              className={`card-base p-8 h-full group relative ${f.featured ? 'card-featured' : ''}`}
              data-testid={`feature-card-${f.title.toLowerCase().replace(/\s/g, '-')}`}
            >
              {f.featured && f.badge && (
                <div className="absolute -top-3 left-6">
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-white px-3 py-1 rounded-full"
                    style={{ background: 'var(--brand-gradient)' }}>
                    <Star className="w-3 h-3 fill-white" /> {f.badge}
                  </span>
                </div>
              )}
              <div className="w-[52px] h-[52px] rounded-xl flex items-center justify-center mb-6 transition-transform duration-300 group-hover:scale-110"
                style={{ background: f.gradient }}>
                <f.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-[18px] font-bold mb-2" style={{ color: 'var(--ink-800)', fontFamily: 'var(--font-display)' }}>{f.title}</h3>
              <p className="text-[14px] mb-6" style={{ color: 'var(--ink-400)' }}>{f.desc}</p>
              <ul className="space-y-3">
                {f.points.map(p => (
                  <li key={p} className="flex items-start gap-3 text-[14px]" style={{ color: 'var(--ink-600)' }}>
                    <ChevronRight className="w-4 h-4 mt-0.5 shrink-0" style={{ color: 'var(--brand-primary)' }} />
                    {p}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        {/* 3 mini feature cards */}
        <div className="grid md:grid-cols-3 gap-5">
          {miniFeatures.map((f, idx) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 24 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.3 + idx * 0.08 }}
              className="card-base p-6 flex items-start gap-4 group"
              data-testid={`mini-feature-${f.title.toLowerCase().replace(/\s/g, '-')}`}
            >
              <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: 'var(--brand-soft)', border: '1px solid rgba(91,63,232,0.15)' }}>
                <f.icon className="w-5 h-5" style={{ color: 'var(--brand-primary)' }} />
              </div>
              <div>
                <h4 className="text-[15px] font-semibold mb-1" style={{ color: 'var(--ink-800)' }}>{f.title}</h4>
                <p className="text-[13px]" style={{ color: 'var(--ink-400)' }}>{f.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
