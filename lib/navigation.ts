import {
  HomeIcon,
  UsersIcon,
  DocumentTextIcon,
  UserGroupIcon,
  ChartBarIcon,
  BriefcaseIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline'

export interface NavItem {
  name: string
  href: string
  icon: any
  roles?: string[] // Changed from UserRole enum to string[]
}

const navigation: NavItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { name: 'Clients', href: '/dashboard/clients', icon: BriefcaseIcon },
  { name: 'Contracts', href: '/dashboard/contracts', icon: DocumentTextIcon },
  { name: 'Collaborators', href: '/dashboard/collaborators', icon: UsersIcon },
  {
    name: 'Roles',
    href: '/dashboard/roles',
    icon: ShieldCheckIcon,
    roles: ['Admin'], // Using string literal matching new DB role names
  },
  {
    name: 'Contract Assignments',
    href: '/dashboard/contract-assignments',
    icon: UserGroupIcon,
  },
  {
    name: 'Audit Logs',
    href: '/dashboard/audit-logs',
    icon: DocumentTextIcon,
    roles: ['Admin', 'Manager'],
  },
  {
    name: 'Reports',
    href: '/dashboard/reports',
    icon: ChartBarIcon,
    roles: ['Admin', 'Manager'],
  },
]

export function getFilteredNavigation(userRole: string | null) {
  if (!userRole) return []
  
  return navigation.filter((item) => {
    if (!item.roles) return true
    // Case-insensitive match for robustness
    return item.roles.some(r => r.toLowerCase() === userRole.toLowerCase())
  })
}

// Serializable version for passing to client components
export interface SerializableNavItem {
  name: string
  href: string
  roles?: string[]
}

export function getFilteredNavigationSerializable(userRole: string | null): SerializableNavItem[] {
  if (!userRole) return []
  
  return navigation.filter((item) => {
    if (!item.roles) return true
    return item.roles.some(r => r.toLowerCase() === userRole.toLowerCase())
  }).map(({ name, href, roles }) => ({ name, href, roles }))
}
