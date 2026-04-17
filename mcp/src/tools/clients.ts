import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { supabase, fetchAll } from '../supabase.js'

export function registerClientTools(server: McpServer): void {
  server.tool(
    'list_clients',
    'Lists NexusCS clients with optional filters. Returns client data with tags.',
    {
      status: z.enum(['active', 'inactive']).optional().describe('Filter by client status'),
      country: z.string().optional().describe('Filter by country (partial match)'),
      industry: z.string().optional().describe('Filter by industry (partial match)'),
      tag: z.string().optional().describe('Filter by tag name'),
      limit: z.number().int().min(1).max(100).optional().describe('Page size (default: fetches all)'),
      offset: z.number().int().min(0).optional().describe('Offset for pagination'),
    },
    async ({ status, country, industry, tag, limit, offset }) => {
      const { data, total } = await fetchAll({
        from: 'clients',
        select: '*, client_tags(tags(name))',
        order: { column: 'created_at', ascending: false },
        limit,
        offset,
        filters: (query) => {
          let q = query
          if (status) q = q.eq('status', status)
          if (country) q = q.ilike('country', `%${country}%`)
          if (industry) q = q.ilike('industry', `%${industry}%`)
          return q
        },
      })

      const results = tag
        ? data.filter((client: any) =>
            client.client_tags?.some((ct: any) =>
              ct.tags?.name?.toLowerCase() === tag.toLowerCase()
            )
          )
        : data

      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({ data: results, total: tag ? results.length : total }, null, 2),
        }],
      }
    }
  )

  server.tool(
    'get_client',
    'Gets detailed info for a single NexusCS client, including tags and contracts.',
    {
      client_id: z.string().uuid().describe('The client UUID'),
    },
    async ({ client_id }) => {
      const { data: client, error } = await supabase
        .from('clients')
        .select('*, client_tags(tags(name))')
        .eq('id', client_id)
        .single()

      if (error) throw new Error(`Client not found: ${error.message}`)

      const { data: contracts } = await supabase
        .from('contracts')
        .select('*')
        .eq('client_id', client_id)
        .order('created_at', { ascending: false })

      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({ ...client, contracts: contracts ?? [] }, null, 2),
        }],
      }
    }
  )

  server.tool(
    'search_clients',
    'Searches NexusCS clients by name or unique identifier (CL-XXXXXXXX).',
    {
      query: z.string().min(1).describe('Search term (name or identifier)'),
    },
    async ({ query }) => {
      const { data, error } = await supabase
        .from('clients')
        .select('*, client_tags(tags(name))')
        .or(`name.ilike.%${query}%,unique_identifier.ilike.%${query}%`)
        .order('name')

      if (error) throw new Error(`Search failed: ${error.message}`)

      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({ data: data ?? [], total: data?.length ?? 0 }, null, 2),
        }],
      }
    }
  )
}
