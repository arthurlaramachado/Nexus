import { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
  title?: string
  headerAction?: ReactNode
}

export default function Card({ children, title, headerAction, className = '' }: CardProps) {
  return (
    <div className={`bg-white shadow-[var(--shadow-card)] rounded-xl border border-[#E4E4E8] ${className}`}>
      {title && (
        <div className="px-6 py-5 border-b border-[#E4E4E8] flex justify-between items-center">
          <h3 className="text-[18px] font-semibold text-[#1A1A2E]">{title}</h3>
          {headerAction && <div>{headerAction}</div>}
        </div>
      )}
      <div className="px-6 py-5">{children}</div>
    </div>
  )
}
