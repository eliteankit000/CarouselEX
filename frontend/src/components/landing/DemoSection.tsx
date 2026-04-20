'use client'

import { useRef, useState, useEffect, useCallback } from 'react'
import { motion, useInView } from 'framer-motion'
import { Sparkles, Layers, Wand2 } from 'lucide-react'

const SAMPLE_SLIDES = [
  { label: 'Hook', text: "Nobody tells you this about growing on LinkedIn in 2025..." },
  { label: 'Slide 2', text: 'Most creators post consistently but still get zero traction. Here\'s the real reason...' },
  { label: 'CTA', text: 'Save this post — share it with one creator who needs this today →' },
] as const

const TAG_PILLS = ['HOOK', 'VALUE', 'STORY', 'CTA'] as const

const TEMPLATE_PREVIEWS = [
  { name: 'Gradient Dark', colors: ['#4F46E5', '#7C3AED', '#A855F7'] },
  { name: 'Clean Light', colors: ['#F8FAFC', '#E2E8F0', '#CBD5E1'] },
  { name: 'Bold Accent', colors: ['#FEF3C7', '#F59E0B', '#DC2626'] },
]

export default function DemoSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-60px' })
  const [generating, setGenerating] = useState(false)
  const [generated, setGenerated] = useState(false)
  const [typedIndex, setTypedIndex] = useState(0)
  const [activeTemplate, setActiveTemplate] = useState(0)

  const handleGenerate = useCallback(() => {
    setGenerating(true)
    setGenerated(false)
    setTypedIndex(0)
    setTimeout(() => {
      setGenerating(false)
      setGenerated(true)
    }, 2000)
  }, [])

  useEffect(() => {
    if (generated && typedIndex < SAMPLE_SLIDES.length) {
      const t = setTimeout(() => setTypedIndex(prev => prev + 1), 600)
      return () => clearTimeout(t)
    }
  }, [generated, typedIndex])

  return (
    <section className="section" data-testid="demo-section">
      <div className="container-main" ref={ref}>
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-h2 mb-4" style={{ color: 'var(--ink-900)' }} data-testid="demo-heading">See it in action</h2>
          <p className="text-[18px]" style={{ color: 'var(--ink-400)' }}>
            From raw idea to scroll-stopping carousel — in under 3 minutes.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {/* Left Panel — Carousel Generator */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="card-base p-8"
            data-testid="demo-carousel-generator"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center"
                style={{ background: 'var(--brand-gradient)' }}>
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-[15px]" style={{ color: 'var(--ink-800)', fontFamily: 'var(--font-display)' }}>AI Carousel Generator</h3>
                <p className="text-[12px]" style={{ color: 'var(--ink-400)' }}>Idea → Hook → Slides → CTA</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-[0.1em] mb-2 block" style={{ color: 'var(--ink-400)' }}>YOUR TOPIC OR IDEA</label>
                <textarea
                  className="w-full rounded-xl p-4 text-[13px] resize-none focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/20"
                  style={{ background: 'var(--ink-50)', border: '1px solid var(--ink-200)', color: 'var(--ink-600)' }}
                  rows={2}
                  defaultValue="How to grow on LinkedIn without posting daily..."
                  data-testid="demo-input-textarea"
                />
              </div>

              <button
                onClick={handleGenerate}
                disabled={generating}
                className="btn-primary w-full justify-center"
                data-testid="demo-generate-btn"
              >
                {generating ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Generating carousel...
                  </span>
                ) : 'Generate Carousel →'}
              </button>

              {generating && (
                <div className="flex items-center gap-2 justify-center py-2">
                  <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: 'var(--brand-primary)' }} />
                  <span className="text-[11px] font-semibold uppercase tracking-[0.1em]" style={{ color: 'var(--brand-primary)' }}>
                    AI Writing Slides
                  </span>
                </div>
              )}

              {!generating && (
                <div className="flex gap-2">
                  {TAG_PILLS.map(tag => (
                    <span key={tag} className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-[0.05em]"
                      style={{ background: 'var(--brand-soft)', color: 'var(--brand-primary)', border: '1px solid rgba(91,63,232,0.15)' }}>
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {generated && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-2"
                  data-testid="demo-generated-output"
                >
                  {SAMPLE_SLIDES.map((slide, i) => (
                    <motion.div
                      key={slide.label}
                      initial={{ opacity: 0 }}
                      animate={typedIndex > i ? { opacity: 1 } : {}}
                      transition={{ duration: 0.3 }}
                      className="rounded-lg p-3"
                      style={{ background: 'var(--ink-50)', border: '1px solid var(--ink-200)' }}
                    >
                      <p className="text-[10px] font-bold uppercase tracking-[0.1em] mb-1" style={{ color: 'var(--brand-primary)' }}>{slide.label}</p>
                      <p className="text-[12px]" style={{ color: 'var(--ink-600)' }}>{slide.text}</p>
                    </motion.div>
                  ))}
                  {typedIndex >= SAMPLE_SLIDES.length && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="badge badge-brand mt-2"
                      data-testid="demo-content-score"
                    >
                      Virality Score: 91/100
                    </motion.div>
                  )}
                </motion.div>
              )}
            </div>
          </motion.div>

          {/* Right Panel — Template Preview */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="card-base p-8"
            data-testid="demo-funnel-preview"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #7C3AED, #A78BFA)' }}>
                <Layers className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-[15px]" style={{ color: 'var(--ink-800)', fontFamily: 'var(--font-display)' }}>Real-Time Slide Editor</h3>
                <p className="text-[12px]" style={{ color: 'var(--ink-400)' }}>Click any element to edit</p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Slide preview */}
              <div className="rounded-xl overflow-hidden" style={{ background: `linear-gradient(135deg, ${TEMPLATE_PREVIEWS[activeTemplate].colors[0]}, ${TEMPLATE_PREVIEWS[activeTemplate].colors[1]})`, padding: '24px' }}>
                <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: 'rgba(255,255,255,0.6)' }}>SLIDE 1 — HOOK</p>
                <p className="font-bold text-[15px] text-white leading-snug">Nobody tells you this about growing on LinkedIn...</p>
                <div className="mt-3 flex items-center gap-2">
                  <Wand2 className="w-3.5 h-3.5 text-white/60" />
                  <span className="text-[11px] text-white/60">Click to edit · AI improve</span>
                </div>
              </div>

              {/* Template selector */}
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.1em] mb-2" style={{ color: 'var(--ink-400)' }}>CHOOSE TEMPLATE</p>
                <div className="flex gap-2">
                  {TEMPLATE_PREVIEWS.map((t, i) => (
                    <button
                      key={t.name}
                      onClick={() => setActiveTemplate(i)}
                      className="flex-1 rounded-lg p-2 transition-all"
                      style={{
                        border: `2px solid ${activeTemplate === i ? 'var(--brand-primary)' : 'var(--ink-200)'}`,
                      }}
                      data-testid={`demo-template-${i}`}
                    >
                      <div className="h-6 rounded-md mb-1" style={{ background: `linear-gradient(135deg, ${t.colors[0]}, ${t.colors[1]})` }} />
                      <p className="text-[9px] font-semibold" style={{ color: activeTemplate === i ? 'var(--brand-primary)' : 'var(--ink-400)' }}>{t.name}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Platform export */}
              <div className="rounded-xl p-4" style={{ background: 'var(--ink-50)', border: '1px solid var(--ink-200)' }}>
                <p className="text-[10px] font-semibold uppercase tracking-[0.1em] mb-3" style={{ color: 'var(--ink-400)' }}>EXPORT FOR PLATFORM</p>
                <div className="flex gap-2 flex-wrap">
                  {['Instagram', 'LinkedIn', 'TikTok', 'Threads'].map(p => (
                    <span key={p} className="px-2.5 py-1 rounded-lg text-[11px] font-semibold"
                      style={{ background: 'var(--brand-soft)', color: 'var(--brand-primary)', border: '1px solid rgba(91,63,232,0.15)' }}>
                      {p}
                    </span>
                  ))}
                </div>
              </div>

              <button
                className="btn-primary w-full justify-center"
                data-testid="demo-get-access-btn"
              >
                Start Creating Free →
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
