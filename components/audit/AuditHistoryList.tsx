'use client'

import { AuditLog } from '@/types/database'
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '@/components/ui/Table'
import Badge from '@/components/ui/Badge'
import AuditChanges from '@/components/audit/AuditChanges'
import { formatDateTime } from '@/lib/utils/formatting'

interface AuditHistoryListProps {
  auditLogs: AuditLog[]
}

export default function AuditHistoryList({ auditLogs }: AuditHistoryListProps) {
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
      <div className="text-center text-gray-500 py-8">
        No history found
      </div>
    )
  }

  return (
    <Table>
      <TableHead>
        <TableRow>
          <TableHeader>Date</TableHeader>
          <TableHeader>Action</TableHeader>
          <TableHeader>Changes</TableHeader>
        </TableRow>
      </TableHead>
      <TableBody>
        {auditLogs.map((log) => (
          <TableRow key={log.id}>
            <TableCell className="text-sm text-gray-600">
              {formatDateTime(log.created_at)}
            </TableCell>
            <TableCell>
              <Badge variant={getActionBadgeVariant(log.action)}>
                {getActionLabel(log.action)}
              </Badge>
            </TableCell>
            <TableCell>
              <AuditChanges changes={log.changes} action={log.action} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
