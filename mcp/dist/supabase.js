import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '../../.env.local') });
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. ' +
        'Set them in .env.local at the NexusCS root or pass via MCP config env.');
}
export const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false,
    },
});
const PAGE_SIZE = 50;
export async function fetchAll({ from, select = '*', filters, order, limit, offset = 0, }) {
    const pageSize = limit ?? PAGE_SIZE;
    const allData = [];
    let currentOffset = offset;
    let total = 0;
    while (true) {
        let query = supabase
            .from(from)
            .select(select, { count: 'exact' })
            .range(currentOffset, currentOffset + pageSize - 1);
        if (filters) {
            query = filters(query);
        }
        if (order) {
            query = query.order(order.column, { ascending: order.ascending ?? false });
        }
        const { data, error, count } = await query;
        if (error) {
            throw new Error(`Failed to fetch from ${from}: ${error.message}`);
        }
        total = count ?? 0;
        allData.push(...(data ?? []));
        if (!limit && data && data.length === pageSize && allData.length < total) {
            currentOffset += pageSize;
            continue;
        }
        break;
    }
    return { data: allData, total };
}
//# sourceMappingURL=supabase.js.map