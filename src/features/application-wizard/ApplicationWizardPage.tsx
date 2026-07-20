import { FormProvider, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { WizardLayout } from '@/components/wizard/WizardLayout'
import { WizardStepper } from '@/components/wizard/WizardStepper'
import { WizardActions } from '@/components/wizard/WizardActions'
import { applicationSchema } from './schemas/applicationSchema'
import { defaultValues } from './defaults'
import { WIZARD_STEPS } from './constants'
import { UserInfoStep } from './components/UserInfoStep'
import { useApplicationWizard } from './hooks/useApplicationWizard'
import type { ApplicationFormValues } from './types'

export function ApplicationWizardPage() {
  const form = useForm<ApplicationFormValues>({
    resolver: zodResolver(applicationSchema),
    defaultValues,
    mode: 'onBlur',
    reValidateMode: 'onChange',
    shouldFocusError: true,
  })

  return (
    <FormProvider {...form}>
      <ApplicationWizardContent />
    </FormProvider>
  )
}

function ApplicationWizardContent() {
  const {
    currentStep,
    highestCompletedStep,
    isFirstStep,
    isLastStep,
    goNext,
    goPrevious,
    goToCompletedStep,
  } = useApplicationWizard()

  return (
    <WizardLayout stepLabel={WIZARD_STEPS[currentStep].label}>
      <WizardStepper
        steps={WIZARD_STEPS}
        currentStep={currentStep}
        highestCompletedStep={highestCompletedStep}
        onStepSelect={goToCompletedStep}
      />
      {currentStep === 0 && <UserInfoStep />}
      {currentStep > 0 && (
        <p>Step content for &quot;{WIZARD_STEPS[currentStep].id}&quot; is not built yet.</p>
      )}
      <WizardActions
        isFirstStep={isFirstStep}
        isLastStep={isLastStep}
        onPrevious={goPrevious}
        onNext={goNext}
      />
    </WizardLayout>
  )
}
