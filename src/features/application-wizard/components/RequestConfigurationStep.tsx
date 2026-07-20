import { useFieldArray, useFormContext } from 'react-hook-form'
import { Button, Stack, Typography } from '@mui/material'
import { createEmptyServiceItem } from '../defaults'
import { ServiceItemCard } from './ServiceItemCard'
import type { ApplicationFormValues } from '../types'

export function RequestConfigurationStep() {
  const { control } = useFormContext<ApplicationFormValues>()
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'requestConfiguration.services',
    keyName: 'formFieldKey',
  })

  return (
    <Stack spacing={3}>
      {fields.length === 0 && (
        <Typography color="text.secondary">
          No services added yet. Services are optional — add one only if you need to request
          something specific.
        </Typography>
      )}

      {fields.map((field, index) => (
        <ServiceItemCard key={field.formFieldKey} index={index} onRemove={() => remove(index)} />
      ))}

      <Button
        type="button"
        variant="outlined"
        onClick={() => append(createEmptyServiceItem())}
      >
        Add service
      </Button>
    </Stack>
  )
}
