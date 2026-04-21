'use client'

import { useState, lazy, Suspense } from 'react'
import { Wand2, Layers } from 'lucide-react'
import AIContentGenerator from '@/components/AIContentGenerator'
import SetupModal from '@/components/SetupModal'

const ViralCarouselIdeas = lazy(() => import('@/components/ViralCarouselIdeas'))

function SectionHead({
  eyebrow,
  title,
  subtitle,
  icon,
  testId,
}: {
  eyebrow: string
  title: string
  subtitle: string
  icon: React.ReactNode
  testId: string
}) {
  return (
    <div className="cx-sec-head" data-testid={testId}>
      <span className="cx-sec-icon">{icon}</span>
      <div>
        <div className="cx-sec-eyebrow">{eyebrow}</div>
        <h2 className="cx-sec-title">{title}</h2>
        <p className="cx-sec-sub">{subtitle}</p>
      </div>
    </div>
  )
}

export default function HomePage() {
  const [setupOpen, setSetupOpen] = useState(false)

  return (
    <>
      <div className="cx-main cx-section-stack" data-testid="home-page">
        <section className="cx-section cx-section-1" data-testid="section-ai-content">
          <SectionHead
            eyebrow="Feature • GPT-4o"
            title="AI Content Generator"
            subtitle="Upload media or enter a topic to generate optimized captions, hashtags & keywords."
            icon={<Wand2 width="18" height="18" />}
            testId="section-ai-content-header"
          />
          <AIContentGenerator />
        </section>

        <section className="cx-section cx-section-2" data-testid="section-viral-carousel-ideas">
          <SectionHead
            eyebrow="Feature • Trend-Aware"
            title="Viral Carousel Ideas"
            subtitle="7 trending ideas personalized for your platform and niche."
            icon={<Layers width="18" height="18" />}
            testId="section-viral-carousel-header"
          />
          <Suspense
            fallback={
              <div className="cx-grid-3" style={{ minHeight: 520 }}>
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="cx-skeleton" style={{ height: 220 }} />
                ))}
              </div>
            }
          >
            <ViralCarouselIdeas onOpenSetup={() => setSetupOpen(true)} />
          </Suspense>
        </section>
      </div>

      <SetupModal
        open={setupOpen}
        onOpen={() => setSetupOpen(true)}
        onClose={() => setSetupOpen(false)}
      />
    </>
  )
}
