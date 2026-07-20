import { useCallback, useState } from 'react'
import { useFormContext } from 'react-hook-form'
import type { Path } from 'react-hook-form'
import { STEP_FIELDS, WIZARD_STEPS } from '../constants'
import type { ApplicationFormValues } from '../types'

const LAST_STEP = WIZARD_STEPS.length - 1

export type UseApplicationWizardResult = {
  currentStep: number
  highestCompletedStep: number
  isFirstStep: boolean
  isLastStep: boolean
  goNext: () => Promise<void>
  goPrevious: () => void
  goToCompletedStep: (step: number) => void
}

export function useApplicationWizard(initialStep = 0): UseApplicationWizardResult {
  const { trigger } = useFormContext<ApplicationFormValues>()
  const [currentStep, setCurrentStep] = useState(initialStep)
  const [highestCompletedStep, setHighestCompletedStep] = useState(initialStep - 1)

  const goNext = useCallback(async () => {
    const fields = STEP_FIELDS[currentStep as keyof typeof STEP_FIELDS] as
      | readonly Path<ApplicationFormValues>[]
      | undefined

    const valid = fields ? await trigger(fields, { shouldFocus: true }) : true

    if (!valid) {
      return
    }

    setHighestCompletedStep((step) => Math.max(step, currentStep))
    setCurrentStep((step) => Math.min(step + 1, LAST_STEP))
  }, [currentStep, trigger])

  const goPrevious = useCallback(() => {
    setCurrentStep((step) => Math.max(step - 1, 0))
  }, [])

  const goToCompletedStep = useCallback(
    (step: number) => {
      if (step >= 0 && step <= highestCompletedStep) {
        setCurrentStep(step)
      }
    },
    [highestCompletedStep],
  )

  return {
    currentStep,
    highestCompletedStep,
    isFirstStep: currentStep === 0,
    isLastStep: currentStep === LAST_STEP,
    goNext,
    goPrevious,
    goToCompletedStep,
  }
}
