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
    supabase.from('collaborators').select('id, full_name, role_id, roles(name)').order('full_name'),
    supabase.from('clients').select('id, name').order('name'),
  ])

  const transformedCollaborators = (collaboratorsResult.data || []).map((c: any) => ({
    ...c,
    roles: Array.isArray(c.roles) ? c.roles[0] || null : c.roles
  }))

  return (
    <div>
      <h1 className="text-2xl font-semibold text-[#1A1A2E] tracking-tight mb-6">Edit Contract Assignment</h1>
      <ContractAssignmentForm
        assignment={assignment}
        contracts={contractsResult.data || []}
        clients={clientsResult.data || []}
        collaborators={transformedCollaborators}
      />
    </div>
  )
}
