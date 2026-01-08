import { createClient } from '@/lib/supabase/server'
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '@/components/ui/Table'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Link from 'next/link'

export default async function ContractAssignmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ contract_id?: string; collaborator_id?: string }>
}) {
  const { contract_id, collaborator_id } = await searchParams
  const supabase = await createClient()
  
  let query = supabase
    .from('contract_assignments')
    .select(`
      *,
      contracts (name),
      collaborators (full_name)
    `)
    .order('start_date', { ascending: false })

  if (contract_id) {
    query = query.eq('contract_id', contract_id)
  }
  if (collaborator_id) {
    query = query.eq('collaborator_id', collaborator_id)
  }

  const { data: assignments, error } = await query

  if (error) {
    return <div>Error loading assignments: {error.message}</div>
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Contract Assignments</h1>
        <Link href="/dashboard/contract-assignments/new">
          <Button>New Assignment</Button>
        </Link>
      </div>

      <div>
        <Table>
          <TableHead>
            <TableRow>
              <TableHeader>Contract</TableHeader>
              <TableHeader>Collaborator</TableHeader>
              <TableHeader>Role</TableHeader>
              <TableHeader>Start Date</TableHeader>
              <TableHeader>End Date</TableHeader>
              <TableHeader>Allocation</TableHeader>
              <TableHeader>Actions</TableHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            {assignments && assignments.length > 0 ? (
              assignments.map((assignment: any) => (
                <TableRow key={assignment.id}>
                  <TableCell>
                    <Link
                      href={`/dashboard/contracts/${assignment.contract_id}`}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      {assignment.contracts?.name}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/dashboard/collaborators/${assignment.collaborator_id}`}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      {assignment.collaborators?.full_name}
                    </Link>
                  </TableCell>
                  <TableCell>{assignment.role_on_contract || '-'}</TableCell>
                  <TableCell>{new Date(assignment.start_date).toLocaleDateString()}</TableCell>
                  <TableCell>
                    {assignment.end_date ? new Date(assignment.end_date).toLocaleDateString() : (
                      <Badge variant="success">Active</Badge>
                    )}
                  </TableCell>
                  <TableCell>{assignment.allocation_percentage ? `${assignment.allocation_percentage}%` : '-'}</TableCell>
                  <TableCell>
                    <Link href={`/dashboard/contract-assignments/${assignment.id}/edit`}>
                      <Button variant="outline" className="text-sm">
                        Edit
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-gray-500 py-8">
                  No assignments found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

