'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Zap, Eye, EyeOff } from 'lucide-react'
import Button from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useAuth } from '@/lib/auth-context'

export default function SignupPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { signUp } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }
    setLoading(true)
    const result = await signUp(email, password, name)
    if (result.error) {
      setError(result.error)
      setLoading(false)
    } else {
      router.push('/dashboard')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] px-4 relative overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute top-1/4 right-1/4 w-[500px] h-[500px] bg-[#7C3AED]/[0.04] rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 left-1/4 w-[400px] h-[400px] bg-[#2563EB]/[0.04] rounded-full blur-[100px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
        className="w-full max-w-[420px] space-y-8 relative"
      >
        <div className="text-center">
          <Link href="/" className="inline-flex items-center gap-2.5 mb-10" data-testid="signup-logo">
            <div className="w-11 h-11 bg-gradient-primary rounded-xl flex items-center justify-center shadow-[0_4px_16px_rgba(37,99,235,0.3)]">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-txt-primary">CarouselEx</span>
          </Link>
          <h1 className="text-2xl font-bold text-txt-primary tracking-tight">Create your account</h1>
          <p className="text-sm text-txt-muted mt-2">Start generating leads with AI-powered content</p>
        </div>

        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-8 shadow-premium">
          <form onSubmit={handleSubmit} className="space-y-5" data-testid="signup-form">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-50 border border-red-100 text-red-600 text-sm px-4 py-3 rounded-xl"
                data-testid="signup-error"
              >
                {error}
              </motion.div>
            )}
            <Input
              label="Full Name"
              type="text"
              id="signup-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Doe"
              required
              data-testid="signup-name-input"
            />
            <Input
              label="Email"
              type="email"
              id="signup-email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              data-testid="signup-email-input"
            />
            <div className="relative">
              <Input
                label="Password"
                type={showPass ? 'text' : 'password'}
                id="signup-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min 6 characters"
                required
                data-testid="signup-password-input"
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-3.5 top-[38px] text-txt-muted hover:text-txt-secondary transition-colors"
                data-testid="signup-toggle-password"
              >
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <Button type="submit" className="w-full" disabled={loading} data-testid="signup-submit-btn">
              {loading ? 'Creating account...' : 'Create Account'}
            </Button>
          </form>
        </div>

        <p className="text-center text-sm text-txt-muted">
          Already have an account?{' '}
          <Link href="/login" className="text-primary font-semibold hover:underline" data-testid="signup-login-link">
            Sign in
          </Link>
        </p>
      </motion.div>
    </div>
  )
}
