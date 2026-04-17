interface BadgeProps {
  children: React.ReactNode
  variant?: 'active' | 'nearExpire' | 'expired' | 'draft' | 'ended' | 'inactive' | 'success' | 'warning' | 'danger' | 'info' | 'default'
  className?: string
}

const variants = {
  active: 'bg-[#DCFCE7] text-[#15803D]',
  nearExpire: 'bg-[#FEF9C3] text-[#854D0E]',
  expired: 'bg-[#FEE2E2] text-[#991B1B]',
  draft: 'bg-[#E0E7FF] text-[#3730A3]',
  ended: 'bg-[#F1F1F4] text-[#6B6B78]',
  inactive: 'bg-[#F1F1F4] text-[#9898A3]',
  // Semantic aliases (backward compatibility)
  success: 'bg-[#DCFCE7] text-[#15803D]',
  warning: 'bg-[#FEF9C3] text-[#854D0E]',
  danger: 'bg-[#FEE2E2] text-[#991B1B]',
  info: 'bg-[#DBEAFE] text-[#1D4ED8]',
  default: 'bg-[#F1F1F4] text-[#6B6B78]',
}

const DOT_VARIANTS = new Set(['active', 'success'])

export default function Badge({ children, variant = 'default', className = '' }: BadgeProps) {
  const hasDot = DOT_VARIANTS.has(variant)

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-[3px] rounded-full text-xs font-medium ${variants[variant]} ${className}`}
    >
      {hasDot && (
        <span
          data-dot=""
          className="w-1.5 h-1.5 rounded-full bg-[#22C55E]"
        />
      )}
      {children}
    </span>
  )
}
