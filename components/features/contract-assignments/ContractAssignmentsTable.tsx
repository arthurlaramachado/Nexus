'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '@/components/ui/Table'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import ContractAssignmentForm from '@/components/forms/ContractAssignmentForm'
import { ContractAssignment } from '@/types/database'

interface ContractAssignmentsTableProps {
  initialAssignments: any[]
  contracts: Array<{ id: string; name: string; client_id: string }>
  clients: Array<{ id: string; name: string }>
  collaborators: Array<{
    id: string
    full_name: string
    role_id: string
    roles: { name: string } | null
  }>
}

export default function ContractAssignmentsTable({ 
  initialAssignments,
  contracts,
  clients,
  collaborators
}: ContractAssignmentsTableProps) {
  const router = useRouter()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingAssignment, setEditingAssignment] = useState<ContractAssignment | undefined>(undefined)

  const handleCreate = () => {
    setEditingAssignment(undefined)
    setIsModalOpen(true)
  }

  const handleEdit = (assignment: ContractAssignment) => {
    setEditingAssignment(assignment)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingAssignment(undefined)
  }

  const handleSuccess = () => {
    handleCloseModal()
    router.refresh()
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Contract Assignments</h1>
        <Button onClick={handleCreate}>New Assignment</Button>
      </div>

      <div>
        <Table>
          <TableHead>
            <TableRow>
              <TableHeader>Contract</TableHeader>
              <TableHeader>Collaborator</TableHeader>
              <TableHeader>Role</TableHeader>
              <TableHeader>Allocation</TableHeader>
              <TableHeader>Start Date</TableHeader>
              <TableHeader>End Date</TableHeader>
              <TableHeader>Actions</TableHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            {initialAssignments && initialAssignments.length > 0 ? (
              initialAssignments.map((assignment: any) => (
                <TableRow key={assignment.id}>
                  <TableCell>
                    <Link
                      href={`/dashboard/contracts/${assignment.contract_id}`}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      {assignment.contracts?.name}
                    </Link>
                    <div className="text-xs text-gray-500">
                      {assignment.contracts?.clients?.name}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/dashboard/collaborators/${assignment.collaborator_id}`}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      {assignment.collaborators?.full_name}
                    </Link>
                  </TableCell>
                  <TableCell>{assignment.role_on_contract || '-'}</TableCell>
                  <TableCell>
                    {assignment.allocation_percentage ? `${assignment.allocation_percentage}%` : '-'}
                  </TableCell>
                  <TableCell>{new Date(assignment.start_date).toLocaleDateString()}</TableCell>
                  <TableCell>
                    {assignment.end_date ? new Date(assignment.end_date).toLocaleDateString() : '-'}
                  </TableCell>
                  <TableCell>
                    <Button variant="outline" className="text-sm" onClick={() => handleEdit(assignment)}>
                      Edit
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-gray-500 py-8">
                  No assignments found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingAssignment ? 'Edit Assignment' : 'New Assignment'}
      >
        <ContractAssignmentForm
          assignment={editingAssignment}
          contracts={contracts}
          clients={clients}
          collaborators={collaborators}
          onSuccess={handleSuccess}
          onCancel={handleCloseModal}
        />
      </Modal>
    </div>
  )
}

