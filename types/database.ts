// Database Types - Aligned with 000_complete_rebuild.sql

export type EmploymentStatus = 'active' | 'invited' | 'inactive'
export type ClientStatus = 'active' | 'inactive'
export type ContractType = 'new_deal' | 'renewed' | 'upsell' | 'downsell' | 'not_renewed' | 'churn' | 'cut'
export type ContractStatus = 'active' | 'paused' | 'inactive'
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
  contract_type: ContractType
  status: ContractStatus
  start_date: string
  end_date: string | null
  renewal_date: string | null
  contract_value: number | null
  created_at: string
  updated_at: string

  // Relations
  clients?: Client
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

export interface AuditLog {
  id: string
  user_id: string | null
  table_name: string
  record_id: string
  action: AuditAction
  changes: any // JSONB
  created_at: string
}
