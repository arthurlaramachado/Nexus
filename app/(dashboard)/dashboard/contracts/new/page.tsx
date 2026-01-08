import ContractForm from '@/components/forms/ContractForm'
import { createClient } from '@/lib/supabase/server'

export default async function NewContractPage({
  searchParams,
}: {
  searchParams: Promise<{ client_id?: string }>
}) {
  const { client_id } = await searchParams
  const supabase = await createClient()
  const { data: clients } = await supabase.from('clients').select('id, name').order('name')

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">New Contract</h1>
      <ContractForm clients={clients || []} defaultClientId={client_id} />
    </div>
  )
}

