'use client'

import { useState } from 'react'
import { ContractLog, AuditLog } from '@/types/database'
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '@/components/ui/Table'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import ChangesModal from '@/components/audit/ChangesModal'
import { formatCurrency, formatDateTime } from '@/lib/utils/formatting'
import { EyeIcon } from '@heroicons/react/24/outline'

interface ContractLogsListProps {
  contractLogs: ContractLog[]
  auditLogs: AuditLog[]
}

type CombinedLog = {
  id: string
  created_at: string
  type: 'contract_log' | 'audit_log'
  contractLog?: ContractLog
  auditLog?: AuditLog // Can be present even when type is 'contract_log' (for merged logs)
}

export default function ContractLogsList({ contractLogs, auditLogs }: ContractLogsListProps) {
  const [selectedAuditLog, setSelectedAuditLog] = useState<AuditLog | null>(null)
  // Helper to check if two timestamps are close (within 5 seconds)
  const areCloseInTime = (date1: string, date2: string, thresholdSeconds: number = 5) => {
    const diff = Math.abs(new Date(date1).getTime() - new Date(date2).getTime())
    return diff <= thresholdSeconds * 1000
  }

  // Combine logs, merging UPSELL/DOWNSELL contract_logs with their corresponding audit_logs
  const processedLogs: CombinedLog[] = []
  const usedAuditLogIds = new Set<string>()

  // First, process contract_logs and try to find matching audit_logs
  contractLogs.forEach((contractLog) => {
    // Only merge for UPSELL and DOWNSELL
    if (contractLog.action_type === 'UPSELL' || contractLog.action_type === 'DOWNSELL') {
      // Find a matching audit_log (update action, same time window)
      const matchingAuditLog = auditLogs.find(
        (auditLog) =>
          auditLog.action === 'update' &&
          areCloseInTime(contractLog.created_at, auditLog.created_at) &&
          !usedAuditLogIds.has(auditLog.id)
      )

      if (matchingAuditLog) {
        // Merge: use contract_log as base but include audit_log details
        processedLogs.push({
          id: contractLog.id,
          created_at: contractLog.created_at,
          type: 'contract_log' as const,
          contractLog: contractLog,
          auditLog: matchingAuditLog, // Include audit log for details
        })
        usedAuditLogIds.add(matchingAuditLog.id)
      } else {
        // No matching audit log, add contract_log alone
        processedLogs.push({
          id: contractLog.id,
          created_at: contractLog.created_at,
          type: 'contract_log' as const,
          contractLog: contractLog,
        })
      }
    } else {
      // For other contract_logs (CHURN, CUT, etc.), add as-is
      processedLogs.push({
        id: contractLog.id,
        created_at: contractLog.created_at,
        type: 'contract_log' as const,
        contractLog: contractLog,
      })
    }
  })

  // Add remaining audit_logs that weren't merged
  auditLogs.forEach((auditLog) => {
    if (!usedAuditLogIds.has(auditLog.id)) {
      processedLogs.push({
        id: auditLog.id,
        created_at: auditLog.created_at,
        type: 'audit_log' as const,
        auditLog: auditLog,
      })
    }
  })

  // Sort by date (newest first)
  const combinedLogs = processedLogs.sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )

  const getActionBadgeVariant = (actionType: string) => {
    switch (actionType) {
      case 'UPSELL':
      case 'RENEWAL_ENTRY':
        return 'success'
      case 'DOWNSELL':
      case 'CHURN':
      case 'CUT':
      case 'NOT_RENEWED':
      case 'RENEWAL_EXIT':
        return 'danger'
      default:
        return 'default'
    }
  }

  const getActionLabel = (actionType: string) => {
    switch (actionType) {
      case 'UPSELL':
        return 'Upsell'
      case 'DOWNSELL':
        return 'Downsell'
      case 'CHURN':
        return 'Churn'
      case 'CUT':
        return 'Cut'
      case 'NOT_RENEWED':
        return 'Not Renewed'
      case 'RENEWAL_EXIT':
        return 'Renewal Exit'
      case 'RENEWAL_ENTRY':
        return 'Renewal Entry'
      default:
        return actionType
    }
  }

  const getAuditActionBadgeVariant = (action: string) => {
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

  const getAuditActionLabel = (action: string) => {
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

  const getChangesCount = (log: AuditLog): number => {
    if (Array.isArray(log.changes)) {
      return log.changes.filter((c: any) => c && c.field).length
    } else if (log.changes && typeof log.changes === 'object') {
      const systemFields = ['id', 'created_at', 'updated_at']
      return Object.keys(log.changes).filter(key => !systemFields.includes(key)).length
    }
    return 0
  }

  if (combinedLogs.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8">
        No contract history found
      </div>
    )
  }

  return (
    <>
    <Table>
      <TableHead>
        <TableRow>
          <TableHeader>Date</TableHeader>
          <TableHeader>Action</TableHeader>
          <TableHeader>Details</TableHeader>
          <TableHeader>Old Value</TableHeader>
          <TableHeader>New Value</TableHeader>
          <TableHeader>Delta</TableHeader>
          <TableHeader className="text-right">Actions</TableHeader>
        </TableRow>
      </TableHead>
      <TableBody>
        {combinedLogs.map((log) => {
          if (log.type === 'contract_log' && log.contractLog) {
            const cl = log.contractLog
            // If this is a merged log (has auditLog), show details from audit log
            const isMerged = log.auditLog !== undefined && 
                            (cl.action_type === 'UPSELL' || cl.action_type === 'DOWNSELL')
            
            return (
              <TableRow key={log.id}>
                <TableCell className="text-sm text-gray-600">
                  {formatDateTime(cl.created_at)}
                </TableCell>
                <TableCell>
                  <Badge variant={getActionBadgeVariant(cl.action_type)}>
                    {getActionLabel(cl.action_type)}
                  </Badge>
                </TableCell>
                <TableCell>
                  {isMerged && log.auditLog ? (
                    <span className="text-sm text-gray-600">
                      {getChangesCount(log.auditLog)} {getChangesCount(log.auditLog) === 1 ? 'field' : 'fields'} changed
                    </span>
                  ) : (
                    <span className="text-sm text-gray-500">Financial change</span>
                  )}
                </TableCell>
                <TableCell>{formatCurrency(cl.old_value)}</TableCell>
                <TableCell>{formatCurrency(cl.new_value)}</TableCell>
                <TableCell>
                  <span
                    className={
                      cl.delta_value >= 0
                        ? 'text-green-600 font-medium'
                        : 'text-red-600 font-medium'
                    }
                  >
                    {formatCurrency(cl.delta_value)}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  {isMerged && log.auditLog && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedAuditLog(log.auditLog!)}
                      className="flex items-center gap-1"
                    >
                      <EyeIcon className="w-3.5 h-3.5" />
                      View
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            )
          } else if (log.type === 'audit_log' && log.auditLog) {
            const al = log.auditLog
            // Extract value changes from audit log if they exist
            const changes = Array.isArray(al.changes) ? al.changes : []
            const valueChange = changes.find((c: any) => 
              c.field === 'current_value' || c.field === 'contract_value'
            )
            
            return (
              <TableRow key={log.id}>
                <TableCell className="text-sm text-gray-600">
                  {formatDateTime(al.created_at)}
                </TableCell>
                <TableCell>
                  <Badge variant={getAuditActionBadgeVariant(al.action)}>
                    {getAuditActionLabel(al.action)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-gray-600">
                    {getChangesCount(al)} {getChangesCount(al) === 1 ? 'field' : 'fields'} changed
                  </span>
                </TableCell>
                <TableCell>
                  {valueChange ? formatCurrency(valueChange.old || valueChange.old_value) : '-'}
                </TableCell>
                <TableCell>
                  {valueChange ? formatCurrency(valueChange.new || valueChange.new_value) : '-'}
                </TableCell>
                <TableCell>
                  {valueChange && valueChange.old !== undefined && valueChange.new !== undefined ? (
                    <span
                      className={
                        (parseFloat(valueChange.new || valueChange.new_value || '0') - 
                         parseFloat(valueChange.old || valueChange.old_value || '0')) >= 0
                          ? 'text-green-600 font-medium'
                          : 'text-red-600 font-medium'
                      }
                    >
                      {formatCurrency(
                        parseFloat(valueChange.new || valueChange.new_value || '0') - 
                        parseFloat(valueChange.old || valueChange.old_value || '0')
                      )}
                    </span>
                  ) : (
                    '-'
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedAuditLog(al)}
                    className="flex items-center gap-1"
                  >
                    <EyeIcon className="w-3.5 h-3.5" />
                    View
                  </Button>
                </TableCell>
              </TableRow>
            )
          }
          return null
        })}
      </TableBody>
    </Table>

    {selectedAuditLog && (
      <ChangesModal
        isOpen={!!selectedAuditLog}
        onClose={() => setSelectedAuditLog(null)}
        changes={selectedAuditLog.changes}
        action={selectedAuditLog.action}
        title={`Change Details - ${formatDateTime(selectedAuditLog.created_at)}`}
      />
    )}
    </>
  )
}
