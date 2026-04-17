export const ROUTES = {
  DASHBOARD: '/dashboard',
  CLIENTS: '/dashboard/clients',
  CONTRACTS: '/dashboard/contracts',
  COLLABORATORS: '/dashboard/collaborators',
  ROLES: '/dashboard/roles',
  AUDIT_LOGS: '/dashboard/audit-logs',
  LOGIN: '/login',
  SIGNUP: '/signup',
} as const

export const STATUS_COLORS = {
  active: 'success',
  inactive: 'default',
  paused: 'warning',
} as const

export const CONTRACT_TYPE_LABELS = {
  new_deal: 'New Deal',
  renewed: 'Renewed',
  upsell: 'Upsell',
  downsell: 'Downsell',
  not_renewed: 'Not Renewed',
  churn: 'Churn',
  cut: 'Cut',
} as const

