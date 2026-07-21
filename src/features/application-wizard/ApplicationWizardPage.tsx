import { useState } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Box } from '@mui/material'
import { WizardLayout } from '@/components/wizard/WizardLayout'
import { WizardStepper } from '@/components/wizard/WizardStepper'
import { WizardActions } from '@/components/wizard/WizardActions'
import { readDraft } from '@/storage/draftStorage'
import { applicationSchema } from './schemas/applicationSchema'
import { defaultValues } from './defaults'
import { WIZARD_STEPS } from './constants'
import { getHighestReachableStep } from './getHighestReachableStep'
import { UserInfoStep } from './components/UserInfoStep'
import { RequestConfigurationStep } from './components/RequestConfigurationStep'
import { ReviewStep } from './components/ReviewStep'
import { useApplicationWizard } from './hooks/useApplicationWizard'
import { useDraftAutosave } from './hooks/useDraftAutosave'
import type { ApplicationFormValues } from './types'

export function ApplicationWizardPage() {
  const [restoredDraft] = useState(() => readDraft())

  const form = useForm<ApplicationFormValues>({
    resolver: zodResolver(applicationSchema),
    defaultValues: restoredDraft?.values ?? defaultValues,
    mode: 'onBlur',
    reValidateMode: 'onChange',
    shouldFocusError: true,
  })

  const initialStep = restoredDraft
    ? Math.min(restoredDraft.currentStep, getHighestReachableStep(restoredDraft.values))
    : 0

  return (
    <FormProvider {...form}>
      <ApplicationWizardContent initialStep={initialStep} />
    </FormProvider>
  )
}

function ApplicationWizardContent({ initialStep }: { initialStep: number }) {
  const {
    currentStep,
    highestCompletedStep,
    isFirstStep,
    isLastStep,
    goNext,
    goPrevious,
    goToCompletedStep,
    submissionStatus,
    submit,
  } = useApplicationWizard(initialStep)

  useDraftAutosave(currentStep)

  return (
    <WizardLayout stepLabel={WIZARD_STEPS[currentStep].label}>
      <Box role="status" aria-live="polite">
        {submissionStatus === 'success' && 'Application submitted successfully.'}
        {submissionStatus === 'error' && 'Submission failed. Please try again.'}
      </Box>
      <WizardStepper
        steps={WIZARD_STEPS}
        currentStep={currentStep}
        highestCompletedStep={highestCompletedStep}
        onStepSelect={goToCompletedStep}
      />
      {currentStep === 0 && <UserInfoStep />}
      {currentStep === 1 && <RequestConfigurationStep />}
      {currentStep === 2 && (
        <ReviewStep
          onEditUserInfo={() => goToCompletedStep(0)}
          onEditRequestConfiguration={() => goToCompletedStep(1)}
        />
      )}
      <WizardActions
        isFirstStep={isFirstStep}
        isLastStep={isLastStep}
        isSubmitting={submissionStatus === 'submitting'}
        onPrevious={goPrevious}
        onNext={goNext}
        onSubmit={submit}
      />
    </WizardLayout>
  )
}
