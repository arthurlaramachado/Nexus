import { z } from 'zod'

export const roleSchema = z.object({
  name: z.string().min(1, 'Role name is required'),
  permissions: z.record(z.string(), z.object({
    can_read: z.boolean(),
    can_write: z.boolean(),
    can_delete: z.boolean(),
  })).optional(),
})

export type RoleFormData = z.infer<typeof roleSchema>


