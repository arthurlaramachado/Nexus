interface LogoProps {
  className?: string
  size?: 'sm' | 'md' | 'lg'
  variant?: 'dark' | 'light'
}

const sizeClasses = {
  sm: 'text-base',
  md: 'text-lg',
  lg: 'text-xl',
}

export default function Logo({ className = '', size = 'md', variant = 'dark' }: LogoProps) {
  const variantClass = variant === 'dark' ? 'text-white' : 'text-[#1A1A2E]'

  return (
    <div className={`font-bold ${sizeClasses[size]} ${className}`}>
      <span className={variantClass}>
        Nexus
      </span>
    </div>
  )
}
