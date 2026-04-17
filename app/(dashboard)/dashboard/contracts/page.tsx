import { createClient } from '@/lib/supabase/server'
import Button from '@/components/ui/Button'
import Link from 'next/link'
import { requirePermission, checkPermission } from '@/lib/auth/helpers'
import ContractFilters from '@/components/filters/ContractFilters'
import ContractsList from '@/components/features/contracts/ContractsList'

export default async function ContractsPage() {
  await requirePermission('contracts', 'read')
  const canWrite = await checkPermission('contracts', 'write')
  const supabase = await createClient()

  const { data: clients } = await supabase
    .from('clients')
    .select('id, name')
    .order('name')

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-[#1A1A2E] tracking-tight">Contracts</h1>
        {canWrite && (
          <Link href="/dashboard/contracts/new">
            <Button>New Contract</Button>
          </Link>
        )}
      </div>

      <div className="mb-6">
        <ContractFilters clients={clients || []} />
      </div>

      <ContractsList canWrite={canWrite} />
    </div>
  )
}

