'use client'

import ClientFilters from '@/components/filters/ClientFilters'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '@/components/ui/Table'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import ClientForm from '@/components/forms/ClientForm'
import { Client } from '@/types/database'
import { PencilIcon } from '@heroicons/react/24/outline'

interface ClientWithTags extends Client {
  client_tags?: {
    tags: {
      name: string
    }
  }[]
}

interface ClientsTableProps {
  clients: ClientWithTags[]
}

export default function ClientsTable({ clients }: ClientsTableProps) {
  const router = useRouter()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | undefined>(undefined)

  const handleCreate = () => {
    setEditingClient(undefined)
    setIsModalOpen(true)
  }

  const handleEdit = (client: Client) => {
    setEditingClient(client)
    setIsModalOpen(true)
  }

  const handleSuccess = () => {
    setIsModalOpen(false)
    router.refresh()
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-[#1A1A2E] tracking-tight">Clients</h1>
        <Button onClick={handleCreate}>+ New Client</Button>
      </div>

      <div className="mb-6">
        <ClientFilters />
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingClient ? 'Edit Client' : 'New Client'}
      >
        <ClientForm
          client={editingClient}
          onSuccess={handleSuccess}
          onCancel={() => setIsModalOpen(false)}
        />
      </Modal>

      <div className="mt-6">
        <Table>
          <TableHead>
            <TableRow>
              <TableHeader>Name</TableHeader>
              <TableHeader>Status</TableHeader>
              <TableHeader>Country</TableHeader>
              <TableHeader>City</TableHeader>
              <TableHeader>Tags</TableHeader>
              <TableHeader>Actions</TableHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            {clients && clients.length > 0 ? (
              clients.map((client) => (
                <TableRow key={client.id}>
                  <TableCell>
                    <Link
                      href={`/dashboard/clients/${client.id}`}
                      className="text-[#3B82F6] hover:text-[#2563EB] font-medium"
                    >
                      {client.name}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Badge variant={client.status === 'active' ? 'active' : 'inactive'}>
                      {client.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{client.country || '-'}</TableCell>
                  <TableCell>{client.city || '-'}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {client.client_tags?.map((ct: any, idx: number) => (
                        <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-[#F1F1F4] text-[#6B6B78]">
                          {ct.tags?.name}
                        </span>
                      ))}
                      {(!client.client_tags || client.client_tags.length === 0) && '-'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(client)}
                    >
                      <PencilIcon className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-[#9898A3] py-8">
                  No clients found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
