import { ButtonHTMLAttributes, ReactNode } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline'
  size?: 'sm' | 'md' | 'lg' | 'icon'
  children: ReactNode
  loading?: boolean
}

export default function Button({
  variant = 'primary',
  size = 'md',
  children,
  className = '',
  loading = false,
  disabled,
  ...props
}: ButtonProps) {
  const baseStyles = 'rounded-lg font-medium transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 flex items-center justify-center'

  const sizes = {
    sm: 'px-3 py-[7px] text-[13px]',
    md: 'px-4 py-[9px] text-sm',
    lg: 'px-6 py-3 text-base',
    icon: 'p-2',
  }

  const variants = {
    primary: 'bg-[#1A1A2E] text-white hover:bg-[#12122A] focus:ring-[#1A1A2E]',
    secondary: 'bg-white text-[#1A1A2E] border border-[#E4E4E8] hover:bg-[#F7F7F8] focus:ring-[#9898A3]',
    ghost: 'bg-transparent text-[#6B6B78] hover:bg-[#F0F0F2] focus:ring-[#9898A3]',
    danger: 'bg-[#FEE2E2] text-[#991B1B] hover:bg-[#FCA5A5] focus:ring-red-500',
    outline: 'bg-white text-[#1A1A2E] border border-[#E4E4E8] hover:bg-[#F7F7F8] focus:ring-[#9898A3]',
  }

  return (
    <button
      className={`${baseStyles} ${sizes[size]} ${variants[variant]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <div className="flex items-center justify-center gap-1.5">
          <svg className="animate-spin h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          {children}
        </div>
      ) : (
        children
      )}
    </button>
  )
}
