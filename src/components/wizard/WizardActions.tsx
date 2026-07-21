import { Button, Stack } from '@mui/material'

type WizardActionsProps = {
  isFirstStep: boolean
  isLastStep: boolean
  isSubmitting: boolean
  onPrevious: () => void
  onNext: () => void
  onSubmit: () => void
}

export function WizardActions({
  isFirstStep,
  isLastStep,
  isSubmitting,
  onPrevious,
  onNext,
  onSubmit,
}: WizardActionsProps) {
  return (
    <Stack direction="row" sx={{ justifyContent: 'space-between' }} className="wizard-actions">
      <Button
        type="button"
        variant="outlined"
        onClick={onPrevious}
        disabled={isFirstStep || isSubmitting}
      >
        Previous
      </Button>
      {isLastStep ? (
        <Button type="button" variant="contained" onClick={onSubmit} disabled={isSubmitting}>
          {isSubmitting ? 'Submitting…' : 'Submit'}
        </Button>
      ) : (
        <Button type="button" variant="contained" onClick={onNext}>
          Next
        </Button>
      )}
    </Stack>
  )
}
