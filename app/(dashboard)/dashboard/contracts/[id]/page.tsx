import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { requirePermission, checkPermission } from '@/lib/auth/helpers'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Link from 'next/link'
import Card from '@/components/ui/Card'
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '@/components/ui/Table'
import { PencilIcon, UserPlusIcon, ArrowLeftIcon } from '@heroicons/react/24/outline'
import ContractLogsList from '@/components/contracts/ContractLogsList'
import ContractDetailClient from './ContractDetailClient'

export default async function ContractDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await requirePermission('contracts', 'read')
  const canWrite = await checkPermission('contracts', 'write')
  
  const supabase = await createClient()
  
  const { data: contract, error: contractError } = await supabase
    .from('contracts')
    .select('*, clients(*)')
    .eq('id', id)
    .single()

  if (contractError || !contract) {
    notFound()
  }

  // Fetch previous contract separately if it exists
  let previousContract = null
  if (contract.previous_contract_id) {
    const { data: prev } = await supabase
      .from('contracts')
      .select('id, name')
      .eq('id', contract.previous_contract_id)
      .single()
    previousContract = prev
  }

  const { data: assignments } = await supabase
    .from('contract_assignments')
    .select('*, collaborators(*, roles!collaborators_role_id_fkey(*))')
    .eq('contract_id', id)
    .order('start_date', { ascending: false })

  const { data: logs } = await supabase
    .from('contract_logs')
    .select('*')
    .eq('contract_id', id)
    .order('created_at', { ascending: false })

  const transformedAssignments = (assignments || []).map((a: any) => ({
    ...a,
    collaborators: a.collaborators ? {
      ...a.collaborators,
      roles: Array.isArray(a.collaborators.roles) ? a.collaborators.roles[0] || null : a.collaborators.roles
    } : null
  }))

  const getTerminationReasonLabel = (reason: string | null) => {
    switch (reason) {
      case 'NOT_RENEWED':
        return 'Not Renewed'
      case 'CHURN':
        return 'Churn'
      case 'CUT':
        return 'Cut'
      case 'RENEWED':
        return 'Renewed'
      default:
        return reason
    }
  }

  return (
    <div>
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{contract.name}</h1>
          <div className="mt-2 flex gap-2 items-center">
            <Badge
              variant={
                contract.status === 'ACTIVE'
                  ? 'success'
                  : 'default'
              }
            >
              {contract.status}
            </Badge>
            {contract.termination_reason && (
              <Badge variant="warning">
                {getTerminationReasonLabel(contract.termination_reason)}
              </Badge>
            )}
            {previousContract && (
              <Link
                href={`/dashboard/contracts/${previousContract.id}`}
                className="text-sm text-indigo-600 hover:text-indigo-900 flex items-center gap-1"
              >
                <ArrowLeftIcon className="w-4 h-4" />
                Previous Contract: {previousContract.name}
              </Link>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <ContractDetailClient contract={contract} canWrite={canWrite} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="md:col-span-1">
          <Card title="Contract Information">
            <dl className="space-y-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">Client</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  <Link
                    href={`/dashboard/clients/${contract.client_id}`}
                    className="text-indigo-600 hover:text-indigo-900 font-semibold"
                  >
                    {(contract.clients as any)?.name || '-'}
                  </Link>
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Dates</dt>
                <dd className="mt-1 text-sm text-gray-900 space-y-1">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Start:</span>
                    <span>{new Date(contract.start_date).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">End:</span>
                    <span>{contract.end_date ? new Date(contract.end_date).toLocaleDateString() : 'N/A'}</span>
                  </div>
                  {contract.renewal_date && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Renewal:</span>
                      <span>{new Date(contract.renewal_date).toLocaleDateString()}</span>
                    </div>
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Value</dt>
                <dd className="mt-1 text-lg font-bold text-gray-900">
                  {contract.current_value
                    ? new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: 'USD',
                      }).format(contract.current_value)
                    : '-'}
                </dd>
              </div>
            </dl>
          </Card>
        </div>

        <div className="md:col-span-2">
          <Card 
            title="Team Assignments" 
            headerAction={
              canWrite && (
                <Link href={`/dashboard/contract-assignments/new?contract_id=${id}`}>
                  <Button size="sm" className="flex items-center gap-2">
                    <UserPlusIcon className="w-4 h-4" />
                    Assign
                  </Button>
                </Link>
              )
            }
          >
            {transformedAssignments && transformedAssignments.length > 0 ? (
              <Table>
                <TableHead>
                  <TableRow>
                    <TableHeader>Name</TableHeader>
                    <TableHeader>Role</TableHeader>
                    <TableHeader>Period</TableHeader>
                    <TableHeader>Alloc.</TableHeader>
                    {canWrite && <TableHeader>Actions</TableHeader>}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {transformedAssignments.map((assignment: any) => (
                    <TableRow key={assignment.id}>
                      <TableCell>
                        <Link
                          href={`/dashboard/collaborators/${assignment.collaborator_id}`}
                          className="text-indigo-600 hover:text-indigo-900 font-medium"
                        >
                          {assignment.collaborators?.full_name || '-'}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Badge variant="info" className="text-[10px] uppercase">
                          {assignment.collaborators?.roles?.name || '-'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-gray-500">
                        {new Date(assignment.start_date).toLocaleDateString()} - {assignment.end_date ? new Date(assignment.end_date).toLocaleDateString() : 'Present'}
                      </TableCell>
                      <TableCell className="font-semibold">
                        {assignment.allocation_percentage
                          ? `${assignment.allocation_percentage}%`
                          : '-'}
                      </TableCell>
                      {canWrite && (
                        <TableCell>
                          <Link href={`/dashboard/contract-assignments/${assignment.id}/edit`}>
                            <Button variant="outline" size="sm" className="p-1.5">
                              <PencilIcon className="w-3.5 h-3.5" />
                            </Button>
                          </Link>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="py-12 text-center">
                <p className="text-gray-500 italic">No collaborators assigned yet.</p>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Contract Logs Section */}
      <div className="mb-6">
        <Card title="Contract History">
          <ContractLogsList logs={logs || []} />
        </Card>
      </div>
    </div>
  )
}

