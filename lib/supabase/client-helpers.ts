import { createClient } from './client'

export async function getUserOrganizationId(): Promise<string | null> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return null
  
  const { data: collaborator } = await supabase
    .from('collaborators')
    .select('organization_id')
    .eq('user_id', user.id)
    .single()
  
  return collaborator?.organization_id || null
}

