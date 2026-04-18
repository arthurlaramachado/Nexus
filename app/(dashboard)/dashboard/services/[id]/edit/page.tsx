import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import ServiceForm from '@/components/forms/ServiceForm'
import { requirePermission } from '@/lib/auth/helpers'

export default async function EditServicePage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission('services', 'write')
  const { id } = await params
  const supabase = await createClient()
  const { data: service, error } = await supabase
    .from('services')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !service) {
    notFound()
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-[#1A1A2E] tracking-tight mb-6">Edit Service</h1>
      <ServiceForm service={service} />
    </div>
  )
}
