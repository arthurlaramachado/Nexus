import { createClient } from '@/lib/supabase/server'
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '@/components/ui/Table'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Link from 'next/link'
import { requirePermission, checkPermission } from '@/lib/auth/helpers'
import { PencilIcon } from '@heroicons/react/24/outline'

export default async function CollaboratorsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; role_id?: string }>
}) {
  await requirePermission('collaborators', 'read')
  const canWrite = await checkPermission('collaborators', 'write')
  const { status, role_id } = await searchParams
  const supabase = await createClient()
  
  // Fetch collaborators with their joined role
  let query = supabase
    .from('collaborators')
    .select('*, roles(name)')
    .order('created_at', { ascending: false })

  if (status) {
    query = query.eq('status', status)
  }
  if (role_id) {
    query = query.eq('role_id', role_id)
  }

  const { data: collaborators, error } = await query

  if (error) {
    return <div>Error loading collaborators: {error.message}</div>
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Collaborators</h1>
        {canWrite && (
          <Link href="/dashboard/collaborators/new">
            <Button>New Collaborator</Button>
          </Link>
        )}
      </div>

      <div>
        <Table>
          <TableHead>
            <TableRow>
              <TableHeader>Name</TableHeader>
              <TableHeader>Email</TableHeader>
              <TableHeader>Role</TableHeader>
              <TableHeader>Status</TableHeader>
              <TableHeader>Actions</TableHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            {collaborators && collaborators.length > 0 ? (
              collaborators.map((collaborator: any) => (
                <TableRow key={collaborator.id}>
                  <TableCell>
                    <Link
                      href={`/dashboard/collaborators/${collaborator.id}`}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      {collaborator.full_name}
                    </Link>
                  </TableCell>
                  <TableCell>{collaborator.email}</TableCell>
                  <TableCell>
                    <Badge variant="info">
                      {collaborator.roles?.name || 'No Role'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={collaborator.status === 'active' ? 'success' : 'default'}>
                      {collaborator.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {canWrite && (
                      <Link href={`/dashboard/collaborators/${collaborator.id}/edit`}>
                        <Button variant="outline" size="icon">
                          <PencilIcon className="w-4 h-4" />
                        </Button>
                      </Link>
                    )}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-gray-500 py-8">
                  No collaborators found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
