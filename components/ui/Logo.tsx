interface LogoProps {
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

const sizeClasses = {
  sm: 'text-lg',
  md: 'text-xl',
  lg: 'text-2xl',
}

export default function Logo({ className = '', size = 'md' }: LogoProps) {
  return (
    <div className={`font-bold ${sizeClasses[size]} ${className}`}>
      <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
        Nexus
      </span>
    </div>
  )
}

