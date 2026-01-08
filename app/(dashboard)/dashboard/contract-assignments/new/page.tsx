import ContractAssignmentForm from '@/components/forms/ContractAssignmentForm'
import { createClient } from '@/lib/supabase/server'

export default async function NewContractAssignmentPage({
  searchParams,
}: {
  searchParams: Promise<{ contract_id?: string; collaborator_id?: string }>
}) {
  const { contract_id, collaborator_id } = await searchParams
  const supabase = await createClient()
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
      <h1 className="text-3xl font-bold text-gray-900 mb-6">New Contract Assignment</h1>
      <ContractAssignmentForm
        contracts={contractsResult.data || []}
        clients={clientsResult.data || []}
        collaborators={transformedCollaborators}
        defaultContractId={contract_id}
        defaultCollaboratorId={collaborator_id}
      />
    </div>
  )
}
