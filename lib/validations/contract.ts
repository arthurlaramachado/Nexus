import { z } from 'zod'

export const contractSchema = z.object({
  client_id: z.string().uuid('Invalid client ID'),
  name: z.string().min(1, 'Name is required'),
  status: z.enum(['ACTIVE', 'ENDED']),
  termination_reason: z.enum(['NOT_RENEWED', 'CHURN', 'CUT', 'RENEWED']).nullable().optional(),
  previous_contract_id: z.string().uuid('Invalid previous contract ID').nullable().optional(),
  start_date: z.string().min(1, 'Start date is required'),
  end_date: z.string().optional(),
  renewal_date: z.string().optional(),
  current_value: z.string().optional(),
}).refine(
  (data) => {
    // ACTIVE contracts cannot have termination_reason
    if (data.status === 'ACTIVE' && data.termination_reason) {
      return false
    }
    return true
  },
  {
    message: 'ACTIVE contracts cannot have a termination reason',
    path: ['termination_reason'],
  }
)

export type ContractFormData = z.infer<typeof contractSchema>
