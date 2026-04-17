import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import ContractForm from '@/components/forms/ContractForm'

export default async function EditContractPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: contract, error } = await supabase
    .from('contracts')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !contract) {
    notFound()
  }

  const { data: clients } = await supabase.from('clients').select('id, name').order('name')

  return (
    <div>
      <h1 className="text-2xl font-semibold text-[#1A1A2E] tracking-tight mb-6">Edit Contract</h1>
      <ContractForm contract={contract} clients={clients || []} />
    </div>
  )
}

