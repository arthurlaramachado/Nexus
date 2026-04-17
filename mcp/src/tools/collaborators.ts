import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { supabase, fetchAll } from '../supabase.js'

export function registerCollaboratorTools(server: McpServer): void {
  server.tool(
    'list_collaborators',
    'Lists NexusCS team members (collaborators) with optional filters.',
    {
      status: z.enum(['active', 'invited', 'inactive']).optional().describe('Filter by employment status'),
      role_id: z.string().uuid().optional().describe('Filter by role UUID'),
      limit: z.number().int().min(1).max(100).optional().describe('Page size (default: fetches all)'),
      offset: z.number().int().min(0).optional().describe('Offset for pagination'),
    },
    async ({ status, role_id, limit, offset }) => {
      const { data, total } = await fetchAll({
        from: 'collaborators',
        select: '*, roles(name)',
        order: { column: 'full_name', ascending: true },
        limit,
        offset,
        filters: (query) => {
          let q = query
          if (status) q = q.eq('status', status)
          if (role_id) q = q.eq('role_id', role_id)
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
    'get_collaborator',
    'Gets detailed info for a single NexusCS collaborator, including their active contract assignments.',
    {
      collaborator_id: z.string().uuid().describe('The collaborator UUID'),
    },
    async ({ collaborator_id }) => {
      const { data: collaborator, error } = await supabase
        .from('collaborators')
        .select('*, roles(name)')
        .eq('id', collaborator_id)
        .single()

      if (error) throw new Error(`Collaborator not found: ${error.message}`)

      const { data: assignments } = await supabase
        .from('contract_assignments')
        .select('*, contracts(name, status, clients(name))')
        .eq('collaborator_id', collaborator_id)
        .is('end_date', null)
        .order('start_date', { ascending: false })

      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            ...collaborator,
            active_assignments: assignments ?? [],
          }, null, 2),
        }],
      }
    }
  )
}
