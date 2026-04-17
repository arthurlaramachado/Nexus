import { createClient } from '@/lib/supabase/server'
import Button from '@/components/ui/Button'
import Link from 'next/link'
import { requirePermission, checkPermission } from '@/lib/auth/helpers'
import CollaboratorsList from '@/components/features/collaborators/CollaboratorsList'

export default async function CollaboratorsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; role_id?: string; tab?: string }>
}) {
  await requirePermission('collaborators', 'read')
  const canWrite = await checkPermission('collaborators', 'write')
  const { role_id } = await searchParams
  const supabase = await createClient()
  
  // Fetch all collaborators (active and invited)
  let query = supabase
    .from('collaborators')
    .select('*, roles(name)')
    .order('created_at', { ascending: false })

  if (role_id) {
    query = query.eq('role_id', role_id)
  }

  const { data: collaborators, error } = await query

  if (error) {
    return <div className="bg-[#FEE2E2] border border-[#EF4444]/20 text-[#991B1B] rounded-lg px-4 py-3">Error loading collaborators: {error.message}</div>
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-[#1A1A2E] tracking-tight">Collaborators</h1>
        {canWrite && (
          <Link href="/dashboard/collaborators/new">
            <Button>New Collaborator</Button>
          </Link>
        )}
      </div>

      <CollaboratorsList 
        initialCollaborators={collaborators || []} 
        canWrite={canWrite}
      />
    </div>
  )
}
