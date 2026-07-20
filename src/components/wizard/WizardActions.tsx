import { Button, Stack } from '@mui/material'

type WizardActionsProps = {
  isFirstStep: boolean
  isLastStep: boolean
  onPrevious: () => void
  onNext: () => void
}

export function WizardActions({ isFirstStep, isLastStep, onPrevious, onNext }: WizardActionsProps) {
  return (
    <Stack direction="row" sx={{ justifyContent: 'space-between' }} className="wizard-actions">
      <Button type="button" variant="outlined" onClick={onPrevious} disabled={isFirstStep}>
        Previous
      </Button>
      {!isLastStep && (
        <Button type="button" variant="contained" onClick={onNext}>
          Next
        </Button>
      )}
    </Stack>
  )
}
