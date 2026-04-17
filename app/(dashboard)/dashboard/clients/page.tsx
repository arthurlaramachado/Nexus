import { createClient } from '@/lib/supabase/server'
import ClientsTable from '@/components/features/clients/ClientsTable'
import { requirePermission } from '@/lib/auth/helpers'

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; country?: string }>
}) {
  await requirePermission('clients', 'read')
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
    return <div className="bg-[#FEE2E2] border border-[#EF4444]/20 text-[#991B1B] rounded-lg px-4 py-3">Error loading clients: {error.message}</div>
  }

  return (
    <div>
      <ClientsTable clients={clients || []} />
    </div>
  )
}
