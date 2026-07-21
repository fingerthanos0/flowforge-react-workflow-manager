export const WIZARD_STEPS = [
  {
    id: 'user-info',
    label: 'User Info',
  },
  {
    id: 'request-configuration',
    label: 'Request Configuration',
  },
  {
    id: 'review',
    label: 'Review & Confirm',
  },
] as const

export const STEP_FIELDS = {
  0: ['userInfo.name', 'userInfo.phone', 'userInfo.email'],
  1: ['requestConfiguration.services'],
} as const
