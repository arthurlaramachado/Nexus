'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '@/components/ui/Table'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import CollaboratorForm from '@/components/forms/CollaboratorForm'
import { Collaborator } from '@/types/database'

interface CollaboratorsTableProps {
  initialCollaborators: any[]
  roles: Array<{ id: string; name: string }>
}

export default function CollaboratorsTable({ initialCollaborators, roles }: CollaboratorsTableProps) {
  const router = useRouter()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCollaborator, setEditingCollaborator] = useState<Collaborator | undefined>(undefined)

  const handleCreate = () => {
    setEditingCollaborator(undefined)
    setIsModalOpen(true)
  }

  const handleEdit = (collaborator: Collaborator) => {
    setEditingCollaborator(collaborator)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingCollaborator(undefined)
  }

  const handleSuccess = () => {
    handleCloseModal()
    router.refresh()
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Collaborators</h1>
        <Button onClick={handleCreate}>New Collaborator</Button>
      </div>

      <div>
        <Table>
          <TableHead>
            <TableRow>
              <TableHeader>Name</TableHeader>
              <TableHeader>Email</TableHeader>
              <TableHeader>Role</TableHeader>
              <TableHeader>Status</TableHeader>
              <TableHeader>Joined Date</TableHeader>
              <TableHeader>Actions</TableHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            {initialCollaborators && initialCollaborators.length > 0 ? (
              initialCollaborators.map((collaborator: any) => (
                <TableRow key={collaborator.id}>
                  <TableCell>
                    <Link
                      href={`/dashboard/collaborators/${collaborator.id}`}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      {collaborator.full_name}
                    </Link>
                  </TableCell>
                  <TableCell>{collaborator.email}</TableCell>
                  <TableCell>{collaborator.roles?.name}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        collaborator.status === 'active'
                          ? 'success'
                          : collaborator.status === 'invited'
                          ? 'warning'
                          : 'default'
                      }
                    >
                      {collaborator.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{new Date(collaborator.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Button variant="outline" className="text-sm" onClick={() => handleEdit(collaborator)}>
                      Edit
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                  No collaborators found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingCollaborator ? 'Edit Collaborator' : 'New Collaborator'}
      >
        <CollaboratorForm
          collaborator={editingCollaborator}
          roles={roles}
          onSuccess={handleSuccess}
          onCancel={handleCloseModal}
        />
      </Modal>
    </div>
  )
}

