import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

export function useContracts(filters: { status?: string; client_id?: string } = {}) {
  const supabase = createClient()

  return useQuery({
    queryKey: ['contracts', filters],
    queryFn: async () => {
      let query = supabase
        .from('contracts')
        .select('*, clients(name)')
        .order('created_at', { ascending: false })

      if (filters.status) query = query.eq('status', filters.status)
      if (filters.client_id) query = query.eq('client_id', filters.client_id)

      const { data, error } = await query
      if (error) throw error
      return data
    },
  })
}
