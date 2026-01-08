import RoleForm from '@/components/forms/RoleForm'
import { requireRole } from '@/lib/auth/helpers'

export default async function NewRolePage() {
  await requireRole(['admin', 'manager'])
  
  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">New Role</h1>
      <RoleForm />
    </div>
  )
}

