import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import RoleForm from '@/components/forms/RoleForm'
import { requirePermission } from '@/lib/auth/helpers'

export default async function EditRolePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await requirePermission('roles', 'write')
  const supabase = await createClient()
  const { data: role, error } = await supabase
    .from('roles')
    .select('*, role_permissions(*)')
    .eq('id', id)
    .single()

  if (error || !role) {
    notFound()
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Edit Role</h1>
      <RoleForm role={role} />
    </div>
  )
}

