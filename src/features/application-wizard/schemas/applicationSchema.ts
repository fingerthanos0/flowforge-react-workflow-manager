import { z } from 'zod'
import { userInfoSchema } from './userInfoSchema'
import { serviceItemSchema } from './serviceItemSchema'

export const applicationSchema = z.object({
  userInfo: userInfoSchema,

  requestConfiguration: z.object({
    services: z.array(serviceItemSchema),
  }),
})
