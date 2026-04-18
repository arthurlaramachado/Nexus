import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

interface ServiceFilters {
  search?: string
}

export function useServices(filters: ServiceFilters = {}) {
  const supabase = createClient()

  return useQuery({
    queryKey: ['services', filters],
    queryFn: async () => {
      let query = supabase
        .from('services')
        .select('*')
        .order('name', { ascending: true })

      if (filters.search) query = query.ilike('name', `%${filters.search}%`)

      const { data, error } = await query
      if (error) throw error
      return data
    },
  })
}
