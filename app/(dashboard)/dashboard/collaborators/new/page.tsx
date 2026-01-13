import { createClient } from '@/lib/supabase/server'
import { requirePermission } from '@/lib/auth/helpers'
import InviteForm from './InviteForm'

export default async function NewCollaboratorPage() {
  await requirePermission('collaborators', 'write')
  
  const supabase = await createClient()
  const { data: roles } = await supabase
    .from('roles')
    .select('id, name')
    .order('name')

  return <InviteForm roles={roles || []} />
}
