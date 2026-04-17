import { createClient } from '@/lib/supabase/server'
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '@/components/ui/Table'
import Button from '@/components/ui/Button'
import Link from 'next/link'
import Badge from '@/components/ui/Badge'
import { requirePermission, checkPermission } from '@/lib/auth/helpers'
import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline'

export default async function RolesPage() {
  await requirePermission('roles', 'read')
  const canWrite = await checkPermission('roles', 'write')
  const canDelete = await checkPermission('roles', 'delete')

  const supabase = await createClient()

  const { data: roles, error } = await supabase
    .from('roles')
    .select('*')
    .order('name')

  if (error) {
    return <div className="bg-[#FEE2E2] border border-[#EF4444]/20 text-[#991B1B] rounded-lg px-4 py-3">Error loading roles: {error.message}</div>
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-[#1A1A2E] tracking-tight">Roles</h1>
        {canWrite && (
          <Link href="/dashboard/roles/new">
            <Button>New Role</Button>
          </Link>
        )}
      </div>

      <div>
        <Table>
          <TableHead>
            <TableRow>
              <TableHeader>Name</TableHeader>
              <TableHeader>System Role</TableHeader>
              <TableHeader>Actions</TableHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            {roles && roles.length > 0 ? (
              roles.map((role: any) => (
                <TableRow key={role.id}>
                  <TableCell className="font-medium text-[#1A1A2E]">{role.name}</TableCell>
                  <TableCell>
                    {role.is_system_role ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#1A1A2E] text-white">System</span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#F1F1F4] text-[#6B6B78]">Custom</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {canWrite && !role.is_system_role && (
                        <Link href={`/dashboard/roles/${role.id}/edit`}>
                          <Button variant="outline" size="icon">
                            <PencilIcon className="w-4 h-4" />
                          </Button>
                        </Link>
                      )}
                      {canDelete && !role.is_system_role && (
                        <Button
                          variant="outline"
                          size="icon"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-[#9898A3] py-8">
                  No roles found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
