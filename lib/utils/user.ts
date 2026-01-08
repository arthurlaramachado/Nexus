import { UserProfile } from '@/types/database'

export function getUserInitials(fullName: string | null | undefined): string {
  if (!fullName) return '?'
  
  const parts = fullName.trim().split(/\s+/)
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase()
  }
  
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
}

export function getUserDisplayName(
  profile: UserProfile | null,
  fallback: string = 'User'
): string {
  return profile?.full_name || fallback
}

export async function getUserEmail(): Promise<string | null> {
  try {
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    
    if (user?.email) {
      return user.email
    }
    
    // Try to get from collaborator
    if (user) {
      const { data: collaborator } = await supabase
        .from('collaborators')
        .select('email')
        .eq('user_id', user.id)
        .single()
      
      return collaborator?.email || null
    }
    
    return null
  } catch {
    return null
  }
}

export async function getUserEmailFromCollaborator(): Promise<string | null> {
  try {
    const { createClient } = await import('@/lib/supabase/server')
    const { getUser } = await import('@/lib/auth/helpers')
    const user = await getUser()
    
    if (!user) return null
    
    const supabase = await createClient()
    const { data: collaborator } = await supabase
      .from('collaborators')
      .select('email')
      .eq('user_id', user.id)
      .single()
    
    return collaborator?.email || user.email || null
  } catch {
    return null
  }
}
