import { z } from 'zod'

export const serviceItemSchema = z.object({
  id: z.string().min(1),

  serviceName: z
    .string()
    .trim()
    .min(2, 'Service name must contain at least 2 characters')
    .max(100, 'Service name must not exceed 100 characters'),

  description: z.string().trim().max(500, 'Description must not exceed 500 characters'),

  quantity: z
    .number()
    .int('Quantity must be a whole number')
    .min(1, 'Quantity must be at least 1')
    .max(999, 'Quantity must not exceed 999'),

  priority: z.enum(['low', 'medium', 'high']),
})
