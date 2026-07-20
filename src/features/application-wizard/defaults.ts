import type { ApplicationFormValues, ServiceItem } from './types'

export const defaultValues: ApplicationFormValues = {
  userInfo: {
    name: '',
    phone: '',
    email: '',
  },
  requestConfiguration: {
    services: [],
  },
}

export const createEmptyServiceItem = (): ServiceItem => ({
  id: crypto.randomUUID(),
  serviceName: '',
  description: '',
  quantity: 1,
  priority: 'medium',
})
