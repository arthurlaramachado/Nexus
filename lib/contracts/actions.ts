'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

// Helper: Create contract log entry
async function createContractLog(
  contractId: string,
  actionType: 'UPSELL' | 'DOWNSELL' | 'CHURN' | 'CUT' | 'NOT_RENEWED' | 'RENEWAL_EXIT' | 'RENEWAL_ENTRY',
  oldValue: number | null,
  newValue: number | null,
  deltaValue: number
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { error } = await supabase
    .from('contract_logs')
    .insert({
      contract_id: contractId,
      action_type: actionType,
      old_value: oldValue,
      new_value: newValue,
      delta_value: deltaValue,
      created_by: user?.id || null,
    })

  if (error) throw error
}

// 1. Update Contract Value (Upsell/Downsell detection)
export async function updateContractValue(
  contractId: string,
  updates: {
    current_value?: number | null
    name?: string
    start_date?: string
    end_date?: string | null
    renewal_date?: string | null
  }
) {
  const supabase = await createClient()
  
  // Verify permissions
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  // Get current contract to compare values
  const { data: currentContract, error: fetchError } = await supabase
    .from('contracts')
    .select('current_value, status')
    .eq('id', contractId)
    .single()

  if (fetchError || !currentContract) {
    throw new Error('Contract not found')
  }

  if (currentContract.status !== 'ACTIVE') {
    throw new Error('Can only modify ACTIVE contracts')
  }

  const oldValue = currentContract.current_value
  const newValue = updates.current_value ?? oldValue

  // Determine if it's Upsell or Downsell based on value change
  let actionType: 'UPSELL' | 'DOWNSELL' | null = null
  if (oldValue !== null && newValue !== null && oldValue !== newValue) {
    actionType = newValue > oldValue ? 'UPSELL' : 'DOWNSELL'
  }

  // Update contract
  const { error: updateError } = await supabase
    .from('contracts')
    .update(updates)
    .eq('id', contractId)

  if (updateError) throw updateError

  // Create log entry if value changed
  if (actionType && oldValue !== newValue) {
    const deltaValue = (newValue || 0) - (oldValue || 0)
    await createContractLog(contractId, actionType, oldValue, newValue, deltaValue)
  }

  revalidatePath(`/dashboard/contracts/${contractId}`)
  revalidatePath('/dashboard/contracts')
  return { success: true, actionType }
}

// 2. End Contract
export async function endContract(
  contractId: string,
  reason: 'CHURN' | 'CUT' | 'NOT_RENEWED'
) {
  const supabase = await createClient()
  
  // Verify permissions
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  // Get current contract value
  const { data: currentContract, error: fetchError } = await supabase
    .from('contracts')
    .select('current_value, status')
    .eq('id', contractId)
    .single()

  if (fetchError || !currentContract) {
    throw new Error('Contract not found')
  }

  if (currentContract.status !== 'ACTIVE') {
    throw new Error('Can only end ACTIVE contracts')
  }

  const contractValue = currentContract.current_value || 0

  // Update contract: set status to ENDED and termination_reason
  const { error: updateError } = await supabase
    .from('contracts')
    .update({
      status: 'ENDED',
      termination_reason: reason,
    })
    .eq('id', contractId)

  if (updateError) throw updateError

  // Create log entry
  await createContractLog(
    contractId,
    reason,
    contractValue,
    0,
    -contractValue // Negative delta (lost revenue)
  )

  revalidatePath(`/dashboard/contracts/${contractId}`)
  revalidatePath('/dashboard/contracts')
  return { success: true }
}

// 3. Renew Contract
export async function renewContract(
  contractId: string,
  newContractData: {
    name: string
    client_id: string
    start_date: string
    end_date?: string | null
    renewal_date?: string | null
    current_value: number | null
  }
) {
  const supabase = await createClient()
  
  // Verify permissions
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  // Get old contract
  const { data: oldContract, error: fetchError } = await supabase
    .from('contracts')
    .select('id, current_value, status')
    .eq('id', contractId)
    .single()

  if (fetchError || !oldContract) {
    throw new Error('Contract not found')
  }

  if (oldContract.status !== 'ACTIVE') {
    throw new Error('Can only renew ACTIVE contracts')
  }

  const oldValue = oldContract.current_value || 0
  const newValue = newContractData.current_value || 0

  // Step 1: End old contract
  const { error: updateOldError } = await supabase
    .from('contracts')
    .update({
      status: 'ENDED',
      termination_reason: 'RENEWED',
    })
    .eq('id', contractId)

  if (updateOldError) throw updateOldError

  // Create log for old contract (RENEWAL_EXIT)
  await createContractLog(
    contractId,
    'RENEWAL_EXIT',
    oldValue,
    0,
    -oldValue // Negative delta (removes ARR from old contract)
  )

  // Step 2: Create new contract
  const { data: newContract, error: createError } = await supabase
    .from('contracts')
    .insert({
      ...newContractData,
      status: 'ACTIVE',
      termination_reason: null,
      previous_contract_id: contractId,
    })
    .select()
    .single()

  if (createError || !newContract) {
    throw new Error('Failed to create new contract')
  }

  // Create log for new contract (RENEWAL_ENTRY)
  await createContractLog(
    newContract.id,
    'RENEWAL_ENTRY',
    0,
    newValue,
    newValue // Positive delta (adds ARR to new contract)
  )

  revalidatePath(`/dashboard/contracts/${contractId}`)
  revalidatePath(`/dashboard/contracts/${newContract.id}`)
  revalidatePath('/dashboard/contracts')
  return { success: true, newContractId: newContract.id }
}
