'use server'

import { createClient } from '@/lib/supabase/server'
import { requirePermission } from '@/lib/auth/helpers'
import { revalidatePath } from 'next/cache'

export async function deleteService(serviceId: string) {
  await requirePermission('services', 'delete')

  const supabase = await createClient()

  const { error } = await supabase
    .from('services')
    .delete()
    .eq('id', serviceId)

  if (error) {
    if (error.code === '23503') {
      throw new Error('Cannot delete this service because it is linked to one or more contracts. Remove it from all contracts first.')
    }
    throw new Error(error.message)
  }

  revalidatePath('/dashboard/services')
  return { success: true }
}
