import type { ApplicationFormValues } from '../types'

export type SubmissionResult = {
  referenceId: string
}

export async function submitApplication(
  _values: ApplicationFormValues,
): Promise<SubmissionResult> {
  await new Promise((resolve) => {
    window.setTimeout(resolve, 800)
  })

  return {
    referenceId: crypto.randomUUID(),
  }
}
