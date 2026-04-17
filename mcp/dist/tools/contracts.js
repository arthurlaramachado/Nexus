import { z } from 'zod';
import { supabase, fetchAll } from '../supabase.js';
export function registerContractTools(server) {
    server.tool('list_contracts', 'Lists NexusCS contracts with optional filters. Includes client name.', {
        status: z.enum(['ACTIVE', 'ENDED']).optional().describe('Filter by contract status'),
        client_id: z.string().uuid().optional().describe('Filter by client UUID'),
        termination_reason: z.enum(['NOT_RENEWED', 'CHURN', 'CUT', 'RENEWED']).optional().describe('Filter by termination reason'),
        limit: z.number().int().min(1).max(100).optional().describe('Page size (default: fetches all)'),
        offset: z.number().int().min(0).optional().describe('Offset for pagination'),
    }, async ({ status, client_id, termination_reason, limit, offset }) => {
        const { data, total } = await fetchAll({
            from: 'contracts',
            select: '*, clients(name)',
            order: { column: 'created_at', ascending: false },
            limit,
            offset,
            filters: (query) => {
                let q = query;
                if (status)
                    q = q.eq('status', status);
                if (client_id)
                    q = q.eq('client_id', client_id);
                if (termination_reason)
                    q = q.eq('termination_reason', termination_reason);
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
    server.tool('get_contract', 'Gets detailed info for a single NexusCS contract, including client, assignments, and financial logs.', {
        contract_id: z.string().uuid().describe('The contract UUID'),
    }, async ({ contract_id }) => {
        const { data: contract, error } = await supabase
            .from('contracts')
            .select('*, clients(name)')
            .eq('id', contract_id)
            .single();
        if (error)
            throw new Error(`Contract not found: ${error.message}`);
        const [assignments, logs] = await Promise.all([
            supabase
                .from('contract_assignments')
                .select('*, collaborators(full_name, email)')
                .eq('contract_id', contract_id)
                .order('start_date', { ascending: false }),
            supabase
                .from('contract_logs')
                .select('*')
                .eq('contract_id', contract_id)
                .order('created_at', { ascending: false }),
        ]);
        return {
            content: [{
                    type: 'text',
                    text: JSON.stringify({
                        ...contract,
                        assignments: assignments.data ?? [],
                        logs: logs.data ?? [],
                    }, null, 2),
                }],
        };
    });
    server.tool('get_contract_history', 'Traces the full renewal chain of a NexusCS contract (previous and subsequent contracts).', {
        contract_id: z.string().uuid().describe('The contract UUID to trace'),
    }, async ({ contract_id }) => {
        const chain = [];
        let currentId = contract_id;
        const visited = new Set();
        while (currentId && !visited.has(currentId)) {
            visited.add(currentId);
            const { data: contractData, error: contractError } = await supabase
                .from('contracts')
                .select('*, clients(name)')
                .eq('id', currentId)
                .single();
            if (contractError || !contractData)
                break;
            chain.unshift(contractData);
            currentId = contractData.previous_contract_id ?? null;
        }
        const { data: successors } = await supabase
            .from('contracts')
            .select('*, clients(name)')
            .eq('previous_contract_id', contract_id);
        if (successors) {
            for (const s of successors) {
                if (!visited.has(s.id)) {
                    chain.push(s);
                    visited.add(s.id);
                    let nextId = s.id;
                    while (true) {
                        const { data: next } = await supabase
                            .from('contracts')
                            .select('*, clients(name)')
                            .eq('previous_contract_id', nextId)
                            .single();
                        if (!next || visited.has(next.id))
                            break;
                        chain.push(next);
                        visited.add(next.id);
                        nextId = next.id;
                    }
                }
            }
        }
        return {
            content: [{
                    type: 'text',
                    text: JSON.stringify({
                        chain,
                        total_contracts: chain.length,
                    }, null, 2),
                }],
        };
    });
}
//# sourceMappingURL=contracts.js.map