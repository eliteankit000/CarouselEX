'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle, ArrowRight, Shield, Star, Check } from 'lucide-react'
import Link from 'next/link'

export const PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    price: { monthly: '$0', annual: '$0' },
    period: '/month',
    description: 'Perfect for getting started',
    features: [
      '5 AI carousel generations/month',
      '3 premium templates',
      'Basic slide editor',
      'Export for 1 platform',
      'Carousel library (20 carousels)',
      'Email support (72hr response)',
      'CarouselEx watermark on exports',
    ],
    cta: 'Get Started Free',
    highlighted: false,
    badge: null as string | null,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: { monthly: '$10', annual: '$7' },
    period: '/month',
    annualSave: 'Save 40% annually → $7/mo',
    description: 'For serious content creators',
    features: [
      'Unlimited carousel generations',
      'All premium templates',
      'Full real-time slide editor',
      'Export for all 4 platforms',
      'Unlimited carousel library',
      'Brand Kit (colors, fonts, logo)',
      'Smart content optimizer',
      'Virality scoring',
      'Remove CarouselEx watermark',
      'Video URL → Carousel feature',
      'Priority email support (24hr)',
    ],
    cta: 'Start Pro',
    highlighted: true,
    badge: 'Most Popular',
  },
  {
    id: 'growth',
    name: 'Growth',
    price: { monthly: '$25', annual: '$18' },
    period: '/month',
    annualSave: 'Save $84 annually → $18/mo',
    description: 'For teams & agencies',
    features: [
      'Everything in Pro',
      'Team access (5 seats)',
      'Advanced brand customization',
      'Bulk carousel generation',
      'White-label exports',
      'Advanced analytics & export',
      'API access',
      'Dedicated onboarding call',
      'Slack support channel',
      'Priority feature requests',
    ],
    cta: 'Get Started',
    highlighted: false,
    badge: null as string | null,
  },
]

export const TRUST_BADGES = [
  'Cancel anytime',
  'No credit card required',
  'Used by 2,000+ creators',
  '30-day money-back guarantee',
]

interface PricingCardsProps {
  currentPlan?: string
  onPlanAction?: (planId: string, action: 'upgrade' | 'downgrade') => void
  disableMotion?: boolean
}

