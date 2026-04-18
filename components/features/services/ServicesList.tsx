'use client'

import { useServices } from '@/hooks/useServices'
import { useSearchParams } from 'next/navigation'
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '@/components/ui/Table'
import Button from '@/components/ui/Button'
import Link from 'next/link'
import { PencilSquareIcon, TrashIcon } from '@heroicons/react/24/outline'
import { useState } from 'react'
import { deleteService } from '@/lib/services/actions'

export default function ServicesList({ canWrite, canDelete }: { canWrite: boolean; canDelete: boolean }) {
  const searchParams = useSearchParams()
  const search = searchParams.get('search') || undefined
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const { data: services, isLoading, refetch } = useServices({ search })

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this service?')) return

    setDeletingId(id)
    setError(null)

    try {
      await deleteService(id)
      refetch()
    } catch (err: any) {
      setError(err.message || 'Failed to delete service')
    } finally {
      setDeletingId(null)
    }
  }

  if (isLoading && !services) {
    return <div className="animate-pulse space-y-4">
      <div className="h-64 bg-[#E4E4E8] rounded-xl"></div>
    </div>
  }

  return (
    <>
      {error && (
        <div className="bg-[#FEE2E2] border border-[#EF4444]/20 text-[#991B1B] px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <Table>
        <TableHead>
          <TableRow>
            <TableHeader>Name</TableHeader>
            <TableHeader>Description</TableHeader>
            <TableHeader>Created</TableHeader>
            <TableHeader className="text-right">Actions</TableHeader>
          </TableRow>
        </TableHead>
        <TableBody>
          {services && services.length > 0 ? (
            services.map((service: any) => (
              <TableRow key={service.id}>
                <TableCell>
                  <Link
                    href={`/dashboard/services/${service.id}`}
                    className="text-[#3B82F6] hover:text-[#2563EB] font-medium"
                  >
                    {service.name}
                  </Link>
                </TableCell>
                <TableCell className="text-[#6B6B78] max-w-xs truncate">
                  {service.description || '-'}
                </TableCell>
                <TableCell>
                  {new Date(service.created_at).toLocaleDateString()}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    {canWrite && (
                      <Link href={`/dashboard/services/${service.id}/edit`}>
                        <Button variant="ghost" size="sm" className="p-2" title="Edit Service">
                          <PencilSquareIcon className="w-4 h-4" />
                        </Button>
                      </Link>
                    )}
                    {canDelete && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="p-2 text-[#EF4444] hover:text-[#DC2626]"
                        title="Delete Service"
                        onClick={() => handleDelete(service.id)}
                        disabled={deletingId === service.id}
                      >
                        <TrashIcon className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={4} className="text-center text-[#9898A3] py-8">
                No services found
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </>
  )
}
