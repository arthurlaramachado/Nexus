import ServiceForm from '@/components/forms/ServiceForm'
import { requirePermission } from '@/lib/auth/helpers'

export default async function NewServicePage() {
  await requirePermission('services', 'write')

  return (
    <div>
      <h1 className="text-2xl font-semibold text-[#1A1A2E] tracking-tight mb-6">New Service</h1>
      <ServiceForm />
    </div>
  )
}
