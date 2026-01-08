import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Link from 'next/link'
import Card from '@/components/ui/Card'
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '@/components/ui/Table'

export default async function ContractDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  
  const { data: contract, error: contractError } = await supabase
    .from('contracts')
    .select('*, clients(*)')
    .eq('id', id)
    .single()

  if (contractError || !contract) {
    notFound()
  }

  const { data: assignments } = await supabase
    .from('contract_assignments')
    .select('*, collaborators(*, roles!collaborators_role_id_fkey(*))')
    .eq('contract_id', params.id)
    .order('assignment_start_date', { ascending: false })

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{contract.name}</h1>
          <div className="mt-2 flex gap-2">
            <Badge
              variant={
                contract.status === 'active'
                  ? 'success'
                  : contract.status === 'paused'
                  ? 'warning'
                  : 'default'
              }
            >
              {contract.status}
            </Badge>
            <Badge variant="info">{contract.contract_type}</Badge>
          </div>
        </div>
        <Link href={`/dashboard/contracts/${id}/edit`}>
          <Button>Edit Contract</Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card title="Contract Information">
          <dl className="space-y-4">
            <div>
              <dt className="text-sm font-medium text-gray-500">Client</dt>
              <dd className="mt-1 text-sm text-gray-900">
                <Link
                  href={`/dashboard/clients/${contract.client_id}`}
                  className="text-indigo-600 hover:text-indigo-900"
                >
                  {(contract.clients as any)?.name || '-'}
                </Link>
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Contract Type</dt>
              <dd className="mt-1 text-sm text-gray-900">{contract.contract_type}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Start Date</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {new Date(contract.start_date).toLocaleDateString()}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">End Date</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {contract.end_date ? new Date(contract.end_date).toLocaleDateString() : '-'}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Renewal Date</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {contract.renewal_date ? new Date(contract.renewal_date).toLocaleDateString() : '-'}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Contract Value</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {contract.contract_value
                  ? new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: 'USD',
                    }).format(contract.contract_value)
                  : '-'}
              </dd>
            </div>
          </dl>
        </Card>
      </div>

      <Card title="Collaborators">
        {assignments && assignments.length > 0 ? (
          <Table>
            <TableHead>
              <TableRow>
                <TableHeader>Name</TableHeader>
                <TableHeader>Role</TableHeader>
                <TableHeader>Start Date</TableHeader>
                <TableHeader>End Date</TableHeader>
                <TableHeader>Allocation</TableHeader>
                <TableHeader>Actions</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {assignments.map((assignment: any) => (
                <TableRow key={assignment.id}>
                  <TableCell>
                    <Link
                      href={`/dashboard/collaborators/${assignment.collaborator_id}`}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      {assignment.collaborators?.full_name || '-'}
                    </Link>
                  </TableCell>
                  <TableCell>
                    {assignment.collaborators?.roles?.name || '-'}
                  </TableCell>
                  <TableCell>
                    {new Date(assignment.assignment_start_date).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    {assignment.assignment_end_date
                      ? new Date(assignment.assignment_end_date).toLocaleDateString()
                      : 'Active'}
                  </TableCell>
                  <TableCell>
                    {assignment.allocation_percentage
                      ? `${assignment.allocation_percentage}%`
                      : '-'}
                  </TableCell>
                  <TableCell>
                    <Link href={`/dashboard/contract-assignments/${assignment.id}/edit`}>
                      <Button variant="outline" className="text-sm">
                        Edit
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p className="text-gray-500">No collaborators assigned to this contract.</p>
        )}
        <div className="mt-4">
          <Link href={`/dashboard/contract-assignments/new?contract_id=${id}`}>
            <Button>Assign Collaborator</Button>
          </Link>
        </div>
      </Card>
    </div>
  )
}

