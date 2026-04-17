'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { contractAssignmentSchema, ContractAssignmentFormData } from '@/lib/validations/contract-assignment'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Button from '@/components/ui/Button'
import { createClient } from '@/lib/supabase/client'
import { ContractAssignment } from '@/types/database'

interface ContractAssignmentFormProps {
  assignment?: ContractAssignment
  contracts: Array<{ id: string; name: string; client_id: string }>
  clients: Array<{ id: string; name: string }>
  collaborators: Array<{
    id: string
    full_name: string
    role_id: string
    roles: { name: string } | null
  }>
  defaultContractId?: string
  defaultCollaboratorId?: string
}

export default function ContractAssignmentForm({
  assignment,
  contracts,
  clients,
  collaborators,
  defaultContractId,
  defaultCollaboratorId,
}: ContractAssignmentFormProps) {
  const router = useRouter()
  const supabase = createClient()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [selectedClientId, setSelectedClientId] = useState<string>('')

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ContractAssignmentFormData>({
    resolver: zodResolver(contractAssignmentSchema),
    defaultValues: assignment ? {
      contract_id: assignment.contract_id,
      collaborator_id: assignment.collaborator_id,
      assignment_start_date: assignment.start_date,
      assignment_end_date: assignment.end_date || '',
      allocation_percentage: assignment.allocation_percentage || undefined,
    } : {
      contract_id: defaultContractId || '',
      collaborator_id: defaultCollaboratorId || '',
      assignment_start_date: new Date().toISOString().split('T')[0],
      assignment_end_date: '',
    },
  })

  // Initialize selectedClientId if a contract is pre-selected or editing
  useState(() => {
    const initialContractId = assignment?.contract_id || defaultContractId
    if (initialContractId) {
      const contract = contracts.find(c => c.id === initialContractId)
      if (contract) {
        setSelectedClientId(contract.client_id)
      }
    }
  })

  const selectedCollaboratorId = watch('collaborator_id')
  const selectedCollaborator = collaborators.find(c => c.id === selectedCollaboratorId)

  // Filter contracts based on selected client
  const filteredContracts = selectedClientId
    ? contracts.filter(c => c.client_id === selectedClientId)
    : []

  const onSubmit = async (data: ContractAssignmentFormData) => {
    setError(null)
    setLoading(true)

    try {
      const assignmentData = {
        contract_id: data.contract_id,
        collaborator_id: data.collaborator_id,
        start_date: data.assignment_start_date,
        end_date: data.assignment_end_date || null,
        allocation_percentage: data.allocation_percentage || null,
        // Autofill role based on collaborator's role if needed, or leave null
        role_on_contract: selectedCollaborator?.roles?.name || null
      }

      if (assignment) {
        const { error: updateError } = await supabase
          .from('contract_assignments')
          .update(assignmentData)
          .eq('id', assignment.id)

        if (updateError) throw updateError
      } else {
        const { error: insertError } = await supabase
          .from('contract_assignments')
          .insert(assignmentData)

        if (insertError) throw insertError
      }

      router.push(`/dashboard/contracts/${data.contract_id}`)
      router.refresh()
    } catch (err: any) {
      console.error(err)
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
        label="Client"
        value={selectedClientId}
        onChange={(e) => {
          setSelectedClientId(e.target.value)
          setValue('contract_id', '') // Reset contract when client changes
        }}
        disabled={!!defaultContractId || !!assignment} // Lock client if contract is pre-filled
      >
        <option value="">Select a client</option>
        {clients.map((client) => (
          <option key={client.id} value={client.id}>
            {client.name}
          </option>
        ))}
      </Select>

      <Select
        label="Contract *"
        {...register('contract_id')}
        error={errors.contract_id?.message}
        disabled={!selectedClientId || !!defaultContractId}
      >
        <option value="">{selectedClientId ? 'Select a contract' : 'Select a client first'}</option>
        {filteredContracts.map((contract) => (
          <option key={contract.id} value={contract.id}>
            {contract.name}
          </option>
        ))}
      </Select>

      <Select
        label="Collaborator *"
        {...register('collaborator_id')}
        error={errors.collaborator_id?.message}
        disabled={!!defaultCollaboratorId}
      >
        <option value="">Select a collaborator</option>
        {collaborators.map((collaborator) => (
          <option key={collaborator.id} value={collaborator.id}>
            {collaborator.full_name}
          </option>
        ))}
      </Select>

      {selectedCollaborator && selectedCollaborator.roles && (
        <div className="bg-[#F7F7F8] p-4 rounded-md">
          <p className="text-sm text-[#6B6B78]">
            <span className="font-medium">Current Role:</span>{' '}
            {selectedCollaborator.roles.name}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Start Date *"
          type="date"
          {...register('assignment_start_date')}
          error={errors.assignment_start_date?.message}
        />

        <Input
          label="End Date (Optional)"
          type="date"
          {...register('assignment_end_date')}
          error={errors.assignment_end_date?.message}
        />
      </div>

      <Input
        label="Allocation Percentage (0-100)"
        type="number"
        step="0.01"
        {...register('allocation_percentage', { valueAsNumber: true })}
        error={errors.allocation_percentage?.message}
      />

      <div className="flex gap-4">
        <Button type="submit" disabled={loading}>
          {loading ? 'Saving...' : assignment ? 'Update Assignment' : 'Assign Collaborator'}
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
