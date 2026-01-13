import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

export function useClients(filters: { status?: string; country?: string } = {}) {
  const supabase = createClient()

  return useQuery({
    queryKey: ['clients', filters],
    queryFn: async () => {
      let query = supabase
        .from('clients')
        .select('*, client_tags(tags(name))')
        .order('created_at', { ascending: false })

      if (filters.status) {
        query = query.eq('status', filters.status)
      }
      if (filters.country) {
        query = query.ilike('country', `%${filters.country}%`)
      }

      const { data, error } = await query
      if (error) throw error
      return data
    },
  })
}
