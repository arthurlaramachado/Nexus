import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Collaborator } from '@/types/database'

export async function getUser() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user
}

/**
 * Fetches the current user's collaborator profile.
 * Since a user can belong to multiple orgs, we usually need the org context.
 * For now, this returns the FIRST active collaborator record found.
 * 
 * TODO: In a real multi-tenant app, you'd pass organization_id from the URL/Context.
 */
export async function getUserCollaborator(organizationId?: string): Promise<Collaborator | null> {
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

  // We take the single/first one found.
  const { data, error } = await query.limit(1).single()
  
  if (error || !data) return null
  
  return data as Collaborator
}

/**
 * Helper to get the role name of the current user.
 */
export async function getUserRoleName(organizationId?: string): Promise<string | null> {
  const collaborator = await getUserCollaborator(organizationId)
  return collaborator?.roles?.name || null
}

export async function requireAuth() {
  const user = await getUser()
  if (!user) {
    redirect('/login')
  }
  return user
}

/**
 * Enforces role-based access. Redirects to /forbidden if check fails.
 * Checks against the Role Name (e.g., 'Admin', 'Manager').
 */
export async function requireRole(allowedRoles: string[]) {
  const user = await requireAuth()
  // Note: Without an org context, this checks the user's "default" or first found org.
  const roleName = await getUserRoleName() 
  
  if (!roleName) {
    console.warn(`User ${user.id} has no role assigned.`)
    redirect('/forbidden')
  }
  
  if (!allowedRoles.some(r => r.toLowerCase() === roleName.toLowerCase())) {
    console.warn(`Access denied. User role '${roleName}' not in allowed: ${allowedRoles.join(', ')}`)
    redirect(`/forbidden?required=${allowedRoles.join(',')}&current=${roleName}`)
  }
  
  return { user, role: roleName }
}

export async function getUserOrganizationId(): Promise<string | null> {
  const collaborator = await getUserCollaborator()
  return collaborator?.organization_id || null
}

export async function requireOrganization() {
  const orgId = await getUserOrganizationId()
  if (!orgId) {
    // If user has no organization, they might need to create one or be invited.
    // For now, redirect to a safe page or error.
    redirect('/dashboard?error=no_organization')
  }
  return orgId
}
