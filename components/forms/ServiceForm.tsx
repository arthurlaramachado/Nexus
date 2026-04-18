'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { serviceSchema, ServiceFormData } from '@/lib/validations/service'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { createClient } from '@/lib/supabase/client'
import { Service } from '@/types/database'

interface ServiceFormProps {
  service?: Service
}

export default function ServiceForm({ service }: ServiceFormProps) {
  const router = useRouter()
  const supabase = createClient()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ServiceFormData>({
    resolver: zodResolver(serviceSchema),
    defaultValues: service
      ? {
          name: service.name,
          description: service.description || '',
        }
      : {
          name: '',
          description: '',
        },
  })

  const onSubmit = async (data: ServiceFormData) => {
    setError(null)
    setLoading(true)

    try {
      const serviceData = {
        name: data.name,
        description: data.description || null,
      }

      if (service) {
        const { error: updateError } = await supabase
          .from('services')
          .update(serviceData)
          .eq('id', service.id)

        if (updateError) throw updateError
      } else {
        const { error: insertError } = await supabase
          .from('services')
          .insert(serviceData)

        if (insertError) throw insertError
      }

      router.push('/dashboard/services')
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
        <div className="bg-[#FEE2E2] border border-[#EF4444]/20 text-[#991B1B] px-4 py-3 rounded">
          {error}
        </div>
      )}

      <Input
        label="Name *"
        {...register('name')}
        error={errors.name?.message}
      />

      <Input
        label="Description"
        {...register('description')}
        error={errors.description?.message}
      />

      <div className="flex gap-4">
        <Button type="submit" disabled={loading}>
          {loading ? 'Saving...' : service ? 'Update Service' : 'Create Service'}
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
