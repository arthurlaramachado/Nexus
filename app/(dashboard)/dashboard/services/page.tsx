import Button from '@/components/ui/Button'
import Link from 'next/link'
import { requirePermission, checkPermission } from '@/lib/auth/helpers'
import ServiceFilters from '@/components/filters/ServiceFilters'
import ServicesList from '@/components/features/services/ServicesList'

export default async function ServicesPage() {
  await requirePermission('services', 'read')
  const canWrite = await checkPermission('services', 'write')
  const canDelete = await checkPermission('services', 'delete')

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-[#1A1A2E] tracking-tight">Services</h1>
        {canWrite && (
          <Link href="/dashboard/services/new">
            <Button>New Service</Button>
          </Link>
        )}
      </div>

      <div className="mb-6">
        <ServiceFilters />
      </div>

      <ServicesList canWrite={canWrite} canDelete={canDelete} />
    </div>
  )
}
