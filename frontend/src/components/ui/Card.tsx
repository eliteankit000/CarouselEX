import { cn } from '@/utils'
import { HTMLAttributes, forwardRef } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padding?: 'none' | 'sm' | 'md' | 'lg'
  hover?: boolean
  glow?: boolean
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, padding = 'md', hover = false, glow = false, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'bg-white rounded-2xl transition-all duration-300 ease-out',
          'border border-[rgba(0,0,0,0.06)]',
          'shadow-[0_0_0_1px_rgba(0,0,0,0.02),0_1px_2px_rgba(0,0,0,0.03),0_4px_16px_rgba(0,0,0,0.03)]',
          padding === 'sm' && 'p-5',
          padding === 'md' && 'p-7',
          padding === 'lg' && 'p-9',
          padding === 'none' && '',
          hover && 'hover:translate-y-[-3px] hover:border-[rgba(0,0,0,0.1)] hover:shadow-[0_0_0_1px_rgba(0,0,0,0.04),0_4px_12px_rgba(0,0,0,0.04),0_16px_48px_rgba(0,0,0,0.06)] cursor-pointer',
          glow && 'shadow-glow-blue',
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)
Card.displayName = 'Card'
export default Card
