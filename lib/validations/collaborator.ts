import { z } from 'zod'

export const collaboratorSchema = z.object({
  full_name: z.string().min(1, 'Full name is required'),
  role_id: z.string().uuid('Invalid role ID'),
  employment_status: z.enum(['active', 'invited', 'inactive']),
  email: z.string().email('Invalid email address'),
})

export type CollaboratorFormData = z.infer<typeof collaboratorSchema>
