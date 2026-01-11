import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Collaborator } from '@/types/database'
import { cache } from 'react'

export const getUser = cache(async () => {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user
})

/**
 * Fetches the current user's collaborator profile.
 */
export const getUserCollaborator = cache(async (organizationId?: string): Promise<Collaborator | null> => {
  const supabase = await createClient()
  const user = await getUser()
  
  if (!user) return null
  
  let query = supabase
    .from('collaborators')
    .select('*, roles(*), organizations(*)')
    .eq('user_id', user.id)
    .eq('status', 'active')

  if (organizationId) {
    query = query.eq('organization_id', organizationId)
  }

  const { data, error } = await query.limit(1).single()
  
  if (error || !data) return null
  
  return data as Collaborator
})

/**
 * Helper to get the role name of the current user.
 */
export const getUserRoleName = cache(async (organizationId?: string): Promise<string | null> => {
  const collaborator = await getUserCollaborator(organizationId)
  return collaborator?.roles?.name || null
})

export async function requireAuth() {
  const user = await getUser()
  if (!user) {
    redirect('/login')
  }
  return user
}

/**
 * Enforces role-based access. Redirects to /forbidden if check fails.
 */
export async function requireRole(allowedRoles: string[]) {
  const user = await requireAuth()
  const roleName = await getUserRoleName() 
  
  if (!roleName) {
    redirect('/forbidden')
  }
  
  if (!allowedRoles.some(r => r.toLowerCase() === roleName.toLowerCase())) {
    redirect(`/forbidden?required=${allowedRoles.join(',')}&current=${roleName}`)
  }
  
  return { user, role: roleName }
}

/**
 * Fetches all permissions for the current user, cached for the duration of the request.
 */
export const getAllPermissions = cache(async () => {
  const supabase = await createClient()
  const user = await getUser()
  if (!user) return []

  const { data, error } = await supabase.rpc('get_user_permissions')
  if (error) {
    console.error('Failed to fetch permissions:', error)
    return []
  }
  return data || []
})

/**
 * Checks if the current user has a specific permission for a table.
 */
export async function checkPermission(tableName: string, permissionType: 'read' | 'write' | 'delete'): Promise<boolean> {
  const collaborator = await getUserCollaborator()
  if (!collaborator) return false
  
  // System roles bypass checks
  if (collaborator.roles?.is_system_role) return true

  const permissions = await getAllPermissions()
  const perm = permissions.find((p: any) => p.table_name === tableName)
  
  if (!perm) return false
  
  if (permissionType === 'read') return perm.can_read
  if (permissionType === 'write') return perm.can_write
  if (permissionType === 'delete') return perm.can_delete
  return false
}

/**
 * Enforces permission-based access. Redirects to /forbidden if check fails.
 */
export async function requirePermission(tableName: string, permissionType: 'read' | 'write' | 'delete') {
  await requireAuth()
  const hasPerm = await checkPermission(tableName, permissionType)
  if (!hasPerm) {
    redirect('/forbidden')
  }
}

export const getUserOrganizationId = cache(async (): Promise<string | null> => {
  const collaborator = await getUserCollaborator()
  return collaborator?.organization_id || null
})

export async function requireOrganization() {
  const orgId = await getUserOrganizationId()
  if (!orgId) {
    redirect('/dashboard?error=no_organization')
  }
  return orgId
}
