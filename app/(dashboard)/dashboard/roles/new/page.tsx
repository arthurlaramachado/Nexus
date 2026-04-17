import RoleForm from '@/components/forms/RoleForm'
import { requirePermission } from '@/lib/auth/helpers'

export default async function NewRolePage() {
  await requirePermission('roles', 'write')
  
  return (
    <div>
      <h1 className="text-2xl font-semibold text-[#1A1A2E] tracking-tight mb-6">New Role</h1>
      <RoleForm />
    </div>
  )
}


