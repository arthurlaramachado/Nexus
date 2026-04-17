import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { supabase, fetchAll } from '../supabase.js'

export function registerAuditLogTools(server: McpServer): void {
  server.tool(
    'list_audit_logs',
    'Lists NexusCS audit trail entries. Tracks all inserts, updates, and deletes on every table.',
    {
      table_name: z.string().optional().describe('Filter by table (clients, contracts, collaborators, etc.)'),
      record_id: z.string().uuid().optional().describe('Filter by specific record UUID'),
      action: z.enum(['insert', 'update', 'delete']).optional().describe('Filter by action type'),
      user_id: z.string().uuid().optional().describe('Filter by user who made the change'),
      date_from: z.string().optional().describe('Start date (ISO format)'),
      date_to: z.string().optional().describe('End date (ISO format)'),
      limit: z.number().int().min(1).max(100).optional().describe('Page size (default: fetches all)'),
      offset: z.number().int().min(0).optional().describe('Offset for pagination'),
    },
    async ({ table_name, record_id, action, user_id, date_from, date_to, limit, offset }) => {
      const { data, total } = await fetchAll({
        from: 'audit_logs',
        select: '*',
        order: { column: 'created_at', ascending: false },
        limit,
        offset,
        filters: (query) => {
          let q = query
          if (table_name) q = q.eq('table_name', table_name)
          if (record_id) q = q.eq('record_id', record_id)
          if (action) q = q.eq('action', action)
          if (user_id) q = q.eq('user_id', user_id)
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
    'get_record_changes',
    'Gets the full change history for a specific NexusCS record (all audit log entries for that record).',
    {
      table_name: z.string().describe('The table name (clients, contracts, collaborators, etc.)'),
      record_id: z.string().uuid().describe('The record UUID'),
    },
    async ({ table_name, record_id }) => {
      const { data, total } = await fetchAll({
        from: 'audit_logs',
        select: '*',
        order: { column: 'created_at', ascending: true },
        filters: (query) => query.eq('table_name', table_name).eq('record_id', record_id),
      })

      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({ table_name, record_id, changes: data, total_events: total }, null, 2),
        }],
      }
    }
  )
}
