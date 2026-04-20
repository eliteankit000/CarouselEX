'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { X, CheckCircle } from 'lucide-react'

const problems = [
  { text: 'Writing in one tool, designing in another', sub: 'Constant tab switching kills your flow' },
  { text: 'Hours wasted on layout & formatting', sub: 'And the result still feels average' },
  { text: 'No idea if your content will perform', sub: 'You post and hope — with no real signal' },
]

const solutions = [
  { text: 'AI writes your entire carousel instantly', sub: 'Hook, value slides & CTA — done in seconds' },
  { text: 'Edit live with premium design templates', sub: 'Click any element — change it immediately' },
  { text: 'Built-in scoring before you post', sub: 'Know your virality potential — guaranteed better results' },
]

export default function ProblemSolutionSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-60px' })

  return (
    <section className="section" data-testid="problem-solution-section">
      <div className="container-main" ref={ref}>
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <p className="section-label mb-3" data-testid="problem-solution-label">WHY CAROUSELEX</p>
          <h2 className="text-h2 mb-4" style={{ color: 'var(--ink-900)' }}>Carousel creation is broken</h2>
          <p className="text-[18px]" style={{ color: 'var(--ink-400)' }}>
            You're juggling multiple tools and hours of work — and still getting average results.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Problem column */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="space-y-5"
          >
            <span className="badge badge-red" data-testid="problem-badge">
              <X className="w-3 h-3" /> THE PROBLEM
            </span>
            <div className="space-y-3">
              {problems.map((item, i) => (
                <motion.div
                  key={item.text}
                  initial={{ opacity: 0, x: -20 }}
                  animate={isInView ? { opacity: 1, x: 0 } : {}}
                  transition={{ duration: 0.5, delay: 0.2 + i * 0.1 }}
                  className="flex items-start gap-4 p-5 rounded-2xl transition-colors group"
                  style={{
                    background: '#FFF9F9',
                    border: '1px solid rgba(239,68,68,0.2)',
                  }}
                  data-testid={`problem-card-${i}`}
                >
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors"
                    style={{ background: 'var(--red-50)', border: '1px solid rgba(239,68,68,0.15)' }}>
                    <X className="w-[18px] h-[18px]" style={{ color: 'var(--red-500)' }} />
                  </div>
                  <div>
                    <p className="text-[15px] font-semibold" style={{ color: 'var(--ink-800)' }}>{item.text}</p>
                    <p className="text-[13px] mt-1" style={{ color: 'var(--ink-400)' }}>{item.sub}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Solution column */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="space-y-5"
          >
            <span className="badge badge-green" data-testid="solution-badge">
              <CheckCircle className="w-3 h-3" /> THE SOLUTION
            </span>
            <div className="space-y-3">
              {solutions.map((item, i) => (
                <motion.div
                  key={item.text}
                  initial={{ opacity: 0, x: 20 }}
                  animate={isInView ? { opacity: 1, x: 0 } : {}}
                  transition={{ duration: 0.5, delay: 0.3 + i * 0.1 }}
                  className="flex items-start gap-4 p-5 rounded-2xl transition-colors group"
                  style={{
                    background: '#F0FDF8',
                    border: '1px solid rgba(16,185,129,0.2)',
                  }}
                  data-testid={`solution-card-${i}`}
                >
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors"
                    style={{ background: 'var(--green-50)', border: '1px solid rgba(16,185,129,0.15)' }}>
                    <CheckCircle className="w-[18px] h-[18px]" style={{ color: 'var(--green-500)' }} />
                  </div>
                  <div>
                    <p className="text-[15px] font-semibold" style={{ color: 'var(--ink-800)' }}>{item.text}</p>
                    <p className="text-[13px] mt-1" style={{ color: 'var(--ink-400)' }}>{item.sub}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
