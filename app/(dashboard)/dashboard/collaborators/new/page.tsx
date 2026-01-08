import CollaboratorForm from '@/components/forms/CollaboratorForm'
import { createClient } from '@/lib/supabase/server'

export default async function NewCollaboratorPage() {
  const supabase = await createClient()
  const { data: roles } = await supabase.from('roles').select('id, name').order('name')

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">New Collaborator</h1>
      <CollaboratorForm roles={roles || []} />
    </div>
  )
}

