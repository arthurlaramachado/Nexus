'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ReactNode } from 'react'

interface NavItemProps {
  label: string
  href: string
  icon: ReactNode
  onClick?: () => void
}

export default function NavItem({ label, href, icon, onClick }: NavItemProps) {
  const pathname = usePathname()
  const isDashboardRoot = href === '/dashboard'
  const isActive = isDashboardRoot
    ? pathname === '/dashboard'
    : pathname === href || pathname.startsWith(href + '/')

  return (
    <Link
      href={href}
      onClick={onClick}
      className={`
        flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-colors
        ${
          isActive
            ? 'bg-white/8 text-white border-l-[3px] border-[#F0C14B]'
            : 'text-[#A8A8BB] hover:bg-white/5 hover:text-white border-l-[3px] border-transparent'
        }
      `}
    >
      {icon}
      <span>{label}</span>
    </Link>
  )
}
