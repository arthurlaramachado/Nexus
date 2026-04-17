import { z } from 'zod';
import { fetchAll } from '../supabase.js';
export function registerAssignmentTools(server) {
    server.tool('list_assignments', 'Lists NexusCS contract assignments (which collaborators are assigned to which contracts).', {
        contract_id: z.string().uuid().optional().describe('Filter by contract UUID'),
        collaborator_id: z.string().uuid().optional().describe('Filter by collaborator UUID'),
        active_only: z.boolean().optional().describe('Only show assignments without end_date (default: false)'),
        limit: z.number().int().min(1).max(100).optional().describe('Page size (default: fetches all)'),
        offset: z.number().int().min(0).optional().describe('Offset for pagination'),
    }, async ({ contract_id, collaborator_id, active_only, limit, offset }) => {
        const { data, total } = await fetchAll({
            from: 'contract_assignments',
            select: '*, contracts(name, status, clients(name)), collaborators(full_name)',
            order: { column: 'start_date', ascending: false },
            limit,
            offset,
            filters: (query) => {
                let q = query;
                if (contract_id)
                    q = q.eq('contract_id', contract_id);
                if (collaborator_id)
                    q = q.eq('collaborator_id', collaborator_id);
                if (active_only)
                    q = q.is('end_date', null);
                return q;
            },
        });
        return {
            content: [{
                    type: 'text',
                    text: JSON.stringify({ data, total }, null, 2),
                }],
        };
    });
}
//# sourceMappingURL=assignments.js.map