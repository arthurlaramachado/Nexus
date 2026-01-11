import RoleForm from '@/components/forms/RoleForm'
import { requirePermission } from '@/lib/auth/helpers'

export default async function NewRolePage() {
  await requirePermission('roles', 'write')
  
  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">New Role</h1>
      <RoleForm />
    </div>
  )
}


