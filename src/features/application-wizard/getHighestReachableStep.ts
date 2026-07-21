import { userInfoSchema } from './schemas/userInfoSchema'
import { serviceItemSchema } from './schemas/serviceItemSchema'
import { WIZARD_STEPS } from './constants'
import type { ApplicationFormValues } from './types'

/**
 * Determines the furthest step a restored draft may safely land on, so a
 * hand-edited or stale localStorage value can't bypass linear validation.
 */
export function getHighestReachableStep(values: ApplicationFormValues): number {
  if (!userInfoSchema.safeParse(values.userInfo).success) {
    return 0
  }

  const servicesAreValid = values.requestConfiguration.services.every(
    (service) => serviceItemSchema.safeParse(service).success,
  )

  if (!servicesAreValid) {
    return 1
  }

  return WIZARD_STEPS.length - 1
}
