import { SupabaseClient } from '@supabase/supabase-js';
export declare const supabase: SupabaseClient;
interface FetchAllOptions {
    from: string;
    select?: string;
    filters?: (query: any) => any;
    order?: {
        column: string;
        ascending?: boolean;
    };
    limit?: number;
    offset?: number;
}
export declare function fetchAll<T = Record<string, unknown>>({ from, select, filters, order, limit, offset, }: FetchAllOptions): Promise<{
    data: T[];
    total: number;
}>;
export {};
//# sourceMappingURL=supabase.d.ts.map