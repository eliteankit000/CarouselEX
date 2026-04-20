import { cn } from '@/utils'
import { ButtonHTMLAttributes, forwardRef } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled}
        className={cn(
          'inline-flex items-center justify-center font-semibold rounded-[12px] focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 ease-out select-none',
          variant === 'primary' &&
            'bg-gradient-to-r from-[#2563EB] via-[#4f46e5] to-[#7C3AED] text-white shadow-[0_1px_2px_rgba(0,0,0,0.06),0_4px_12px_rgba(37,99,235,0.28)] hover:shadow-[0_2px_4px_rgba(0,0,0,0.06),0_8px_24px_rgba(37,99,235,0.35)] hover:brightness-110 hover:translate-y-[-1px] active:translate-y-[0px] active:brightness-95 focus-visible:ring-[#2563EB]/40',
          variant === 'secondary' &&
            'bg-white text-[#0F172A] border border-[rgba(0,0,0,0.08)] shadow-[0_1px_2px_rgba(0,0,0,0.05)] hover:bg-[#FAFBFC] hover:border-[rgba(0,0,0,0.12)] hover:shadow-[0_2px_8px_rgba(0,0,0,0.08)] hover:translate-y-[-1px] active:translate-y-[0px] active:bg-[#F1F5F9] focus-visible:ring-[#94A3B8]/40',
          variant === 'ghost' &&
            'text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#0F172A] focus-visible:ring-[#94A3B8]/30',
          variant === 'danger' &&
            'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-[0_1px_2px_rgba(0,0,0,0.06),0_4px_12px_rgba(220,38,38,0.2)] hover:shadow-[0_2px_8px_rgba(220,38,38,0.3)] focus-visible:ring-red-400/40',
          size === 'sm' && 'px-4 py-[7px] text-[13px] gap-1.5 tracking-[-0.006em]',
          size === 'md' && 'px-5 py-[9px] text-[14px] gap-2 tracking-[-0.006em]',
          size === 'lg' && 'px-8 py-[13px] text-[15px] gap-2.5 tracking-[-0.006em]',
          className
        )}
        {...props}
      >
        {children}
      </button>
    )
  }
)
Button.displayName = 'Button'
export default Button
