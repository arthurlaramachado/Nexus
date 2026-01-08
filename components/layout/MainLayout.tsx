import { ReactNode } from 'react'
import Sidebar from '@/components/layout/Sidebar'
import MobileLayout from '@/components/layout/MobileLayout'
import { getFilteredNavigationSerializable } from '@/lib/navigation'
import { getUserRoleName, getUserCollaborator } from '@/lib/auth/helpers'

export default async function MainLayout({ children }: { children: ReactNode }) {
  const roleName = await getUserRoleName()
  const collaborator = await getUserCollaborator()
  const navItems = getFilteredNavigationSerializable(roleName)
  const userName = collaborator?.full_name || null
  const userEmail = collaborator?.email || null

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <MobileLayout
        navItems={navItems}
        userName={userName}
        userEmail={userEmail}
      />
      <main className="lg:ml-64 pt-16 lg:pt-0 p-4 sm:p-6 transition-all duration-200 lg:pr-12">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  )
}
