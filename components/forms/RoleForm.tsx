'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { roleSchema, RoleFormData } from '@/lib/validations/role'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { createClient } from '@/lib/supabase/client'
import { Role } from '@/types/database'
import Checkbox from '@/components/ui/Checkbox'

const TABLES = [
  'roles',
  'collaborators',
  'clients',
  'tags',
  'contracts',
  'contract_assignments',
  'audit_logs',
]

interface RoleWithPermissions extends Role {
  role_permissions?: {
    table_name: string
    can_read: boolean
    can_write: boolean
    can_delete: boolean
  }[]
}

interface RoleFormProps {
  role?: RoleWithPermissions
}

export default function RoleForm({ role }: RoleFormProps) {
  const router = useRouter()
  const supabase = createClient()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // Initialize permissions record
  const initialPermissions: Record<string, { can_read: boolean; can_write: boolean; can_delete: boolean }> = {}
  TABLES.forEach(table => {
    const existing = role?.role_permissions?.find(p => p.table_name === table)
    initialPermissions[table] = {
      can_read: existing?.can_read || false,
      can_write: existing?.can_write || false,
      can_delete: existing?.can_delete || false,
    }
  })

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<RoleFormData>({
    resolver: zodResolver(roleSchema),
    defaultValues: {
      name: role?.name || '',
      permissions: initialPermissions,
    },
  })

  const permissions = watch('permissions') || {}

  const onSubmit = async (data: RoleFormData) => {
    setError(null)
    setLoading(true)

    try {
      const roleData = {
        name: data.name,
      }

      let roleId = role?.id

      if (roleId) {
        const { error: updateError } = await supabase
          .from('roles')
          .update(roleData)
          .eq('id', roleId)

        if (updateError) throw updateError
      } else {
        const { data: newRole, error: insertError } = await supabase
          .from('roles')
          .insert(roleData)
          .select()
          .single()

        if (insertError) throw insertError
        roleId = newRole.id
      }

      // Upsert permissions
      const permissionEntries = Object.entries(data.permissions || {}).map(([tableName, perms]) => ({
        role_id: roleId,
        table_name: tableName,
        ...perms,
      }))

      if (permissionEntries.length > 0) {
        const { error: permError } = await supabase
          .from('role_permissions')
          .upsert(permissionEntries, { onConflict: 'role_id,table_name' })

        if (permError) throw permError
      }

      router.push('/dashboard/roles')
      router.refresh()
    } catch (err: any) {
      setError(err.message || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const togglePermission = (table: string, type: 'can_read' | 'can_write' | 'can_delete') => {
    const current = permissions[table] || { can_read: false, can_write: false, can_delete: false }
    setValue(`permissions.${table}`, {
      ...current,
      [type]: !current[type],
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 max-w-4xl">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h2 className="text-lg font-semibold mb-4 text-gray-900">General Information</h2>
        <Input
          label="Role Name *"
          {...register('name')}
          error={errors.name?.message}
          placeholder="e.g. Senior CSM"
        />
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Table Permissions</h2>
          <p className="text-sm text-gray-500 mt-1">Select the access level for each module.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Module / Table</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Read</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Write</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Delete</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {TABLES.map((table) => (
                <tr key={table}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 capitalize">
                    {table.replace('_', ' ')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <div className="flex justify-center">
                      <Checkbox
                        checked={permissions[table]?.can_read || false}
                        onChange={() => togglePermission(table, 'can_read')}
                      />
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <div className="flex justify-center">
                      <Checkbox
                        checked={permissions[table]?.can_write || false}
                        onChange={() => togglePermission(table, 'can_write')}
                      />
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <div className="flex justify-center">
                      <Checkbox
                        checked={permissions[table]?.can_delete || false}
                        onChange={() => togglePermission(table, 'can_delete')}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex gap-4">
        <Button type="submit" disabled={loading}>
          {loading ? 'Saving...' : role ? 'Update Role' : 'Create Role'}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
        >
          Cancel
        </Button>
      </div>
    </form>
  )
}
