import { createClient } from '@/lib/supabase/server'
import RolesTable from '@/components/features/roles/RolesTable'

export default async function RolesPage() {
  const supabase = await createClient()
  
  const { data: roles, error } = await supabase
    .from('roles')
    .select('*')
    .order('name')

  if (error) {
    return <div>Error loading roles: {error.message}</div>
  }

  return <RolesTable initialRoles={roles || []} />
}
