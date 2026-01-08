'use client'

import { useState } from 'react'
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '@/components/ui/Table'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import AuditChanges from '@/components/audit/AuditChanges'
import {
  formatTimeDifference,
  getTimeDifferenceBadgeVariant,
} from '@/lib/audit/calculations'

interface AuditLogsTableProps {
  logs: any[]
}

export default function AuditLogsTable({ logs }: AuditLogsTableProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedLog, setSelectedLog] = useState<any | null>(null)

  const handleViewChanges = (log: any) => {
    setSelectedLog(log)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedLog(null)
  }

  return (
    <div>
      <Table>
        <TableHead>
          <TableRow>
            <TableHeader>Date & Time</TableHeader>
            <TableHeader>User</TableHeader>
            <TableHeader>Table</TableHeader>
            <TableHeader>Action</TableHeader>
            <TableHeader>Record ID</TableHeader>
            <TableHeader>Time Difference</TableHeader>
            <TableHeader>Changes</TableHeader>
          </TableRow>
        </TableHead>
        <TableBody>
          {logs && logs.length > 0 ? (
            logs.map((log: any) => (
              <TableRow key={log.id}>
                <TableCell>
                  {new Date(log.created_at).toLocaleString()}
                </TableCell>
                <TableCell>
                  {log.collaborator?.full_name || log.user_id || 'System'}
                </TableCell>
                <TableCell>{log.table_name}</TableCell>
                <TableCell>
                  <Badge
                    variant={
                      log.action === 'insert'
                        ? 'success'
                        : log.action === 'update'
                        ? 'info'
                        : 'danger'
                    }
                  >
                    {log.action}
                  </Badge>
                </TableCell>
                <TableCell className="font-mono text-xs">
                  {log.record_id.substring(0, 8)}...
                </TableCell>
                <TableCell>
                  {log.timeDifference !== null ? (
                    <div>
                      <Badge variant={getTimeDifferenceBadgeVariant(log.timeDifference)}>
                        {formatTimeDifference(log.timeDifference)}
                      </Badge>
                      {log.timeDifferenceField && (
                        <div className="text-xs text-gray-500 mt-1">
                          ({log.timeDifferenceField})
                        </div>
                      )}
                    </div>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </TableCell>
                <TableCell>
                  <Button variant="outline" className="text-xs" onClick={() => handleViewChanges(log)}>
                    View Details
                  </Button>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={7} className="text-center text-gray-500 py-8">
                No audit logs found
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title="Audit Log Details"
      >
        {selectedLog && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm bg-gray-50 p-4 rounded-lg">
              <div>
                <span className="font-semibold block text-gray-700">Date:</span>
                {new Date(selectedLog.created_at).toLocaleString()}
              </div>
              <div>
                <span className="font-semibold block text-gray-700">User:</span>
                {selectedLog.collaborator?.full_name || selectedLog.user_id || 'System'}
              </div>
              <div>
                <span className="font-semibold block text-gray-700">Table:</span>
                {selectedLog.table_name}
              </div>
              <div>
                <span className="font-semibold block text-gray-700">Action:</span>
                <span className="capitalize">{selectedLog.action}</span>
              </div>
            </div>
            
            <div className="pt-2">
               <h3 className="font-medium text-gray-900 mb-2">Changes</h3>
               {/* We can reuse AuditChanges but maybe modify it to always be expanded or just render differently. 
                   AuditChanges uses details/summary which is collapsible. 
                   Inside a modal, we probably want it expanded by default or just listed.
                   The current implementation of AuditChanges handles the logic of parsing changes nicely.
                   We can wrap it in a div and use CSS to force expansion or just click it programmatically? 
                   Actually, AuditChanges implementation:
                   <details className="cursor-pointer group"> ... </details>
                   
                   If I want it expanded, I can add `open` attribute. But `AuditChanges` doesn't accept props for it.
                   However, passing `changes` to it will render the details.
                   Let's stick with AuditChanges for now. 
               */}
               <AuditChanges changes={selectedLog.changes} action={selectedLog.action} />
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

