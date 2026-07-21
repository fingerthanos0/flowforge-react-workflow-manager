import { Step, StepButton, Stepper } from '@mui/material'

type WizardStep = {
  id: string
  label: string
}

type WizardStepperProps = {
  steps: readonly WizardStep[]
  currentStep: number
  highestCompletedStep: number
  onStepSelect: (step: number) => void
}

export function WizardStepper({
  steps,
  currentStep,
  highestCompletedStep,
  onStepSelect,
}: WizardStepperProps) {
  return (
    <Stepper activeStep={currentStep} nonLinear alternativeLabel>
      {steps.map((step, index) => {
        const isReachable = index <= highestCompletedStep

        return (
          <Step key={step.id} completed={index <= highestCompletedStep}>
            <StepButton onClick={() => onStepSelect(index)} disabled={!isReachable}>
              {step.label}
            </StepButton>
          </Step>
        )
      })}
    </Stepper>
  )
}
