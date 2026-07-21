import { useEffect } from 'react'
import { useFormContext, useWatch } from 'react-hook-form'
import { writeDraft } from '@/storage/draftStorage'
import type { ApplicationFormValues } from '../types'

const AUTOSAVE_DEBOUNCE_MS = 400

export function useDraftAutosave(currentStep: number) {
  const { control } = useFormContext<ApplicationFormValues>()
  const values = useWatch({ control })

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      writeDraft({
        version: 1,
        updatedAt: new Date().toISOString(),
        currentStep,
        values: values as ApplicationFormValues,
      })
    }, AUTOSAVE_DEBOUNCE_MS)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [values, currentStep])
}
