import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { requirePermission, checkPermission } from '@/lib/auth/helpers'
import Button from '@/components/ui/Button'
import Link from 'next/link'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '@/components/ui/Table'
import { PencilIcon } from '@heroicons/react/24/outline'

export default async function ServiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await requirePermission('services', 'read')
  const canWrite = await checkPermission('services', 'write')

  const supabase = await createClient()

  const { data: service, error: serviceError } = await supabase
    .from('services')
    .select('*')
    .eq('id', id)
    .single()

  if (serviceError || !service) {
    notFound()
  }

  // Fetch contracts linked to this service
  const { data: contractServices } = await supabase
    .from('contract_services')
    .select('*, contracts(id, name, status, clients(name))')
    .eq('service_id', id)
    .order('created_at', { ascending: false })

  return (
    <div>
      <div className="flex justify-between items-start mb-6">
        <div>
          <div className="text-[13px] text-[#6B6B78] mb-2">
            <Link href="/dashboard/services" className="hover:text-[#3B82F6]">Services</Link>
            <span className="mx-1">/</span>
            <span>{service.name}</span>
          </div>
          <h1 className="text-2xl font-semibold text-[#1A1A2E] tracking-tight">{service.name}</h1>
        </div>
        {canWrite && (
          <Link href={`/dashboard/services/${id}/edit`}>
            <Button className="flex items-center gap-2">
              <PencilIcon className="w-4 h-4" />
              Edit
            </Button>
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="md:col-span-1">
          <Card title="Service Information">
            <dl className="space-y-4">
              <div>
                <dt className="text-sm font-medium text-[#9898A3]">Name</dt>
                <dd className="mt-1 text-sm text-[#1A1A2E]">{service.name}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-[#9898A3]">Description</dt>
                <dd className="mt-1 text-sm text-[#1A1A2E]">{service.description || '-'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-[#9898A3]">Created</dt>
                <dd className="mt-1 text-sm text-[#1A1A2E]">
                  {new Date(service.created_at).toLocaleDateString()}
                </dd>
              </div>
            </dl>
          </Card>
        </div>

        <div className="md:col-span-2">
          <Card title="Linked Contracts">
            {contractServices && contractServices.length > 0 ? (
              <Table>
                <TableHead>
                  <TableRow>
                    <TableHeader>Contract</TableHeader>
                    <TableHeader>Client</TableHeader>
                    <TableHeader>Status</TableHeader>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {contractServices.map((cs: any) => (
                    <TableRow key={cs.id}>
                      <TableCell>
                        <Link
                          href={`/dashboard/contracts/${cs.contracts?.id}`}
                          className="text-[#3B82F6] hover:text-[#2563EB] font-medium"
                        >
                          {cs.contracts?.name || '-'}
                        </Link>
                      </TableCell>
                      <TableCell>
                        {cs.contracts?.clients?.name || '-'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={cs.contracts?.status === 'ACTIVE' ? 'active' : 'ended'}>
                          {cs.contracts?.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="py-12 text-center">
                <p className="text-[#9898A3] italic">No contracts linked to this service yet.</p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}
