import { ReactNode } from 'react'
import Logo from '@/components/ui/Logo'
import NavItem from '@/components/layout/NavItem'
import Avatar from '@/components/ui/Avatar'
import SignOutButton from '@/components/auth/SignOutButton'
import { getFilteredNavigation } from '@/lib/navigation'
import { getUserRoleName, getUserCollaborator } from '@/lib/auth/helpers'

export default async function Sidebar() {
  const roleName = await getUserRoleName()
  const collaborator = await getUserCollaborator()
  const email = collaborator?.email || null
  const navItems = getFilteredNavigation(roleName)

  return (
    <div className="hidden lg:flex fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-200 flex-col shadow-sm z-50">
      {/* Logo at top */}
      <div className="h-16 flex items-center justify-center border-b border-gray-200 px-4">
        <Logo size="lg" />
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        <div className="space-y-1">
          {navItems.map((item) => (
            <NavItem 
              key={item.href} 
              href={item.href}
              label={item.name}
              icon={<item.icon className="w-5 h-5 flex-shrink-0" />} 
            />
          ))}
        </div>
      </nav>

      {/* User profile at bottom */}
      <div className="border-t border-gray-200 p-4 bg-gray-50">
        <div className="flex items-center gap-3 mb-3">
          <Avatar
            name={collaborator?.full_name}
            email={email}
            size="md"
          />
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-gray-900 truncate">
              {collaborator?.full_name || 'User'}
            </div>
            {email && (
              <div className="text-xs text-gray-500 truncate">
                {email}
              </div>
            )}
          </div>
        </div>
        <SignOutButton />
      </div>
    </div>
  )
}
