import { z } from 'zod'

export const serviceSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
})

export type ServiceFormData = z.infer<typeof serviceSchema>
