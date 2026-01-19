import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import ClientDetail from '@/components/features/clients/ClientDetail'

export default async function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  
  const { data: client, error: clientError } = await supabase
    .from('clients')
    .select('*, client_tags(tags(id, name))')
    .eq('id', id)
    .single()

  if (clientError || !client) {
    notFound()
  }

  const { data: contracts } = await supabase
    .from('contracts')
    .select('*')
    .eq('client_id', id)
    .order('created_at', { ascending: false })

  // Fetch audit logs for this client
  const { data: auditLogs } = await supabase
    .from('audit_logs')
    .select('*')
    .eq('table_name', 'clients')
    .eq('record_id', id)
    .order('created_at', { ascending: false })

  return <ClientDetail client={client} contracts={contracts || []} auditLogs={auditLogs || []} />
}
