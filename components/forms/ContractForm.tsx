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
import { updateContractValue } from '@/lib/contracts/actions'

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
          status: contract.status,
          termination_reason: contract.termination_reason || null,
          previous_contract_id: contract.previous_contract_id || null,
          start_date: formatDateForInput(contract.start_date),
          end_date: formatDateForInput(contract.end_date),
          renewal_date: formatDateForInput(contract.renewal_date),
          current_value: contract.current_value?.toString() || '',
        }
      : {
          client_id: defaultClientId || '',
          name: '',
          status: 'ACTIVE',
          termination_reason: null,
          previous_contract_id: null,
          start_date: '',
          end_date: '',
          renewal_date: '',
          current_value: '',
        },
  })

  const onSubmit = async (data: ContractFormData) => {
    setError(null)
    setLoading(true)

    try {
      const currentValue = data.current_value ? parseFloat(data.current_value) : null
      const oldValue = contract?.current_value || null

      // If editing an ACTIVE contract and value changed, use updateContractValue (handles Upsell/Downsell)
      if (contract && contract.status === 'ACTIVE' && data.status === 'ACTIVE') {
        const valueChanged = oldValue !== currentValue
        
        if (valueChanged) {
          // Use server action for value updates (handles logging)
          await updateContractValue(contract.id, {
            current_value: currentValue,
            name: data.name,
            start_date: data.start_date,
            end_date: data.end_date || null,
            renewal_date: data.renewal_date || null,
          })
        } else {
          // Regular update without value change
          const contractData = {
            name: data.name,
            start_date: data.start_date,
            end_date: data.end_date || null,
            renewal_date: data.renewal_date || null,
            current_value: currentValue,
          }

          const { error: updateError } = await supabase
            .from('contracts')
            .update(contractData)
            .eq('id', contract.id)

          if (updateError) throw updateError
        }
      } else {
        // Create new contract or update ENDED contract
        const contractData = {
          client_id: data.client_id,
          name: data.name,
          status: data.status,
          termination_reason: data.termination_reason || null,
          previous_contract_id: data.previous_contract_id || null,
          start_date: data.start_date,
          end_date: data.end_date || null,
          renewal_date: data.renewal_date || null,
          current_value: currentValue,
        }

        if (contract) {
          const { error: updateError } = await supabase
            .from('contracts')
            .update(contractData)
            .eq('id', contract.id)

          if (updateError) throw updateError
        } else {
          const { error: insertError } = await supabase
            .from('contracts')
            .insert(contractData)

          if (insertError) throw insertError
        }
      }

      router.push(contract ? `/dashboard/contracts/${contract.id}` : '/dashboard/contracts')
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
        label="Status *"
        {...register('status')}
        error={errors.status?.message}
      >
        <option value="ACTIVE">Active</option>
        <option value="ENDED">Ended</option>
      </Select>

      {/* Show termination_reason only when status is ENDED */}
      {contract?.status === 'ENDED' && (
        <Select
          label="Termination Reason"
          {...register('termination_reason')}
          error={errors.termination_reason?.message}
        >
          <option value="">None</option>
          <option value="NOT_RENEWED">Not Renewed</option>
          <option value="CHURN">Churn</option>
          <option value="CUT">Cut</option>
          <option value="RENEWED">Renewed</option>
        </Select>
      )}

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

