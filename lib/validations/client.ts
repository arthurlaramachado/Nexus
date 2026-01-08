import { z } from 'zod'

export const clientSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  status: z.enum(['active', 'inactive']),
  country: z.string().optional(),
  city: z.string().optional(),
  unique_identifier: z.string().optional(), // Auto-generated
})

export type ClientFormData = z.infer<typeof clientSchema>
