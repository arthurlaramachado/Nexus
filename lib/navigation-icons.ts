'use client'

import {
  HomeIcon,
  UsersIcon,
  DocumentTextIcon,
  UserGroupIcon,
  ChartBarIcon,
  BriefcaseIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline'

// Map hrefs to icon components
export const navigationIconMap: Record<string, typeof HomeIcon> = {
  '/dashboard': HomeIcon,
  '/dashboard/clients': BriefcaseIcon,
  '/dashboard/contracts': DocumentTextIcon,
  '/dashboard/collaborators': UsersIcon,
  '/dashboard/roles': ShieldCheckIcon,
  '/dashboard/audit-logs': DocumentTextIcon,
  '/dashboard/reports': ChartBarIcon,
}

export function getIconForHref(href: string) {
  return navigationIconMap[href] || HomeIcon
}

