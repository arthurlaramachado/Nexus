import { z } from 'zod'

export const contractSchema = z.object({
  client_id: z.string().uuid('Invalid client ID'),
  name: z.string().min(1, 'Name is required'),
  contract_type: z.enum(['new_deal', 'renewed', 'upsell', 'downsell', 'not_renewed', 'churn', 'cut']),
  status: z.enum(['active', 'paused', 'inactive']),
  start_date: z.string().min(1, 'Start date is required'),
  end_date: z.string().optional(),
  renewal_date: z.string().optional(),
  contract_value: z.string().optional(),
})

export type ContractFormData = z.infer<typeof contractSchema>
