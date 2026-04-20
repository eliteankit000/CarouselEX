import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#5B3FE8',
          light: '#8B5CF6',
          lighter: '#A78BFA',
          soft: '#EEF2FF',
        },
        ink: {
          900: '#0D0E14',
          800: '#1A1D2E',
          600: '#3D4064',
          400: '#6B7280',
          200: '#D1D5DB',
          100: '#F3F4F6',
          50: '#FAFAFA',
        },
        page: '#FAFBFF',
        section: '#F5F7FF',
        dark: '#0A0B14',
      },
      fontFamily: {
        display: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      borderRadius: {
        sm: '6px',
        md: '10px',
        lg: '16px',
        xl: '24px',
        '2xl': '32px',
      },
      boxShadow: {
        'brand': '0 8px 32px rgba(91,63,232,0.25)',
        'brand-lg': '0 12px 40px rgba(91,63,232,0.35)',
        'card': '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
        'card-hover': '0 4px 16px rgba(0,0,0,0.07), 0 2px 4px rgba(0,0,0,0.04)',
        'card-lg': '0 12px 40px rgba(0,0,0,0.10), 0 4px 12px rgba(0,0,0,0.06)',
      },
    },
  },
  plugins: [],
}
export default config
