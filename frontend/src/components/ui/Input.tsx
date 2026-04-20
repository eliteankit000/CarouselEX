import { cn } from '@/utils'
import { InputHTMLAttributes, TextareaHTMLAttributes, forwardRef } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, ...props }, ref) => {
    return (
      <div className="space-y-1.5">
        {label && <label htmlFor={id} className="block text-sm font-medium text-txt-primary">{label}</label>}
        <input
          ref={ref}
          id={id}
          className={cn(
            'w-full px-4 py-2.5 text-sm text-txt-primary bg-white border border-border rounded-xl transition-all duration-150 placeholder:text-txt-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary',
            error && 'border-red-400 focus:ring-red-200 focus:border-red-400',
            className
          )}
          {...props}
        />
        {error && <p className="text-xs text-red-500">{error}</p>}
      </div>
    )
  }
)
Input.displayName = 'Input'

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, id, ...props }, ref) => {
    return (
      <div className="space-y-1.5">
        {label && <label htmlFor={id} className="block text-sm font-medium text-txt-primary">{label}</label>}
        <textarea
          ref={ref}
          id={id}
          className={cn(
            'w-full px-4 py-2.5 text-sm text-txt-primary bg-white border border-border rounded-xl transition-all duration-150 placeholder:text-txt-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none',
            error && 'border-red-400 focus:ring-red-200 focus:border-red-400',
            className
          )}
          {...props}
        />
        {error && <p className="text-xs text-red-500">{error}</p>}
      </div>
    )
  }
)
Textarea.displayName = 'Textarea'

export default Input
