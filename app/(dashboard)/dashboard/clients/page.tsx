import { createClient } from '@/lib/supabase/server'
import ClientFilters from '@/components/filters/ClientFilters'
import ClientsTable from '@/components/features/clients/ClientsTable'

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; country?: string }>
}) {
  const { status, country } = await searchParams
  const supabase = await createClient()
  
  let query = supabase
    .from('clients')
    .select('*, client_tags(tags(name))')
    .order('created_at', { ascending: false })

  if (status) {
    query = query.eq('status', status)
  }
  if (country) {
    query = query.ilike('country', `%${country}%`)
  }
  // Industry filter removed as column is gone. 
  // Tag filtering is more complex (requires joining), simplified for now to just basic filters.

  const { data: clients, error } = await query

  if (error) {
    return <div>Error loading clients: {error.message}</div>
  }

  return (
    <div>
      <ClientFilters />
      <ClientsTable clients={clients || []} />
    </div>
  )
}
