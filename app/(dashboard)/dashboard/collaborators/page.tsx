import { createClient } from '@/lib/supabase/server'
import CollaboratorsTable from '@/components/features/collaborators/CollaboratorsTable'

export default async function CollaboratorsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; role_id?: string }>
}) {
  const { status, role_id } = await searchParams
  const supabase = await createClient()
  
  // Fetch collaborators with their joined role
  let query = supabase
    .from('collaborators')
    .select('*, roles(name)')
    .order('created_at', { ascending: false })

  if (status) {
    query = query.eq('status', status)
  }
  if (role_id) {
    query = query.eq('role_id', role_id)
  }

  const { data: collaborators, error } = await query

  // Fetch all roles for the form
  const { data: roles } = await supabase.from('roles').select('id, name').order('name')

  if (error) {
    return <div>Error loading collaborators: {error.message}</div>
  }

  return (
    <CollaboratorsTable
      initialCollaborators={collaborators || []}
      roles={roles || []}
    />
  )
}
