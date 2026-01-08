import { z } from 'zod'

export const contractAssignmentSchema = z.object({
  contract_id: z.string().uuid('Invalid contract ID'),
  collaborator_id: z.string().uuid('Invalid collaborator ID'),
  assignment_start_date: z.string().min(1, 'Start date is required'),
  assignment_end_date: z.string().optional(),
  allocation_percentage: z.number().optional().nullable(),
})

export type ContractAssignmentFormData = z.infer<typeof contractAssignmentSchema>

