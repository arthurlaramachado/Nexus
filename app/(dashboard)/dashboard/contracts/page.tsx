import { createClient } from '@/lib/supabase/server'
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '@/components/ui/Table'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Link from 'next/link'

export default async function ContractsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; contract_type?: string; client_id?: string }>
}) {
  const { status, contract_type, client_id } = await searchParams
  const supabase = await createClient()
  
  let query = supabase
    .from('contracts')
    .select('*, clients(name)')
    .order('created_at', { ascending: false })

  if (status) {
    query = query.eq('status', status)
  }
  if (contract_type) {
    query = query.eq('contract_type', contract_type)
  }
  if (client_id) {
    query = query.eq('client_id', client_id)
  }

  const { data: contracts, error } = await query

  if (error) {
    return <div>Error loading contracts: {error.message}</div>
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Contracts</h1>
        <Link href="/dashboard/contracts/new">
          <Button>New Contract</Button>
        </Link>
      </div>

      <div>
        <Table>
          <TableHead>
            <TableRow>
              <TableHeader>Name</TableHeader>
              <TableHeader>Client</TableHeader>
              <TableHeader>Type</TableHeader>
              <TableHeader>Status</TableHeader>
              <TableHeader>Start Date</TableHeader>
              <TableHeader>End Date</TableHeader>
              <TableHeader>Value</TableHeader>
              <TableHeader>Actions</TableHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            {contracts && contracts.length > 0 ? (
              contracts.map((contract: any) => (
                <TableRow key={contract.id}>
                  <TableCell>
                    <Link
                      href={`/dashboard/contracts/${contract.id}`}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      {contract.name}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/dashboard/clients/${contract.client_id}`}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      {contract.clients?.name || '-'}
                    </Link>
                  </TableCell>
                  <TableCell>{contract.contract_type}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        contract.status === 'active'
                          ? 'success'
                          : contract.status === 'paused'
                          ? 'warning'
                          : 'default'
                      }
                    >
                      {contract.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{new Date(contract.start_date).toLocaleDateString()}</TableCell>
                  <TableCell>
                    {contract.end_date ? new Date(contract.end_date).toLocaleDateString() : '-'}
                  </TableCell>
                  <TableCell>
                    {contract.contract_value
                      ? new Intl.NumberFormat('en-US', {
                          style: 'currency',
                          currency: 'USD',
                        }).format(contract.contract_value)
                      : '-'}
                  </TableCell>
                  <TableCell>
                    <Link href={`/dashboard/contracts/${contract.id}/edit`}>
                      <Button variant="outline" className="text-sm">
                        Edit
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-gray-500 py-8">
                  No contracts found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

