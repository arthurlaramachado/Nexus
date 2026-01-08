'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { collaboratorSchema, CollaboratorFormData } from '@/lib/validations/collaborator'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Button from '@/components/ui/Button'
import { createClient } from '@/lib/supabase/client'
import { getUserOrganizationId } from '@/lib/supabase/client-helpers'
import { Collaborator } from '@/types/database'

interface CollaboratorFormProps {
  collaborator?: Collaborator
  roles: Array<{ id: string; name: string }>
  onSuccess?: () => void
  onCancel?: () => void
}

export default function CollaboratorForm({ collaborator, roles, onSuccess, onCancel }: CollaboratorFormProps) {
  const router = useRouter()
  const supabase = createClient()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CollaboratorFormData>({
    resolver: zodResolver(collaboratorSchema),
    defaultValues: collaborator ? {
      full_name: collaborator.full_name,
      email: collaborator.email,
      role_id: collaborator.role_id,
      employment_status: collaborator.status,
    } : {
      full_name: '',
      email: '',
      role_id: '',
      employment_status: 'active',
    },
  })

  const onSubmit = async (data: CollaboratorFormData) => {
    setError(null)
    setLoading(true)

    try {
      const collaboratorData = {
        full_name: data.full_name,
        email: data.email,
        role_id: data.role_id,
        status: data.employment_status,
      }

      if (collaborator) {
        const { error: updateError } = await supabase
          .from('collaborators')
          .update(collaboratorData)
          .eq('id', collaborator.id)

        if (updateError) throw updateError
      } else {
        // Create new collaborator with organization_id
        const orgId = await getUserOrganizationId()
        if (!orgId) throw new Error('User does not belong to an organization')
        
        const { error: insertError } = await supabase
          .from('collaborators')
          .insert({ ...collaboratorData, organization_id: orgId })

        if (insertError) throw insertError
      }

      if (onSuccess) {
        onSuccess()
      } else {
        router.push('/dashboard/collaborators')
        router.refresh()
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-2xl">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <Input
        label="Full Name *"
        {...register('full_name')}
        error={errors.full_name?.message}
      />

      <Input
        label="Email *"
        type="email"
        {...register('email')}
        error={errors.email?.message}
      />

      <Select
        label="Role *"
        {...register('role_id')}
        error={errors.role_id?.message}
      >
        <option value="">Select a role</option>
        {roles.map((role) => (
          <option key={role.id} value={role.id}>
            {role.name}
          </option>
        ))}
      </Select>

      <Select
        label="Status *"
        {...register('employment_status')}
        error={errors.employment_status?.message}
      >
        <option value="active">Active</option>
        <option value="invited">Invited</option>
        <option value="inactive">Inactive</option>
      </Select>

      <div className="flex gap-4">
        <Button type="submit" disabled={loading}>
          {loading ? 'Saving...' : collaborator ? 'Update Collaborator' : 'Create Collaborator'}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => onCancel ? onCancel() : router.back()}
        >
          Cancel
        </Button>
      </div>
    </form>
  )
}
