'use client'

import { useEffect } from 'react'
import Logo from '@/components/ui/Logo'
import NavItem from '@/components/layout/NavItem'
import Avatar from '@/components/ui/Avatar'
import SignOutButton from '@/components/auth/SignOutButton'
import { SerializableNavItem } from '@/lib/navigation'
import { getIconForHref } from '@/lib/navigation-icons'

interface MobileSidebarProps {
  isOpen: boolean
  onClose: () => void
  navItems: SerializableNavItem[]
  userName: string | null
  userEmail: string | null
}

export default function MobileSidebar({
  isOpen,
  onClose,
  navItems,
  userName,
  userEmail,
}: MobileSidebarProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  return (
    <>
      {/* Backdrop */}
      <div
        className={`
          lg:hidden fixed inset-0 bg-[#1A1A2E]/40 backdrop-blur-sm z-40 transition-opacity duration-300
          ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}
        `}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sidebar */}
      <div
        className={`
          lg:hidden fixed left-0 top-0 h-full w-72 bg-[#1A1A2E] flex flex-col shadow-2xl z-50
          transform transition-transform duration-300
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Logo at top */}
        <div className="h-16 flex items-center px-4 py-5">
          <Logo size="lg" variant="dark" />
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-2 px-3">
          <div className="space-y-1">
            {navItems.map((item) => {
              const Icon = getIconForHref(item.href)
              return (
                <NavItem
                  key={item.href}
                  href={item.href}
                  label={item.name}
                  icon={<Icon className="w-4 h-4 flex-shrink-0" />}
                  onClick={onClose}
                />
              )
            })}
          </div>
        </nav>

        {/* User profile at bottom */}
        <div className="border-t border-white/8 p-4">
          <div className="flex items-center gap-3 mb-3">
            <Avatar
              name={userName}
              email={userEmail}
              size="md"
            />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-white truncate">
                {userName || 'User'}
              </div>
              {userEmail && (
                <div className="text-xs text-[#A8A8BB] truncate">
                  {userEmail}
                </div>
              )}
            </div>
          </div>
          <SignOutButton />
        </div>
      </div>
    </>
  )
}
