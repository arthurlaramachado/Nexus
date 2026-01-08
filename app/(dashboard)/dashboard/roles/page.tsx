import { createClient } from '@/lib/supabase/server'
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '@/components/ui/Table'
import Button from '@/components/ui/Button'
import Link from 'next/link'
import Badge from '@/components/ui/Badge'

export default async function RolesPage() {
  const supabase = await createClient()
  
  const { data: roles, error } = await supabase
    .from('roles')
    .select('*')
    .order('name')

  if (error) {
    return <div>Error loading roles: {error.message}</div>
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Roles</h1>
        <Link href="/dashboard/roles/new">
          <Button>New Role</Button>
        </Link>
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
                  <TableCell className="font-medium text-gray-900">{role.name}</TableCell>
                  <TableCell>
                    {role.is_system_role ? (
                      <Badge variant="info">System</Badge>
                    ) : (
                      <Badge variant="default">Custom</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {!role.is_system_role && (
                      <Link href={`/dashboard/roles/${role.id}/edit`}>
                        <Button variant="outline" className="text-sm">
                          Edit
                        </Button>
                      </Link>
                    )}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-gray-500 py-8">
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
