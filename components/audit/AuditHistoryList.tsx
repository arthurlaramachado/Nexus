'use client'

import { useState } from 'react'
import { AuditLog } from '@/types/database'
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '@/components/ui/Table'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import ChangesModal from '@/components/audit/ChangesModal'
import { formatDateTime } from '@/lib/utils/formatting'
import { EyeIcon } from '@heroicons/react/24/outline'

interface AuditHistoryListProps {
  auditLogs: AuditLog[]
}

export default function AuditHistoryList({ auditLogs }: AuditHistoryListProps) {
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null)
  const getActionBadgeVariant = (action: string) => {
    switch (action) {
      case 'insert':
        return 'success'
      case 'update':
        return 'info'
      case 'delete':
        return 'danger'
      default:
        return 'default'
    }
  }

  const getActionLabel = (action: string) => {
    switch (action) {
      case 'insert':
        return 'Created'
      case 'update':
        return 'Updated'
      case 'delete':
        return 'Deleted'
      default:
        return action
    }
  }

  if (auditLogs.length === 0) {
    return (
      <div className="text-center text-[#9898A3] py-8">
        No history found
      </div>
    )
  }

  const getChangesCount = (log: AuditLog): number => {
    if (Array.isArray(log.changes)) {
      return log.changes.filter((c: any) => c && c.field).length
    } else if (log.changes && typeof log.changes === 'object') {
      const systemFields = ['id', 'created_at', 'updated_at']
      return Object.keys(log.changes).filter(key => !systemFields.includes(key)).length
    }
    return 0
  }

  return (
    <>
      <Table>
        <TableHead>
          <TableRow>
            <TableHeader>Date</TableHeader>
            <TableHeader>Action</TableHeader>
            <TableHeader>Changes</TableHeader>
            <TableHeader className="text-right">Details</TableHeader>
          </TableRow>
        </TableHead>
        <TableBody>
          {auditLogs.map((log) => {
            const changesCount = getChangesCount(log)
            return (
              <TableRow key={log.id}>
                <TableCell className="text-sm text-[#6B6B78]">
                  {formatDateTime(log.created_at)}
                </TableCell>
                <TableCell>
                  <Badge variant={getActionBadgeVariant(log.action)}>
                    {getActionLabel(log.action)}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-[#6B6B78]">
                  {changesCount} {changesCount === 1 ? 'field' : 'fields'} changed
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedLog(log)}
                    className="flex items-center gap-2"
                  >
                    <EyeIcon className="w-4 h-4" />
                    View Details
                  </Button>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>

      {selectedLog && (
        <ChangesModal
          isOpen={!!selectedLog}
          onClose={() => setSelectedLog(null)}
          changes={selectedLog.changes}
          action={selectedLog.action}
          title={`Change Details - ${formatDateTime(selectedLog.created_at)}`}
        />
      )}
    </>
  )
}
