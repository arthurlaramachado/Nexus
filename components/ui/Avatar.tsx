import { getAvatarColor } from '@/lib/utils/avatar'

interface AvatarProps {
  name: string | null | undefined
  email?: string | null
  imageUrl?: string | null
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeClasses = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
}

export default function Avatar({
  name,
  email,
  imageUrl,
  size = 'md',
  className = '',
}: AvatarProps) {
  const displayName = name || email || 'User'
  const initials = name
    ? name
        .trim()
        .split(/\s+/)
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : email
    ? email[0].toUpperCase()
    : '?'

  const bgColor = getAvatarColor(displayName)
  const sizeClass = sizeClasses[size]

  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt={displayName}
        className={`${sizeClass} rounded-full object-cover ${className}`}
      />
    )
  }

  return (
    <div
      className={`${sizeClass} rounded-full flex items-center justify-center font-medium text-white ${className}`}
      style={{ backgroundColor: bgColor }}
      title={displayName}
    >
      {initials}
    </div>
  )
}

