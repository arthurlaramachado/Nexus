import { ReactNode } from 'react'
import Sidebar from '@/components/layout/Sidebar'
import MobileLayout from '@/components/layout/MobileLayout'
import { getFilteredNavigationSerializable } from '@/lib/navigation'
import { getUserCollaborator } from '@/lib/auth/helpers'

export default async function MainLayout({ children }: { children: ReactNode }) {
  const collaborator = await getUserCollaborator()
  const navItems = await getFilteredNavigationSerializable()
  const userName = collaborator?.full_name || null
  const userEmail = collaborator?.email || null

  return (
    <div className="min-h-screen bg-[#F7F7F8]">
      <Sidebar />
      <MobileLayout
        navItems={navItems}
        userName={userName}
        userEmail={userEmail}
      />
      <main className="lg:ml-64 pt-16 lg:pt-6 px-6 pb-6 lg:px-8 lg:pb-8 transition-all duration-200">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  )
}
