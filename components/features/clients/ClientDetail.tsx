'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Modal from '@/components/ui/Modal'
import ClientForm from '@/components/forms/ClientForm'
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '@/components/ui/Table'
import { formatDate, formatCurrency } from '@/lib/utils/formatting'
import { Client, Contract } from '@/types/database'

interface ClientWithTags extends Client {
  client_tags?: {
    tags: {
      id: string
      name: string
    }
  }[]
}

interface ClientDetailProps {
  client: ClientWithTags
  contracts: Contract[]
}

export default function ClientDetail({ client, contracts }: ClientDetailProps) {
  const router = useRouter()
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleSuccess = () => {
    setIsModalOpen(false)
    router.refresh()
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{client.name}</h1>
          <Badge variant={client.status === 'active' ? 'success' : 'default'} className="mt-2">
            {client.status}
          </Badge>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>Edit Client</Button>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Edit Client"
      >
        <ClientForm
          client={client}
          onSuccess={handleSuccess}
          onCancel={() => setIsModalOpen(false)}
        />
      </Modal>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card title="Client Information">
          <dl className="space-y-4">
            <div>
              <dt className="text-sm font-medium text-gray-500">Country</dt>
              <dd className="mt-1 text-sm text-gray-900">{client.country || '-'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">City</dt>
              <dd className="mt-1 text-sm text-gray-900">{client.city || '-'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Tags</dt>
              <dd className="mt-1 text-sm text-gray-900">
                <div className="flex flex-wrap gap-1">
                  {client.client_tags && client.client_tags.length > 0 ? (
                    client.client_tags.map((ct: any, idx: number) => (
                      <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                        {ct.tags?.name}
                      </span>
                    ))
                  ) : (
                    '-'
                  )}
                </div>
              </dd>
            </div>
            {/* Unique ID removed as requested */}
            <div>
              <dt className="text-sm font-medium text-gray-500">Created At</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {formatDate(client.created_at)}
              </dd>
            </div>
          </dl>
        </Card>
      </div>

      <Card title="Contracts">
        {contracts && contracts.length > 0 ? (
          <Table>
            <TableHead>
              <TableRow>
                <TableHeader>Name</TableHeader>
                <TableHeader>Type</TableHeader>
                <TableHeader>Status</TableHeader>
                <TableHeader>Start Date</TableHeader>
                <TableHeader>End Date</TableHeader>
                <TableHeader>Value</TableHeader>
                <TableHeader>Actions</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {contracts.map((contract) => (
                <TableRow key={contract.id}>
                  <TableCell>
                    <Link
                      href={`/dashboard/contracts/${contract.id}`}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      {contract.name}
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
                  <TableCell>{formatDate(contract.start_date)}</TableCell>
                  <TableCell>
                    {contract.end_date ? formatDate(contract.end_date) : '-'}
                  </TableCell>
                  <TableCell>
                    {formatCurrency(contract.contract_value)}
                  </TableCell>
                  <TableCell>
                    <Link href={`/dashboard/contracts/${contract.id}`}>
                      <Button variant="outline" className="text-sm">
                        View
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p className="text-gray-500">No contracts found for this client.</p>
        )}
        <div className="mt-4">
          <Link href={`/dashboard/contracts/new?client_id=${client.id}`}>
            <Button>Add Contract</Button>
          </Link>
        </div>
      </Card>
    </div>
  )
}


