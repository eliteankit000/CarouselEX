'use client'

import CustomCursor from '@/components/landing/CustomCursor'
import Navbar from '@/components/landing/Navbar'
import HeroSection from '@/components/landing/HeroSection'
import LogoStrip from '@/components/landing/LogoStrip'
import ProblemSolutionSection from '@/components/landing/ProblemSolutionSection'
import FeaturesSection from '@/components/landing/FeaturesSection'
import HowItWorksSection from '@/components/landing/HowItWorksSection'
import DemoSection from '@/components/landing/DemoSection'
import TestimonialsSection from '@/components/landing/TestimonialsSection'
import CTASection from '@/components/landing/CTASection'
import Footer from '@/components/landing/Footer'

export default function LandingPage() {
  return (
    <main style={{ background: 'var(--bg-page)' }} data-testid="landing-page">
      <CustomCursor />
      <Navbar />
      <HeroSection />
      <LogoStrip />
      <ProblemSolutionSection />
      <FeaturesSection />
      <HowItWorksSection />
      <DemoSection />
      <TestimonialsSection />
      <CTASection />
      <Footer />
    </main>
  )
}
