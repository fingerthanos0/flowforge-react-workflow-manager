export type Priority = 'low' | 'medium' | 'high'

export type ServiceItem = {
  id: string
  serviceName: string
  description: string
  quantity: number
  priority: Priority
}

export type ApplicationFormValues = {
  userInfo: {
    name: string
    phone: string
    email: string
  }
  requestConfiguration: {
    services: ServiceItem[]
  }
}
