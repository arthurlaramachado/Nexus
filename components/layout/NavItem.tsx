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
  const isActive = pathname === href || pathname.startsWith(href + '/')

  return (
    <Link
      href={href}
      onClick={onClick}
      className={`
        flex items-center gap-3 px-4 py-3 rounded-lg transition-colors
        ${
          isActive
            ? 'bg-indigo-50 text-indigo-700 font-medium'
            : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
        }
      `}
    >
      {icon}
      <span>{label}</span>
    </Link>
  )
}
