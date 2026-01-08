import { createClient } from '@/lib/supabase/server'
import ContractAssignmentsTable from '@/components/features/contract-assignments/ContractAssignmentsTable'

export default async function ContractAssignmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ contract_id?: string; collaborator_id?: string }>
}) {
  const { contract_id, collaborator_id } = await searchParams
  const supabase = await createClient()
  
  let query = supabase
    .from('contract_assignments')
    .select(`
      *,
      contracts (name, clients(name)),
      collaborators (full_name)
    `)
    .order('start_date', { ascending: false })

  if (contract_id) {
    query = query.eq('contract_id', contract_id)
  }
  if (collaborator_id) {
    query = query.eq('collaborator_id', collaborator_id)
  }

  const { data: assignments, error } = await query

  // Fetch data for form
  const { data: contracts } = await supabase
    .from('contracts')
    .select('id, name, client_id')
    .eq('status', 'active')
    .order('name')
    
  const { data: clients } = await supabase
    .from('clients')
    .select('id, name')
    .eq('status', 'active')
    .order('name')

  const { data: collaborators } = await supabase
    .from('collaborators')
    .select(`
      id, 
      full_name, 
      role_id,
      roles (name)
    `)
    .eq('status', 'active')
    .order('full_name')

  if (error) {
    return <div>Error loading assignments: {error.message}</div>
  }

  return (
    <ContractAssignmentsTable
      initialAssignments={assignments || []}
      contracts={contracts || []}
      clients={clients || []}
      collaborators={collaborators || []}
    />
  )
}

