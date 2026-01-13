'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createInvite } from '@/lib/invites/actions'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'

const inviteSchema = z.object({
  email: z.string().email('Invalid email address'),
  role_id: z.string().min(1, 'Role is required'),
})

type InviteFormData = z.infer<typeof inviteSchema>

export default function NewCollaboratorPage({ roles }: { roles: any[] }) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<InviteFormData>({
    resolver: zodResolver(inviteSchema),
  })

  const onSubmit = async (data: InviteFormData) => {
    setLoading(true)
    setError(null)
    try {
      await createInvite(data.email, data.role_id)
      router.push('/dashboard/collaborators?tab=pending')
      router.refresh()
    } catch (err: any) {
      setError(err.message || 'Failed to create invite')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Invite Collaborator</h1>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <Input
          label="Email Address *"
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

        <div className="flex gap-4">
          <Button type="submit" disabled={loading}>
            {loading ? 'Creating Invite...' : 'Create Invite'}
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
    </div>
  )
}
