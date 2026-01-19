'use client'

import { useContracts } from '@/hooks/useContracts'
import { useSearchParams } from 'next/navigation'
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '@/components/ui/Table'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Link from 'next/link'
import { PencilSquareIcon } from '@heroicons/react/24/outline'

export default function ContractsList({ canWrite }: { canWrite: boolean }) {
  const searchParams = useSearchParams()
  const status = searchParams.get('status') || undefined
  const client_id = searchParams.get('client_id') || undefined

  const { data: contracts, isLoading } = useContracts({ status, client_id })

  if (isLoading && !contracts) {
    return <div className="animate-pulse space-y-4">
      <div className="h-64 bg-gray-200 rounded"></div>
    </div>
  }

  return (
    <Table>
      <TableHead>
        <TableRow>
          <TableHeader>Name</TableHeader>
          <TableHeader>Client</TableHeader>
          <TableHeader>Status</TableHeader>
          <TableHeader>Termination Reason</TableHeader>
          <TableHeader>Start Date</TableHeader>
          <TableHeader>End Date</TableHeader>
          <TableHeader>Value</TableHeader>
          <TableHeader className="text-right">Actions</TableHeader>
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
              <TableCell>
                <Badge
                  variant={
                    contract.status === 'ACTIVE'
                      ? 'success'
                      : 'default'
                  }
                >
                  {contract.status}
                </Badge>
              </TableCell>
              <TableCell>
                {contract.termination_reason ? (
                  <Badge variant="warning">
                    {contract.termination_reason === 'NOT_RENEWED' ? 'Not Renewed' :
                     contract.termination_reason === 'CHURN' ? 'Churn' :
                     contract.termination_reason === 'CUT' ? 'Cut' :
                     contract.termination_reason === 'RENEWED' ? 'Renewed' :
                     contract.termination_reason}
                  </Badge>
                ) : (
                  '-'
                )}
              </TableCell>
              <TableCell>{new Date(contract.start_date).toLocaleDateString()}</TableCell>
              <TableCell>
                {contract.end_date ? new Date(contract.end_date).toLocaleDateString() : '-'}
              </TableCell>
              <TableCell>
                {contract.current_value
                  ? new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: 'USD',
                    }).format(contract.current_value)
                  : '-'}
              </TableCell>
              <TableCell className="text-right">
                {canWrite && (
                  <Link href={`/dashboard/contracts/${contract.id}/edit`}>
                    <Button variant="outline" size="sm" className="p-2" title="Edit Contract">
                      <PencilSquareIcon className="w-4 h-4" />
                    </Button>
                  </Link>
                )}
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
  )
}
