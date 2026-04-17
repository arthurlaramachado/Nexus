import Logo from '@/components/ui/Logo'
import NavItem from '@/components/layout/NavItem'
import Avatar from '@/components/ui/Avatar'
import SignOutButton from '@/components/auth/SignOutButton'
import { getFilteredNavigation } from '@/lib/navigation'
import { getUserCollaborator } from '@/lib/auth/helpers'

export default async function Sidebar() {
  const collaborator = await getUserCollaborator()
  const email = collaborator?.email || null
  const navItems = await getFilteredNavigation()

  return (
    <div className="hidden lg:flex fixed left-0 top-0 h-full w-64 bg-[#1A1A2E] flex-col z-50">
      {/* Logo at top */}
      <div className="h-16 flex items-center px-4 py-5">
        <Logo size="lg" variant="dark" />
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-2 px-3">
        <div className="space-y-1">
          {navItems.map((item) => (
            <NavItem
              key={item.href}
              href={item.href}
              label={item.name}
              icon={<item.icon className="w-4 h-4 flex-shrink-0" />}
            />
          ))}
        </div>
      </nav>

      {/* User profile at bottom */}
      <div className="border-t border-white/8 p-4">
        <div className="flex items-center gap-3 mb-3">
          <Avatar
            name={collaborator?.full_name}
            email={email}
            size="md"
          />
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-white truncate">
              {collaborator?.full_name || 'User'}
            </div>
            {email && (
              <div className="text-xs text-[#A8A8BB] truncate">
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
