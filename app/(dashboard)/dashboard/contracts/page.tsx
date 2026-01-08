import { createClient } from '@/lib/supabase/server'
import ContractsTable from '@/components/features/contracts/ContractsTable'

export default async function ContractsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; contract_type?: string; client_id?: string }>
}) {
  const { status, contract_type, client_id } = await searchParams
  const supabase = await createClient()
  
  let query = supabase
    .from('contracts')
    .select('*, clients(name)')
    .order('created_at', { ascending: false })

  if (status) {
    query = query.eq('status', status)
  }
  if (contract_type) {
    query = query.eq('contract_type', contract_type)
  }
  if (client_id) {
    query = query.eq('client_id', client_id)
  }

  const { data: contracts, error } = await query

  // Fetch all clients for the form
  const { data: clients } = await supabase.from('clients').select('id, name').order('name')

  if (error) {
    return <div>Error loading contracts: {error.message}</div>
  }

  return (
    <ContractsTable 
      initialContracts={contracts || []} 
      clients={clients || []} 
    />
  )
}

