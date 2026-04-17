// Database Types - Aligned with 000_complete_rebuild.sql

export type EmploymentStatus = 'active' | 'invited' | 'inactive'
export type ClientStatus = 'active' | 'inactive'
export type ContractStatus = 'ACTIVE' | 'ENDED'
export type TerminationReason = 'NOT_RENEWED' | 'CHURN' | 'CUT' | 'RENEWED'
export type ContractLogAction = 'UPSELL' | 'DOWNSELL' | 'CHURN' | 'CUT' | 'NOT_RENEWED' | 'RENEWAL_EXIT' | 'RENEWAL_ENTRY'
export type AuditAction = 'insert' | 'update' | 'delete'

export interface Role {
  id: string
  name: string
  is_system_role: boolean
  created_at: string
}

export interface Collaborator {
  id: string
  user_id: string | null // Nullable for invites not yet accepted
  role_id: string
  full_name: string
  email: string
  status: EmploymentStatus
  invite_token: string | null
  expires_at: string | null
  created_at: string
  updated_at: string
  
  // Relations (often fetched via joins)
  roles?: Role
}

// Alias for UserProfile to match usage in utils
export type UserProfile = Collaborator

export interface Client {
  id: string
  name: string
  status: ClientStatus
  country: string | null
  city: string | null
  industry: string | null
  unique_identifier: string | null
  created_at: string
  updated_at: string
}

export interface Contract {
  id: string
  client_id: string
  name: string
  status: ContractStatus
  termination_reason: TerminationReason | null
  termination_description: string | null
  previous_contract_id: string | null
  start_date: string
  end_date: string | null
  renewal_date: string | null
  current_value: number | null
  created_at: string
  updated_at: string

  // Relations
  clients?: Client
  previous_contract?: Contract
}

export interface ContractAssignment {
  id: string
  contract_id: string
  collaborator_id: string
  role_on_contract: string | null
  start_date: string
  end_date: string | null
  allocation_percentage: number | null
  created_at: string
  updated_at: string

  // Relations
  contracts?: Contract
  collaborators?: Collaborator
}

export interface ContractLog {
  id: string
  contract_id: string
  action_type: ContractLogAction
  old_value: number | null
  new_value: number | null
  delta_value: number
  created_at: string
  created_by: string | null

  // Relations
  contracts?: Contract
}

export interface AuditLog {
  id: string
  user_id: string | null
  table_name: string
  record_id: string
  action: AuditAction
  changes: any // JSONB
  created_at: string
}
