import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

interface ContractFilters {
  search?: string
  status?: string
  client_id?: string
  termination_reason?: string
  start_date_from?: string
  start_date_to?: string
}

export function useContracts(filters: ContractFilters = {}) {
  const supabase = createClient()

  return useQuery({
    queryKey: ['contracts', filters],
    queryFn: async () => {
      let query = supabase
        .from('contracts')
        .select('*, clients(name)')
        .order('created_at', { ascending: false })

      if (filters.search) query = query.ilike('name', `%${filters.search}%`)
      if (filters.status) query = query.eq('status', filters.status)
      if (filters.client_id) query = query.eq('client_id', filters.client_id)
      if (filters.termination_reason) query = query.eq('termination_reason', filters.termination_reason)
      if (filters.start_date_from) query = query.gte('start_date', filters.start_date_from)
      if (filters.start_date_to) query = query.lte('start_date', filters.start_date_to)

      const { data, error } = await query
      if (error) throw error
      return data
    },
  })
}
