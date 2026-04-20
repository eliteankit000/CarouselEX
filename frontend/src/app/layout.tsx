import type { Metadata } from 'next'
import './globals.css'
import { AuthProvider } from '@/lib/auth-context'
import { ToastProvider } from '@/lib/toast'
import { UserPreferencesProvider } from '@/context/UserPreferencesContext'

export const metadata: Metadata = {
  title: 'CarouselEx — The fastest way to create viral content on the internet',
  description: 'CarouselEx AI Content Studio — Generate viral carousels, posts, polls, and threads with AI-powered content intelligence.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body style={{ backgroundColor: 'var(--bg-page)' }}>
        <AuthProvider>
          <UserPreferencesProvider>
            <ToastProvider>
              {children}
            </ToastProvider>
          </UserPreferencesProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
