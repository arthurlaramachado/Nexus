'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Modal from '@/components/ui/Modal'
import { renewContract } from '@/lib/contracts/actions'
import { Contract } from '@/types/database'

const renewContractSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  start_date: z.string().min(1, 'Start date is required'),
  end_date: z.string().optional(),
  renewal_date: z.string().optional(),
  current_value: z.string().optional(),
})

type RenewContractFormData = z.infer<typeof renewContractSchema>

interface RenewContractModalProps {
  contract: Contract
  isOpen: boolean
  onClose: () => void
}

export default function RenewContractModal({
  contract,
  isOpen,
  onClose,
}: RenewContractModalProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RenewContractFormData>({
    resolver: zodResolver(renewContractSchema),
    defaultValues: {
      name: `${contract.name} (Renewed)`,
      start_date: contract.end_date 
        ? new Date(new Date(contract.end_date).getTime() + 86400000).toISOString().split('T')[0] // Next day after end_date
        : new Date().toISOString().split('T')[0],
      end_date: contract.renewal_date || '',
      renewal_date: '',
      current_value: contract.current_value?.toString() || '',
    },
  })

  const onSubmit = async (data: RenewContractFormData) => {
    setLoading(true)
    setError(null)

    try {
      const result = await renewContract(contract.id, {
        name: data.name,
        client_id: contract.client_id,
        start_date: data.start_date,
        end_date: data.end_date || null,
        renewal_date: data.renewal_date || null,
        current_value: data.current_value ? parseFloat(data.current_value) : null,
      })

      if (result.success) {
        router.push(`/dashboard/contracts/${result.newContractId}`)
        router.refresh()
      }
    } catch (err: any) {
      setError(err.message || 'Failed to renew contract')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Renew Contract">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded text-sm">
          <p className="font-medium mb-1">Renewing: {contract.name}</p>
          <p>This will end the current contract and create a new one linked to it.</p>
        </div>

        <Input
          label="Contract Name *"
          {...register('name')}
          error={errors.name?.message}
        />

        <Input
          label="Start Date *"
          type="date"
          {...register('start_date')}
          error={errors.start_date?.message}
        />

        <Input
          label="End Date"
          type="date"
          {...register('end_date')}
          error={errors.end_date?.message}
        />

        <Input
          label="Renewal Date"
          type="date"
          {...register('renewal_date')}
          error={errors.renewal_date?.message}
        />

        <Input
          label="Contract Value"
          type="number"
          step="0.01"
          {...register('current_value')}
          error={errors.current_value?.message}
        />

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
            {error}
          </div>
        )}

        <div className="flex gap-4 justify-end">
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Renewing...' : 'Renew Contract'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
