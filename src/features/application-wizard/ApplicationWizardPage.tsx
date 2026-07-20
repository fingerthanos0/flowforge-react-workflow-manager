import { useState } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { WizardLayout } from '@/components/wizard/WizardLayout'
import { applicationSchema } from './schemas/applicationSchema'
import { defaultValues } from './defaults'
import { WIZARD_STEPS } from './constants'
import { UserInfoStep } from './components/UserInfoStep'
import type { ApplicationFormValues } from './types'

export function ApplicationWizardPage() {
  const [currentStep] = useState(0)

  const form = useForm<ApplicationFormValues>({
    resolver: zodResolver(applicationSchema),
    defaultValues,
    mode: 'onBlur',
    reValidateMode: 'onChange',
    shouldFocusError: true,
  })

  return (
    <FormProvider {...form}>
      <WizardLayout stepLabel={WIZARD_STEPS[currentStep].label}>
        {currentStep === 0 && <UserInfoStep />}
        {currentStep > 0 && (
          <p>Step content for &quot;{WIZARD_STEPS[currentStep].id}&quot; is not built yet.</p>
        )}
      </WizardLayout>
    </FormProvider>
  )
}
