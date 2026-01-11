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
  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  // Prevent body scroll when sidebar is open
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
          lg:hidden fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 ease-in-out
          ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}
        `}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sidebar */}
      <div
        className={`
          lg:hidden fixed left-0 top-0 h-full w-72 bg-white border-r border-gray-200 flex flex-col shadow-2xl z-50
          transform transition-transform duration-300 cubic-bezier(0.4, 0, 0.2, 1)
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Logo at top */}
        <div className="h-16 flex items-center justify-center border-b border-gray-200 px-4">
          <Logo size="lg" />
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          <div className="space-y-1">
            {navItems.map((item) => {
              const Icon = getIconForHref(item.href)
              return (
                <NavItem
                  key={item.href}
                  href={item.href}
                  label={item.name}
                  icon={<Icon className="w-5 h-5 flex-shrink-0" />}
                  onClick={onClose}
                />
              )
            })}
          </div>
        </nav>

        {/* User profile at bottom */}
        <div className="border-t border-gray-200 p-4 bg-gray-50">
          <div className="flex items-center gap-3 mb-3">
            <Avatar
              name={userName}
              email={userEmail}
              size="md"
            />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-gray-900 truncate">
                {userName || 'User'}
              </div>
              {userEmail && (
                <div className="text-xs text-gray-500 truncate">
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
