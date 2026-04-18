import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import CollaboratorForm from '@/components/forms/CollaboratorForm'
import { requirePermission } from '@/lib/auth/helpers'

export default async function EditCollaboratorPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission('collaborators', 'write')
  const { id } = await params
  const supabase = await createClient()
  const { data: collaborator, error } = await supabase
    .from('collaborators')
    .select('*, roles!collaborators_role_id_fkey(*)')
    .eq('id', id)
    .single()

  if (error || !collaborator) {
    notFound()
  }

  const { data: roles } = await supabase.from('roles').select('id, name').order('name')

  return (
    <div>
      <h1 className="text-2xl font-semibold text-[#1A1A2E] tracking-tight mb-6">Edit Collaborator</h1>
      <CollaboratorForm collaborator={collaborator} roles={roles || []} />
    </div>
  )
}

