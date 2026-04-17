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
import { Client, Contract, AuditLog } from '@/types/database'
import AuditHistoryList from '@/components/audit/AuditHistoryList'

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
  auditLogs: AuditLog[]
}

export default function ClientDetail({ client, contracts, auditLogs }: ClientDetailProps) {
  const router = useRouter()
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleSuccess = () => {
    setIsModalOpen(false)
    router.refresh()
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold text-[#1A1A2E] tracking-tight">{client.name}</h1>
          <Badge variant={client.status === 'active' ? 'active' : 'inactive'}>
            {client.status}
          </Badge>
        </div>
        <Button variant="secondary" onClick={() => setIsModalOpen(true)}>Edit Client</Button>
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Card title="Client Information">
          <dl className="grid grid-cols-2 gap-4">
            <div>
              <dt className="text-[13px] text-[#6B6B78]">Country</dt>
              <dd className="mt-1 text-sm text-[#1A1A2E]">{client.country || '-'}</dd>
            </div>
            <div>
              <dt className="text-[13px] text-[#6B6B78]">City</dt>
              <dd className="mt-1 text-sm text-[#1A1A2E]">{client.city || '-'}</dd>
            </div>
            <div>
              <dt className="text-[13px] text-[#6B6B78]">Tags</dt>
              <dd className="mt-1 text-sm text-[#1A1A2E]">
                <div className="flex flex-wrap gap-1">
                  {client.client_tags && client.client_tags.length > 0 ? (
                    client.client_tags.map((ct: any, idx: number) => (
                      <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-[#F1F1F4] text-[#6B6B78]">
                        {ct.tags?.name}
                      </span>
                    ))
                  ) : (
                    '-'
                  )}
                </div>
              </dd>
            </div>
            <div>
              <dt className="text-[13px] text-[#6B6B78]">Created At</dt>
              <dd className="mt-1 text-sm text-[#1A1A2E]">
                {formatDate(client.created_at)}
              </dd>
            </div>
          </dl>
        </Card>
      </div>

      <div className="mb-6">
        <Card title="Contracts" headerAction={
          <Link href={`/dashboard/contracts/new?client_id=${client.id}`}>
            <Button variant="ghost" size="sm">+ Add Contract</Button>
          </Link>
        }>
          {contracts && contracts.length > 0 ? (
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeader>Name</TableHeader>
                  <TableHeader>Status</TableHeader>
                  <TableHeader>Termination Reason</TableHeader>
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
                        className="text-[#3B82F6] hover:text-[#2563EB] font-medium"
                      >
                        {contract.name}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Badge variant={contract.status === 'ACTIVE' ? 'active' : 'ended'}>
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
                    <TableCell>{formatDate(contract.start_date)}</TableCell>
                    <TableCell>
                      {contract.end_date ? formatDate(contract.end_date) : '-'}
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(contract.current_value)}
                    </TableCell>
                    <TableCell>
                      <Link href={`/dashboard/contracts/${contract.id}`}>
                        <Button variant="ghost" size="sm">View</Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-[#9898A3] text-sm">No contracts found for this client.</p>
          )}
        </Card>
      </div>

      <Card title="Change History">
        <AuditHistoryList auditLogs={auditLogs} />
      </Card>
    </div>
  )
}
