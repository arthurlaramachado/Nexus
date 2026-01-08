'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '@/components/ui/Table'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import RoleForm from '@/components/forms/RoleForm'
import { Role } from '@/types/database'

interface RolesTableProps {
  initialRoles: Role[]
}

export default function RolesTable({ initialRoles }: RolesTableProps) {
  const router = useRouter()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingRole, setEditingRole] = useState<Role | undefined>(undefined)

  const handleCreate = () => {
    setEditingRole(undefined)
    setIsModalOpen(true)
  }

  const handleEdit = (role: Role) => {
    setEditingRole(role)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingRole(undefined)
  }

  const handleSuccess = () => {
    handleCloseModal()
    router.refresh()
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Roles</h1>
        <Button onClick={handleCreate}>New Role</Button>
      </div>

      <div>
        <Table>
          <TableHead>
            <TableRow>
              <TableHeader>Name</TableHeader>
              <TableHeader>Created At</TableHeader>
              <TableHeader>Actions</TableHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            {initialRoles && initialRoles.length > 0 ? (
              initialRoles.map((role: any) => (
                <TableRow key={role.id}>
                  <TableCell>{role.name}</TableCell>
                  <TableCell>{new Date(role.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    {role.is_system_role ? (
                      <span className="text-gray-400 text-sm">System Role</span>
                    ) : (
                      <Button variant="outline" className="text-sm" onClick={() => handleEdit(role)}>
                        Edit
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-gray-500 py-8">
                  No roles found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingRole ? 'Edit Role' : 'New Role'}
      >
        <RoleForm
          role={editingRole}
          onSuccess={handleSuccess}
          onCancel={handleCloseModal}
        />
      </Modal>
    </div>
  )
}

