import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { supabase, fetchAll } from '../supabase.js'

export function registerContractLogTools(server: McpServer): void {
  server.tool(
    'list_contract_logs',
    'Lists NexusCS contract financial logs (upsell, downsell, churn, renewals) with filters.',
    {
      contract_id: z.string().uuid().optional().describe('Filter by contract UUID'),
      action_type: z.enum(['UPSELL', 'DOWNSELL', 'CHURN', 'CUT', 'NOT_RENEWED', 'RENEWAL_EXIT', 'RENEWAL_ENTRY']).optional().describe('Filter by action type'),
      date_from: z.string().optional().describe('Start date (ISO format, e.g. 2025-01-01)'),
      date_to: z.string().optional().describe('End date (ISO format, e.g. 2025-12-31)'),
      limit: z.number().int().min(1).max(100).optional().describe('Page size (default: fetches all)'),
      offset: z.number().int().min(0).optional().describe('Offset for pagination'),
    },
    async ({ contract_id, action_type, date_from, date_to, limit, offset }) => {
      const { data, total } = await fetchAll({
        from: 'contract_logs',
        select: '*, contracts(name, clients(name))',
        order: { column: 'created_at', ascending: false },
        limit,
        offset,
        filters: (query) => {
          let q = query
          if (contract_id) q = q.eq('contract_id', contract_id)
          if (action_type) q = q.eq('action_type', action_type)
          if (date_from) q = q.gte('created_at', date_from)
          if (date_to) q = q.lte('created_at', `${date_to}T23:59:59`)
          return q
        },
      })

      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({ data, total }, null, 2),
        }],
      }
    }
  )

  server.tool(
    'get_revenue_summary',
    'Calculates ARR summary: total active contract value, churn amount, upsell/downsell totals in the period.',
    {
      date_from: z.string().optional().describe('Start date for log period (ISO format)'),
      date_to: z.string().optional().describe('End date for log period (ISO format)'),
    },
    async ({ date_from, date_to }) => {
      const { data: activeContracts } = await fetchAll({
        from: 'contracts',
        select: 'current_value',
        filters: (q) => q.eq('status', 'ACTIVE'),
      })

      const totalActiveARR = activeContracts.reduce(
        (sum: number, c: any) => sum + (parseFloat(c.current_value) || 0),
        0
      )

      let logQuery = supabase
        .from('contract_logs')
        .select('action_type, delta_value, old_value, new_value')

      if (date_from) logQuery = logQuery.gte('created_at', date_from)
      if (date_to) logQuery = logQuery.lte('created_at', `${date_to}T23:59:59`)

      const { data: logs, error } = await logQuery

      if (error) throw new Error(`Failed to fetch logs: ${error.message}`)

      const summary = {
        total_active_arr: totalActiveARR,
        period: { from: date_from ?? 'all-time', to: date_to ?? 'now' },
        upsell_total: 0,
        downsell_total: 0,
        churn_total: 0,
        cut_total: 0,
        not_renewed_total: 0,
        renewal_count: 0,
      }

      for (const log of logs ?? []) {
        const delta = parseFloat(log.delta_value) || 0
        const oldVal = parseFloat(log.old_value) || 0

        switch (log.action_type) {
          case 'UPSELL':
            summary.upsell_total += delta
            break
          case 'DOWNSELL':
            summary.downsell_total += Math.abs(delta)
            break
          case 'CHURN':
            summary.churn_total += oldVal
            break
          case 'CUT':
            summary.cut_total += oldVal
            break
          case 'NOT_RENEWED':
            summary.not_renewed_total += oldVal
            break
          case 'RENEWAL_ENTRY':
            summary.renewal_count += 1
            break
        }
      }

      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify(summary, null, 2),
        }],
      }
    }
  )
}
