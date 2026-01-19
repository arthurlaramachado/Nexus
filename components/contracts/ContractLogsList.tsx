'use client'

import { ContractLog } from '@/types/database'
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '@/components/ui/Table'
import Badge from '@/components/ui/Badge'

interface ContractLogsListProps {
  logs: ContractLog[]
}

export default function ContractLogsList({ logs }: ContractLogsListProps) {
  const formatCurrency = (value: number | null) => {
    if (value === null) return '-'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

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

  if (logs.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8">
        No contract logs found
      </div>
    )
  }

  return (
    <Table>
      <TableHead>
        <TableRow>
          <TableHeader>Date</TableHeader>
          <TableHeader>Action</TableHeader>
          <TableHeader>Old Value</TableHeader>
          <TableHeader>New Value</TableHeader>
          <TableHeader>Delta</TableHeader>
        </TableRow>
      </TableHead>
      <TableBody>
        {logs.map((log) => (
          <TableRow key={log.id}>
            <TableCell className="text-sm text-gray-600">
              {formatDate(log.created_at)}
            </TableCell>
            <TableCell>
              <Badge variant={getActionBadgeVariant(log.action_type)}>
                {getActionLabel(log.action_type)}
              </Badge>
            </TableCell>
            <TableCell>{formatCurrency(log.old_value)}</TableCell>
            <TableCell>{formatCurrency(log.new_value)}</TableCell>
            <TableCell>
              <span
                className={
                  log.delta_value >= 0
                    ? 'text-green-600 font-medium'
                    : 'text-red-600 font-medium'
                }
              >
                {formatCurrency(log.delta_value)}
              </span>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
