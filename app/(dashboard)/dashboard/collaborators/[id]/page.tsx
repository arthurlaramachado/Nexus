import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Link from 'next/link'
import Card from '@/components/ui/Card'
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '@/components/ui/Table'
import AuditHistoryList from '@/components/audit/AuditHistoryList'

export default async function CollaboratorDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: collaborator, error: collaboratorError } = await supabase
    .from('collaborators')
    .select('*, roles!collaborators_role_id_fkey(*)')
    .eq('id', id)
    .single()

  if (collaboratorError || !collaborator) {
    notFound()
  }

  const { data: assignments } = await supabase
    .from('contract_assignments')
    .select('*, contracts(*, clients(name))')
    .eq('collaborator_id', id)
    .order('start_date', { ascending: false })

  // Fetch audit logs for this collaborator
  const { data: auditLogs } = await supabase
    .from('audit_logs')
    .select('*')
    .eq('table_name', 'collaborators')
    .eq('record_id', id)
    .order('created_at', { ascending: false })

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-[#1A1A2E] tracking-tight">{collaborator.full_name}</h1>
          <div className="mt-2 flex gap-2">
            <Badge variant={collaborator.status === 'active' ? 'success' : 'default'}>
              {collaborator.status}
            </Badge>
            <Badge variant="info">
              {(collaborator.roles as any)?.name || 'No Role'}
            </Badge>
          </div>
        </div>
        <Link href={`/dashboard/collaborators/${id}/edit`}>
          <Button>Edit Collaborator</Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card title="Collaborator Information">
          <dl className="space-y-4">
            <div>
              <dt className="text-sm font-medium text-[#9898A3]">Email</dt>
              <dd className="mt-1 text-sm text-[#1A1A2E]">{collaborator.email}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-[#9898A3]">Role</dt>
              <dd className="mt-1 text-sm text-[#1A1A2E]">
                {(collaborator.roles as any)?.name || '-'}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-[#9898A3]">Created At</dt>
              <dd className="mt-1 text-sm text-[#1A1A2E]">
                {new Date(collaborator.created_at).toLocaleDateString()}
              </dd>
            </div>
          </dl>
        </Card>
      </div>

      <Card title="Contract Assignments">
        {assignments && assignments.length > 0 ? (
          <Table>
            <TableHead>
              <TableRow>
                <TableHeader>Contract</TableHeader>
                <TableHeader>Client</TableHeader>
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
                      href={`/dashboard/contracts/${assignment.contract_id}`}
                      className="text-[#3B82F6] hover:text-[#2563EB]"
                    >
                      {assignment.contracts?.name || '-'}
                    </Link>
                  </TableCell>
                  <TableCell>
                    {assignment.contracts?.clients?.name || '-'}
                  </TableCell>
                  <TableCell>
                    {new Date(assignment.start_date).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    {assignment.end_date
                      ? new Date(assignment.end_date).toLocaleDateString()
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
          <p className="text-[#9898A3]">No contract assignments found for this collaborator.</p>
        )}
        <div className="mt-4">
          <Link href={`/dashboard/contract-assignments/new?collaborator_id=${id}`}>
            <Button>Assign to Contract</Button>
          </Link>
        </div>
      </Card>

      <Card title="Change History">
        <AuditHistoryList auditLogs={auditLogs || []} />
      </Card>
    </div>
  )
}
