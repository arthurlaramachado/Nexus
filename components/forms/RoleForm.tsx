'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { roleSchema, RoleFormData } from '@/lib/validations/role'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { createClient } from '@/lib/supabase/client'
import { getUserOrganizationId } from '@/lib/supabase/client-helpers'
import { Role } from '@/types/database'

interface RoleFormProps {
  role?: Role
}

export default function RoleForm({ role }: RoleFormProps) {
  const router = useRouter()
  const supabase = createClient()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RoleFormData>({
    resolver: zodResolver(roleSchema),
    defaultValues: role ? {
      name: role.name,
    } : {
      name: '',
    },
  })

  const onSubmit = async (data: RoleFormData) => {
    setError(null)
    setLoading(true)

    try {
      const roleData = {
        name: data.name,
      }

      if (role) {
        const { error: updateError } = await supabase
          .from('roles')
          .update(roleData)
          .eq('id', role.id)

        if (updateError) throw updateError
      } else {
        // Create new role with organization_id
        const orgId = await getUserOrganizationId()
        if (!orgId) throw new Error('User does not belong to an organization')
        
        const { error: insertError } = await supabase
          .from('roles')
          .insert({ ...roleData, organization_id: orgId })

        if (insertError) throw insertError
      }

      router.push('/dashboard/roles')
      router.refresh()
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
        label="Role Name *"
        {...register('name')}
        error={errors.name?.message}
        placeholder="e.g. Senior CSM"
      />

      <div className="flex gap-4">
        <Button type="submit" disabled={loading}>
          {loading ? 'Saving...' : role ? 'Update Role' : 'Create Role'}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
        >
          Cancel
        </Button>
      </div>
    </form>
  )
}
