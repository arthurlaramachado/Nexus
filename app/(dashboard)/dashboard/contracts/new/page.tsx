import ContractForm from '@/components/forms/ContractForm'
import { createClient } from '@/lib/supabase/server'
import { requirePermission } from '@/lib/auth/helpers'

export default async function NewContractPage({
  searchParams,
}: {
  searchParams: Promise<{ client_id?: string }>
}) {
  await requirePermission('contracts', 'write')
  const { client_id } = await searchParams
  const supabase = await createClient()

  const { data: clients } = await supabase.from('clients').select('id, name').order('name')

  return (
    <div>
      <h1 className="text-2xl font-semibold text-[#1A1A2E] tracking-tight mb-6">New Contract</h1>
      <ContractForm clients={clients || []} defaultClientId={client_id} />
    </div>
  )
}