export default function PricingCards({ currentPlan, onPlanAction, disableMotion }: PricingCardsProps) {
  const [annual, setAnnual] = useState(false)
  const isBillingMode = currentPlan !== undefined

  const planOrder = ['starter', 'pro', 'growth']
  const currentIdx = planOrder.indexOf(currentPlan || '')

  const getButtonConfig = (planId: string) => {
    if (!isBillingMode) {
      return { label: PLANS.find(p => p.id === planId)?.cta || 'Get Started', disabled: false, action: null }
    }
    if (planId === currentPlan) {
      return { label: 'Current Plan', disabled: true, action: null }
    }
    const targetIdx = planOrder.indexOf(planId)
    if (targetIdx > currentIdx) {
      return { label: `Upgrade to ${PLANS.find(p => p.id === planId)?.name}`, disabled: false, action: 'upgrade' as const }
    }
    return { label: `Downgrade to ${PLANS.find(p => p.id === planId)?.name}`, disabled: false, action: 'downgrade' as const }
  }

  const Wrapper = disableMotion ? 'div' : motion.div

  return (
    <div data-testid="pricing-cards-component">
      {/* Monthly / Annual Toggle */}
      <div className="flex items-center justify-center gap-4 mb-10" data-testid="pricing-toggle">
        <span className={`text-[15px] font-semibold transition-colors ${!annual ? 'text-[var(--ink-900)]' : 'text-[var(--ink-400)]'}`}>Monthly</span>
        <button
          onClick={() => setAnnual(!annual)}
          className="relative w-14 h-8 rounded-full transition-colors"
          style={{ background: annual ? 'var(--brand-primary)' : 'var(--ink-200)' }}
          data-testid="pricing-toggle-btn"
        >
          <div className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-md transition-transform ${annual ? 'translate-x-7' : 'translate-x-1'}`} />
        </button>
        <span className={`text-[15px] font-semibold transition-colors ${annual ? 'text-[var(--ink-900)]' : 'text-[var(--ink-400)]'}`}>
          Annual
        </span>
        {annual && (
          <span className="badge badge-green text-[11px]">
            Save 40%
          </span>
        )}
      </div>

      {/* Plan Cards */}
      <div className="max-w-[1000px] mx-auto">
        <div className="grid md:grid-cols-3 gap-5 items-start">
          {PLANS.map((plan, idx) => {
            const btn = getButtonConfig(plan.id)
            const isActive = isBillingMode && plan.id === currentPlan

            const cardProps = disableMotion ? {} : {
              initial: { opacity: 0, y: 32 },
              animate: { opacity: 1, y: 0 },
              transition: { duration: 0.5, delay: idx * 0.1 },
            }

            return (
              <Wrapper
                key={plan.name}
                {...(cardProps as any)}
                className={`bg-white rounded-[var(--radius-xl)] flex flex-col relative transition-all ${
                  plan.highlighted
                    ? 'border-2 border-[var(--brand-primary)] shadow-brand md:scale-[1.03] z-10'
                    : 'border border-[var(--ink-200)] shadow-card hover:shadow-card-hover hover:-translate-y-1'
                } ${isActive ? 'ring-2 ring-[var(--green-500)] ring-offset-2' : ''}`}
                data-testid={`plan-card-${plan.id}`}
              >
                {plan.highlighted && plan.badge && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-white px-4 py-[5px] rounded-full shadow-brand"
                      style={{ background: 'var(--brand-gradient)' }}>
                      <Star className="w-3 h-3 fill-white" /> {plan.badge}
                    </span>
                  </div>
                )}

                {isActive && (
                  <div className="absolute -top-3.5 right-4">
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-white px-3 py-[5px] rounded-full"
                      style={{ background: 'linear-gradient(135deg, #10B981, #059669)' }}>
                      <Check className="w-3 h-3" /> Active
                    </span>
                  </div>
                )}

                <div className="p-8 flex-1 flex flex-col">
                  <div className="mb-6">
                    <h3 className="text-[18px] font-bold" style={{ color: 'var(--ink-800)', fontFamily: 'var(--font-display)' }}>{plan.name}</h3>
                    <p className="text-[13px] mt-1" style={{ color: 'var(--ink-400)' }}>{plan.description}</p>
                  </div>

                  <div className="mb-2">
                    <span className="text-[48px] font-extrabold tracking-[-0.04em] leading-none" style={{ color: 'var(--ink-900)', fontFamily: 'var(--font-display)' }}>
                      {annual ? plan.price.annual : plan.price.monthly}
                    </span>
                    <span className="text-[14px] ml-1" style={{ color: 'var(--ink-400)' }}>{plan.period}</span>
                  </div>

                  {plan.annualSave && annual && (
                    <p className="text-[12px] font-medium mb-6" style={{ color: 'var(--green-500)' }}>{plan.annualSave}</p>
                  )}
                  {(!plan.annualSave || !annual) && <div className="mb-6" />}

                  <ul className="space-y-3 mb-8 flex-1">
                    {plan.features.map(f => (
                      <li key={f} className="flex items-start gap-3 text-[13px]" style={{ color: 'var(--ink-600)' }}>
                        <CheckCircle className="w-[17px] h-[17px] mt-[1px] shrink-0" style={{ color: plan.highlighted ? 'var(--brand-primary)' : 'var(--ink-400)' }} />
                        {f}
                      </li>
                    ))}
                  </ul>

                  {btn.disabled ? (
                    <div className="w-full py-[13px] rounded-[var(--radius-xl)] text-center text-[14px] font-semibold border-[1.5px] flex items-center justify-center gap-2"
                      style={{ color: 'var(--green-500)', borderColor: 'rgba(16,185,129,0.3)', background: 'var(--green-50)' }}
                      data-testid={`plan-cta-${plan.id}`}>
                      <Check className="w-4 h-4" /> Current Plan
                    </div>
                  ) : isBillingMode ? (
                    <button
                      onClick={() => onPlanAction?.(plan.id, btn.action as 'upgrade' | 'downgrade')}
                      className={`w-full ${plan.highlighted ? 'btn-primary' : 'btn-secondary'} justify-center`}
                      data-testid={`plan-cta-${plan.id}`}
                    >
                      {btn.label} {plan.highlighted && <ArrowRight className="w-3.5 h-3.5" />}
                    </button>
                  ) : (
                    <Link href="/signup" className="w-full">
                      <button
                        className={`w-full ${plan.highlighted ? 'btn-primary' : 'btn-secondary'} justify-center`}
                        data-testid={`plan-cta-${plan.id}`}
                      >
                        {btn.label} {plan.highlighted && <ArrowRight className="w-3.5 h-3.5" />}
                      </button>
                    </Link>
                  )}
                </div>
              </Wrapper>
            )
          })}
        </div>

        {/* Trust badges */}
        <div className="flex flex-wrap items-center justify-center gap-6 mt-10">
          {TRUST_BADGES.map(t => (
            <span key={t} className="flex items-center gap-1.5 text-[12px]" style={{ color: 'var(--ink-400)' }}>
              <Shield className="w-3.5 h-3.5" style={{ color: 'var(--ink-200)' }} /> {t}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
