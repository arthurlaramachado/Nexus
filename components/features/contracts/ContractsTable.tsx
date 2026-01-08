'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '@/components/ui/Table'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import ContractForm from '@/components/forms/ContractForm'
import { Contract } from '@/types/database'

interface ContractsTableProps {
  initialContracts: any[]
  clients: Array<{ id: string; name: string }>
}

export default function ContractsTable({ initialContracts, clients }: ContractsTableProps) {
  const router = useRouter()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingContract, setEditingContract] = useState<Contract | undefined>(undefined)

  const handleCreate = () => {
    setEditingContract(undefined)
    setIsModalOpen(true)
  }

  const handleEdit = (contract: Contract) => {
    setEditingContract(contract)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingContract(undefined)
  }

  const handleSuccess = () => {
    handleCloseModal()
    router.refresh()
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Contracts</h1>
        <Button onClick={handleCreate}>New Contract</Button>
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
            {initialContracts && initialContracts.length > 0 ? (
              initialContracts.map((contract: any) => (
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
                    <Button variant="outline" className="text-sm" onClick={() => handleEdit(contract)}>
                      Edit
                    </Button>
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

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingContract ? 'Edit Contract' : 'New Contract'}
      >
        <ContractForm
          contract={editingContract}
          clients={clients}
          onSuccess={handleSuccess}
          onCancel={handleCloseModal}
        />
      </Modal>
    </div>
  )
}

