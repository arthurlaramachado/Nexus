import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import ContractAssignmentForm from '@/components/forms/ContractAssignmentForm'

export default async function EditContractAssignmentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: assignment, error } = await supabase
    .from('contract_assignments')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !assignment) {
    notFound()
  }

  const [contractsResult, collaboratorsResult, clientsResult] = await Promise.all([
    supabase.from('contracts').select('id, name, client_id').order('name'),
    supabase.from('collaborators').select('id, full_name, role_id, roles(*)').order('full_name'),
    supabase.from('clients').select('id, name').order('name'),
  ])

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Edit Contract Assignment</h1>
      <ContractAssignmentForm
        assignment={assignment}
        contracts={contractsResult.data || []}
        clients={clientsResult.data || []}
        collaborators={collaboratorsResult.data || []}
      />
    </div>
  )
}
