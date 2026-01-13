'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { contractSchema, ContractFormData } from '@/lib/validations/contract'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Button from '@/components/ui/Button'
import { createClient } from '@/lib/supabase/client'
import { Contract, Client } from '@/types/database'

interface ContractFormProps {
  contract?: Contract
  clients: Array<{ id: string; name: string }>
  defaultClientId?: string
}

export default function ContractForm({ contract, clients, defaultClientId }: ContractFormProps) {
  const router = useRouter()
  const supabase = createClient()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const formatDateForInput = (dateString: string | null) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toISOString().split('T')[0]
  }

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ContractFormData>({
    resolver: zodResolver(contractSchema),
    defaultValues: contract
      ? {
          client_id: contract.client_id,
          name: contract.name,
          contract_type: contract.contract_type,
          status: contract.status,
          start_date: formatDateForInput(contract.start_date),
          end_date: formatDateForInput(contract.end_date),
          renewal_date: formatDateForInput(contract.renewal_date),
          contract_value: contract.contract_value?.toString() || '',
        }
      : {
          client_id: defaultClientId || '',
          name: '',
          contract_type: 'new_deal',
          status: 'active',
          start_date: '',
          end_date: '',
          renewal_date: '',
          contract_value: '',
        },
  })

  const onSubmit = async (data: ContractFormData) => {
    setError(null)
    setLoading(true)

    try {
      const contractData = {
        ...data,
        contract_value: data.contract_value || null,
        end_date: data.end_date || null,
        renewal_date: data.renewal_date || null,
      }

      if (contract) {
        const { error: updateError } = await supabase
          .from('contracts')
          .update(contractData)
          .eq('id', contract.id)

        if (updateError) throw updateError
      } else {
        // Create new contract
        const { error: insertError } = await supabase
          .from('contracts')
          .insert(contractData)

        if (insertError) throw insertError
      }

      router.push('/dashboard/contracts')
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

      <Select
        label="Client *"
        {...register('client_id')}
        error={errors.client_id?.message}
      >
        <option value="">Select a client</option>
        {clients.map((client) => (
          <option key={client.id} value={client.id}>
            {client.name}
          </option>
        ))}
      </Select>

      <Input
        label="Contract Name *"
        {...register('name')}
        error={errors.name?.message}
      />

      <Select
        label="Contract Type *"
        {...register('contract_type')}
        error={errors.contract_type?.message}
      >
        <option value="new_deal">New Deal</option>
        <option value="renewed">Renewed</option>
        <option value="upsell">Upsell</option>
        <option value="downsell">Downsell</option>
        <option value="not_renewed">Not Renewed</option>
        <option value="churn">Churn</option>
        <option value="cut">Cut</option>
      </Select>

      <Select
        label="Status *"
        {...register('status')}
        error={errors.status?.message}
      >
        <option value="active">Active</option>
        <option value="paused">Paused</option>
        <option value="inactive">Inactive</option>
      </Select>

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
        {...register('contract_value')}
        error={errors.contract_value?.message}
      />

      <div className="flex gap-4">
        <Button type="submit" disabled={loading}>
          {loading ? 'Saving...' : contract ? 'Update Contract' : 'Create Contract'}
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

