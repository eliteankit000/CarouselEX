'use client'

import { useState, useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { ChevronDown, ArrowRight, Sparkles, X, Check } from 'lucide-react'
import Link from 'next/link'
import CustomCursor from '@/components/landing/CustomCursor'
import Navbar from '@/components/landing/Navbar'
import Footer from '@/components/landing/Footer'
import PricingCards from '@/components/pricing/PricingCards'

const comparison = [
  { feature: 'Content generation', starter: '5/month', pro: 'Unlimited', growth: 'Unlimited' },
  { feature: 'Funnels', starter: '1', pro: '10', growth: 'Unlimited' },
  { feature: 'Leads storage', starter: '50', pro: '5,000', growth: 'Unlimited' },
  { feature: 'Analytics', starter: 'Basic', pro: 'Basic', growth: 'Advanced' },
  { feature: 'Carousel generator', starter: 'Basic', pro: 'Advanced', growth: 'Advanced' },
  { feature: 'Poll generator', starter: '—', pro: 'Yes', growth: 'Yes' },
  { feature: 'Content scoring', starter: '—', pro: 'Yes', growth: 'Yes' },
  { feature: 'A/B hook testing', starter: '—', pro: 'Yes', growth: 'Yes' },
  { feature: 'Custom domain', starter: '—', pro: 'Yes', growth: 'Yes' },
  { feature: 'Remove branding', starter: '—', pro: 'Yes', growth: 'Yes' },
  { feature: 'Multi-channel capture', starter: '—', pro: '—', growth: 'Yes' },
  { feature: 'WhatsApp integration', starter: '—', pro: '—', growth: 'Yes' },
  { feature: 'White-label', starter: '—', pro: '—', growth: 'Yes' },
  { feature: 'Team access', starter: '—', pro: '—', growth: 'Up to 5' },
  { feature: 'API access', starter: '—', pro: '—', growth: 'Yes' },
  { feature: 'Zapier/Make', starter: '—', pro: 'Yes', growth: 'Yes' },
  { feature: 'Dedicated onboarding', starter: '—', pro: '—', growth: 'Yes' },
  { feature: 'Priority support', starter: '—', pro: '24hr', growth: 'Slack + 4hr' },
]

const faqs = [
  { q: 'Is there really a free plan?', a: 'Yes! The Starter plan is free forever. No credit card required. You get 5 AI content generations per month, 1 funnel, and up to 50 leads stored. Upgrade only when you\'re ready.' },
  { q: 'What happens when I hit my lead storage limit?', a: 'You won\'t lose any leads — we\'ll notify you and pause new captures. Upgrade to Pro for 5,000 leads or Growth for unlimited. You can export all leads at any time.' },
  { q: 'Can I cancel anytime?', a: 'Absolutely. Cancel your subscription in one click from your account dashboard. No questions asked, no cancellation fees. You keep access until the end of your billing period.' },
  { q: 'Do you offer a money-back guarantee?', a: 'Yes — 30 days, no questions asked. If CarouselEx doesn\'t work for you in the first 30 days, email us for a full refund.' },
  { q: 'What platforms does the content work for?', a: 'Our AI is optimized for LinkedIn, X (Twitter), and Instagram. We output format-specific content for each platform (character limits, hashtag strategies, carousel formats).' },
  { q: 'How does the funnel builder work?', a: 'You create a landing page that delivers immediate value (a template, checklist, quick win) before gating contact info. Visitors experience the value, then willingly share their email. No hard selling.' },
  { q: 'Does CarouselEx integrate with my CRM?', a: 'Pro and Growth plans include Zapier and Make integration, connecting to HubSpot, Mailchimp, Salesforce, Notion, Airtable, and 5,000+ other apps. Growth includes API access for custom integrations.' },
  { q: 'What\'s the difference between the carousel and poll generators?', a: 'The carousel generator creates multi-slide LinkedIn/IG content with hooks and CTAs. The poll generator creates engagement-driving question posts that feed leads into your funnel. Both are available on Pro+.' },
  { q: 'Can I use CarouselEx for my clients (agency use)?', a: 'Yes! The Growth plan includes 5 team seats and white-label funnels. Your clients will see your branding, not ours. Additional seats available on request.' },
  { q: 'How fast can I see results?', a: 'Most users capture their first leads within 48 hours. Average users see 50+ leads in their first week and consistent results by week 3.' },
]

const competitors = [
  { feature: 'AI Content Gen', carouselex: 'Unlimited', a: 'Limited', b: 'Unlimited', c: '20/mo' },
  { feature: 'Funnel Builder', carouselex: 'Built-in', a: 'Separate $', b: 'Basic only', c: 'Yes' },
  { feature: 'Lead Capture', carouselex: 'Auto', a: 'Manual', b: 'Yes', c: 'No' },
  { feature: 'Content Scoring', carouselex: 'Yes', a: 'No', b: 'No', c: 'No' },
  { feature: 'CRM Integration', carouselex: 'Zapier', a: 'Limited', b: 'Yes', c: 'No' },
  { feature: 'Platform Optimize', carouselex: 'LI + X + IG', a: 'LinkedIn only', b: 'Yes', c: 'No' },
  { feature: 'Price', carouselex: '$10/mo', a: '$49/mo', b: '$79/mo', c: '$29/mo' },
]

export default function PricingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const heroRef = useRef(null)
  const heroInView = useInView(heroRef, { once: true })
  const compareRef = useRef(null)
  const compareInView = useInView(compareRef, { once: true, margin: '-60px' })
  const faqRef = useRef(null)
  const faqInView = useInView(faqRef, { once: true, margin: '-60px' })
  const compRef = useRef(null)
  const compInView = useInView(compRef, { once: true, margin: '-60px' })

  return (
    <main style={{ background: 'var(--bg-page)' }} data-testid="pricing-page">
      <CustomCursor />
      <Navbar />

      {/* Hero */}
      <section className="pt-[140px] pb-16 relative overflow-hidden" data-testid="pricing-hero" ref={heroRef}>
        <div className="absolute inset-0" style={{
          background: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(91,63,232,0.08) 0%, transparent 70%)'
        }} />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={heroInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="container-main text-center relative"
        >
          <span className="badge badge-brand mb-6 inline-flex">
            <Sparkles className="w-3 h-3" /> Pricing
          </span>
          <h1 className="text-display mb-4" style={{ color: 'var(--ink-900)' }} data-testid="pricing-heading">
            Simple, transparent pricing
          </h1>
          <p className="text-[18px] max-w-xl mx-auto mb-10" style={{ color: 'var(--ink-400)' }}>
            No hidden fees. No surprise charges. Start free, upgrade when you're ready.
          </p>
        </motion.div>
      </section>

      {/* Pricing Cards — shared component */}
      <section className="pb-24 px-4 sm:px-8" data-testid="pricing-cards">
        <PricingCards />
      </section>

      {/* Compare Plans */}
      <section className="section bg-white" style={{ borderTop: '1px solid var(--ink-200)', borderBottom: '1px solid var(--ink-200)' }}
        data-testid="compare-plans" ref={compareRef}>
        <div className="max-w-[960px] mx-auto px-4 sm:px-8">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={compareInView ? { opacity: 1, y: 0 } : {}}
            className="text-h2 text-center mb-14" style={{ color: 'var(--ink-900)' }}
          >
            Compare plans
          </motion.h2>
          <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--ink-200)', background: 'var(--ink-50)' }}>
            <div className="overflow-x-auto">
              <table className="w-full" data-testid="compare-table">
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--ink-200)' }}>
                    <th className="text-left px-6 py-5 text-[11px] font-bold uppercase tracking-[0.12em]" style={{ color: 'var(--ink-800)' }}>Feature</th>
                    <th className="text-center px-5 py-5 text-[11px] font-bold uppercase tracking-[0.12em]" style={{ color: 'var(--ink-400)' }}>Starter</th>
                    <th className="text-center px-5 py-5 text-[11px] font-bold uppercase tracking-[0.12em]" style={{ color: 'var(--brand-primary)', background: 'rgba(91,63,232,0.03)' }}>Pro</th>
                    <th className="text-center px-5 py-5 text-[11px] font-bold uppercase tracking-[0.12em]" style={{ color: 'var(--ink-400)' }}>Growth</th>
                  </tr>
                </thead>
                <tbody>
                  {comparison.map((row, i) => (
                    <tr key={row.feature} style={{
                      borderBottom: '1px solid var(--ink-100)',
                      background: i % 2 === 0 ? 'white' : 'var(--ink-50)',
                    }}>
                      <td className="px-6 py-4 text-[13px] font-medium" style={{ color: 'var(--ink-800)' }}>{row.feature}</td>
                      <td className="px-5 py-4 text-[13px] text-center" style={{ color: row.starter === '—' ? 'var(--ink-200)' : 'var(--ink-400)' }}>{row.starter}</td>
                      <td className="px-5 py-4 text-[13px] text-center font-semibold" style={{ color: row.pro === '—' ? 'var(--ink-200)' : 'var(--ink-800)', background: 'rgba(91,63,232,0.015)' }}>{row.pro}</td>
                      <td className="px-5 py-4 text-[13px] text-center" style={{ color: row.growth === '—' ? 'var(--ink-200)' : 'var(--ink-800)' }}>{row.growth}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="section" data-testid="faq-section" ref={faqRef}>
        <div className="max-w-[640px] mx-auto px-4 sm:px-8">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={faqInView ? { opacity: 1, y: 0 } : {}}
            className="text-h2 text-center mb-14" style={{ color: 'var(--ink-900)' }}
          >
            Frequently asked questions
          </motion.h2>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 16 }}
                animate={faqInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: i * 0.04 }}
                className="bg-white rounded-2xl overflow-hidden transition-all"
                style={{
                  border: openFaq === i ? '1px solid rgba(91,63,232,0.2)' : '1px solid var(--ink-200)',
                  boxShadow: openFaq === i ? '0 0 0 1px rgba(91,63,232,0.08), 0 4px 24px rgba(91,63,232,0.08)' : 'var(--shadow-sm)',
                }}
                data-testid={`faq-item-${i}`}
              >
                <button
                  className="w-full flex items-center justify-between px-6 py-5 text-left"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  data-testid={`faq-toggle-${i}`}
                >
                  <span className="text-[15px] font-semibold pr-4" style={{ color: 'var(--ink-800)' }}>{faq.q}</span>
                  <ChevronDown
                    className="w-[18px] h-[18px] shrink-0 transition-transform duration-300"
                    style={{ color: openFaq === i ? 'var(--brand-primary)' : 'var(--ink-400)', transform: openFaq === i ? 'rotate(180deg)' : 'rotate(0deg)' }}
                  />
                </button>
                <div
                  className="overflow-hidden transition-all duration-300"
                  style={{ maxHeight: openFaq === i ? '500px' : '0px', opacity: openFaq === i ? 1 : 0 }}
                >
                  <div className="px-6 pb-5">
                    <p className="text-[14px] leading-[1.7]" style={{ color: 'var(--ink-600)' }}>{faq.a}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Competitor Comparison */}
      <section className="section bg-white" style={{ borderTop: '1px solid var(--ink-200)', borderBottom: '1px solid var(--ink-200)' }}
        data-testid="competitor-comparison" ref={compRef}>
        <div className="max-w-[960px] mx-auto px-4 sm:px-8">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={compInView ? { opacity: 1, y: 0 } : {}}
            className="text-h2 text-center mb-14" style={{ color: 'var(--ink-900)' }}
          >
            How we compare
          </motion.h2>
          <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--ink-200)', background: 'var(--ink-50)' }}>
            <div className="overflow-x-auto">
              <table className="w-full" data-testid="competitor-table">
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--ink-200)' }}>
                    <th className="text-left px-6 py-5 text-[11px] font-bold uppercase tracking-[0.12em]" style={{ color: 'var(--ink-800)' }}></th>
                    <th className="text-center px-5 py-5 text-[11px] font-bold uppercase tracking-[0.12em]" style={{ color: 'var(--brand-primary)', background: 'rgba(91,63,232,0.03)' }}>CarouselEx Pro<br /><span className="font-normal text-[10px]" style={{ color: 'var(--ink-400)' }}>($10/mo)</span></th>
                    <th className="text-center px-5 py-5 text-[11px] font-bold uppercase tracking-[0.12em]" style={{ color: 'var(--ink-400)' }}>Content Tool<br /><span className="font-normal text-[10px]">($49/mo)</span></th>
                    <th className="text-center px-5 py-5 text-[11px] font-bold uppercase tracking-[0.12em]" style={{ color: 'var(--ink-400)' }}>Funnel Tool<br /><span className="font-normal text-[10px]">($79/mo)</span></th>
                    <th className="text-center px-5 py-5 text-[11px] font-bold uppercase tracking-[0.12em]" style={{ color: 'var(--ink-400)' }}>AI Writer<br /><span className="font-normal text-[10px]">($29/mo)</span></th>
                  </tr>
                </thead>
                <tbody>
                  {competitors.map((row, i) => (
                    <tr key={row.feature} style={{
                      borderBottom: '1px solid var(--ink-100)',
                      background: i % 2 === 0 ? 'white' : 'var(--ink-50)',
                    }}>
                      <td className="px-6 py-4 text-[13px] font-medium" style={{ color: 'var(--ink-800)' }}>{row.feature}</td>
                      <td className="px-5 py-4 text-[13px] text-center font-semibold" style={{ color: 'var(--green-500)', background: 'rgba(91,63,232,0.015)' }}>
                        <span className="flex items-center justify-center gap-1"><Check className="w-3.5 h-3.5" /> {row.carouselex}</span>
                      </td>
                      <td className="px-5 py-4 text-[13px] text-center" style={{ color: row.a.startsWith('No') || row.a.startsWith('Manual') || row.a.startsWith('Limited') || row.a.startsWith('Separate') ? 'var(--red-500)' : 'var(--ink-600)' }}>
                        {(row.a.startsWith('No') || row.a.startsWith('Manual') || row.a.startsWith('Limited') || row.a.startsWith('Separate')) ? <span className="flex items-center justify-center gap-1"><X className="w-3.5 h-3.5" /> {row.a}</span> : row.a}
                      </td>
                      <td className="px-5 py-4 text-[13px] text-center" style={{ color: row.b.startsWith('No') || row.b.startsWith('Basic') ? 'var(--ink-400)' : 'var(--ink-600)' }}>
                        {row.b.startsWith('No') ? <span className="flex items-center justify-center gap-1"><X className="w-3.5 h-3.5 text-[var(--red-500)]" /> {row.b}</span> : row.b}
                      </td>
                      <td className="px-5 py-4 text-[13px] text-center" style={{ color: row.c.startsWith('No') || row.c === '20/mo' ? 'var(--red-500)' : 'var(--ink-600)' }}>
                        {row.c.startsWith('No') ? <span className="flex items-center justify-center gap-1"><X className="w-3.5 h-3.5" /> {row.c}</span> : row.c}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section section-dark relative overflow-hidden" data-testid="pricing-cta">
        <div className="absolute top-1/4 left-1/3 w-[250px] h-[250px] rounded-full opacity-[0.12]"
          style={{ background: 'var(--brand-primary)', filter: 'blur(80px)' }} />
        <div className="container-main relative z-10 text-center">
          <h2 className="text-h2 text-white mb-4">Ready to grow?</h2>
          <p className="text-[18px] mb-10" style={{ color: 'rgba(255,255,255,0.5)' }}>
            Join thousands of creators generating leads with AI-powered content.
          </p>
          <Link href="/signup">
            <button className="btn-primary btn-lg" data-testid="pricing-final-cta-btn">
              Start Free <ArrowRight className="w-4 h-4" />
            </button>
          </Link>
          <p className="text-[12px] mt-6" style={{ color: 'rgba(255,255,255,0.4)' }}>No credit card required</p>
        </div>
      </section>

      <Footer />
    </main>
  )
}
