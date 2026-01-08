'use client'

import { useState } from 'react'
import MobileMenuButton from '@/components/layout/MobileMenuButton'
import MobileSidebar from '@/components/layout/MobileSidebar'
import { SerializableNavItem } from '@/lib/navigation'

interface MobileLayoutProps {
  navItems: SerializableNavItem[]
  userName: string | null
  userEmail: string | null
}

export default function MobileLayout({
  navItems,
  userName,
  userEmail,
}: MobileLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  return (
    <>
      <MobileMenuButton
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        isOpen={isSidebarOpen}
      />
      <MobileSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        navItems={navItems}
        userName={userName}
        userEmail={userEmail}
      />
    </>
  )
}
