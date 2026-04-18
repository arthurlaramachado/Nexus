import {
  HomeIcon,
  UsersIcon,
  DocumentTextIcon,
  BriefcaseIcon,
  ShieldCheckIcon,
  WrenchScrewdriverIcon,
} from '@heroicons/react/24/outline'

import { checkPermission } from '@/lib/auth/helpers'

export interface NavItem {
  name: string
  href: string
  icon: any
  permission?: { table: string; type: 'read' | 'write' | 'delete' }
}

const navigation: NavItem[] = [
  { name: 'Overview', href: '/dashboard', icon: HomeIcon },
  { name: 'Clients', href: '/dashboard/clients', icon: BriefcaseIcon, permission: { table: 'clients', type: 'read' } },
  { name: 'Contracts', href: '/dashboard/contracts', icon: DocumentTextIcon, permission: { table: 'contracts', type: 'read' } },
  { name: 'Services', href: '/dashboard/services', icon: WrenchScrewdriverIcon, permission: { table: 'services', type: 'read' } },
  { name: 'Collaborators', href: '/dashboard/collaborators', icon: UsersIcon, permission: { table: 'collaborators', type: 'read' } },
  {
    name: 'Roles',
    href: '/dashboard/roles',
    icon: ShieldCheckIcon,
    permission: { table: 'roles', type: 'read' },
  },
  {
    name: 'Audit Logs',
    href: '/dashboard/audit-logs',
    icon: DocumentTextIcon,
    permission: { table: 'audit_logs', type: 'read' },
  },
]

export async function getFilteredNavigation() {
  const filtered = await Promise.all(
    navigation.map(async (item) => {
      if (!item.permission) return item
      const hasPerm = await checkPermission(item.permission.table, item.permission.type)
      return hasPerm ? item : null
    })
  )
  
  return filtered.filter((item): item is NavItem => item !== null)
}

// Serializable version for passing to client components
export interface SerializableNavItem {
  name: string
  href: string
}

export async function getFilteredNavigationSerializable(): Promise<SerializableNavItem[]> {
  const filtered = await getFilteredNavigation()
  return filtered.map(({ name, href }) => ({ name, href }))
}
