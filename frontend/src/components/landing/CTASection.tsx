'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { ArrowRight, Shield } from 'lucide-react'
import Link from 'next/link'

export default function CTASection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-60px' })

  return (
    <section className="section relative overflow-hidden" data-testid="cta-section"
      style={{ background: 'radial-gradient(ellipse 70% 80% at 50% 50%, #1E1B4B 0%, #0A0B14 100%)' }}>
      {/* Floating orbs */}
      <div className="absolute top-1/4 left-1/4 w-[300px] h-[300px] rounded-full opacity-[0.15]"
        style={{ background: 'var(--brand-primary)', filter: 'blur(80px)' }} />
      <div className="absolute bottom-1/4 right-1/3 w-[250px] h-[250px] rounded-full opacity-[0.1]"
        style={{ background: '#4338CA', filter: 'blur(80px)' }} />
      <div className="absolute top-1/2 right-1/4 w-[200px] h-[200px] rounded-full opacity-[0.08]"
        style={{ background: '#8B5CF6', filter: 'blur(80px)' }} />

      <div className="container-main relative z-10" ref={ref}>
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center max-w-[640px] mx-auto"
        >
          <span className="badge badge-dark mb-6 inline-flex" data-testid="cta-badge">
            Join 2,000+ Creators
          </span>

          <h2 className="text-display text-white mb-5">
            Your content engine<br />
            for <span className="text-gradient-brand">consistent growth</span>
          </h2>

          <p className="text-[18px] mb-10" style={{ color: 'rgba(255,255,255,0.5)' }}>
            No design skills. No switching tools. Just scroll-stopping carousels.<br />
            Join 2,000+ creators already growing with CarouselEx.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 mb-8">
            <Link href="/signup">
              <button className="btn-primary btn-lg" data-testid="cta-start-free-btn">
                Create Your First Carousel Free <ArrowRight className="w-4 h-4" />
              </button>
            </Link>
            <Link href="/pricing">
              <button className="btn-ghost btn-lg" data-testid="cta-view-pricing-btn">
                View Pricing
              </button>
            </Link>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 text-[13px]" style={{ color: 'rgba(255,255,255,0.4)' }}>
            <span className="flex items-center gap-1.5"><Shield className="w-3.5 h-3.5" /> No credit card required</span>
            <span>Cancel anytime</span>
            <span>Ready in under 3 minutes</span>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
