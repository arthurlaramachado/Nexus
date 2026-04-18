import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import ContractForm from '@/components/forms/ContractForm'
import { requirePermission } from '@/lib/auth/helpers'

export default async function EditContractPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission('contracts', 'write')
  const { id } = await params
  const supabase = await createClient()

  const [
    { data: contract, error },
    { data: clients },
    { data: services },
    { data: contractServices },
  ] = await Promise.all([
    supabase.from('contracts').select('*').eq('id', id).single(),
    supabase.from('clients').select('id, name').order('name'),
    supabase.from('services').select('id, name').order('name'),
    supabase.from('contract_services').select('service_id').eq('contract_id', id),
  ])

  if (error || !contract) {
    notFound()
  }

  const defaultServiceIds = (contractServices || []).map((cs: any) => cs.service_id)

  return (
    <div>
      <h1 className="text-2xl font-semibold text-[#1A1A2E] tracking-tight mb-6">Edit Contract</h1>
      <ContractForm
        contract={contract}
        clients={clients || []}
        services={services || []}
        defaultServiceIds={defaultServiceIds}
      />
    </div>
  )
}

