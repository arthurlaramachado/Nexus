import { z } from 'zod'

export const roleSchema = z.object({
  name: z.string().min(1, 'Role name is required'),
  // Removed department as it's not in the schema
})

export type RoleFormData = z.infer<typeof roleSchema>

