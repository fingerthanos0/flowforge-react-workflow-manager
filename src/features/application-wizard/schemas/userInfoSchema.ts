import { z } from 'zod'
import { EMAIL_REGEX, PHONE_REGEX } from '@/utils/regex'

export const userInfoSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Name must contain at least 2 characters')
    .max(100, 'Name must not exceed 100 characters'),

  phone: z
    .string()
    .trim()
    .regex(PHONE_REGEX, 'Enter a valid contact number'),

  email: z
    .string()
    .trim()
    .regex(EMAIL_REGEX, 'Enter a valid email address')
    .max(254, 'Email address is too long'),
})
