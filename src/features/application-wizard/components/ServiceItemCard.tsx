import { useFormContext } from 'react-hook-form'
import { Card, CardContent, IconButton, MenuItem, Stack, TextField, Typography } from '@mui/material'
import { scrollFocusedFieldIntoView } from '@/utils/scrollFocusedFieldIntoView'
import type { ApplicationFormValues } from '../types'

type ServiceItemCardProps = {
  index: number
  onRemove: () => void
}

export function ServiceItemCard({ index, onRemove }: ServiceItemCardProps) {
  const {
    register,
    formState: { errors },
  } = useFormContext<ApplicationFormValues>()

  const itemErrors = errors.requestConfiguration?.services?.[index]

  return (
    <Card variant="outlined">
      <CardContent>
        <Stack spacing={2}>
          <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="subtitle2">Service {index + 1}</Typography>
            <IconButton aria-label={`Remove service ${index + 1}`} onClick={onRemove} size="small">
              ✕
            </IconButton>
          </Stack>

          <TextField
            label="Service name"
            fullWidth
            error={!!itemErrors?.serviceName}
            helperText={itemErrors?.serviceName?.message}
            onFocus={(event) => scrollFocusedFieldIntoView(event.currentTarget)}
            {...register(`requestConfiguration.services.${index}.serviceName`)}
          />

          <TextField
            label="Description"
            fullWidth
            multiline
            minRows={2}
            error={!!itemErrors?.description}
            helperText={itemErrors?.description?.message}
            onFocus={(event) => scrollFocusedFieldIntoView(event.currentTarget)}
            {...register(`requestConfiguration.services.${index}.description`)}
          />

          <TextField
            label="Quantity"
            type="number"
            fullWidth
            error={!!itemErrors?.quantity}
            helperText={itemErrors?.quantity?.message}
            onFocus={(event) => scrollFocusedFieldIntoView(event.currentTarget)}
            {...register(`requestConfiguration.services.${index}.quantity`, {
              valueAsNumber: true,
            })}
          />

          <TextField
            select
            label="Priority"
            fullWidth
            defaultValue="medium"
            error={!!itemErrors?.priority}
            helperText={itemErrors?.priority?.message}
            {...register(`requestConfiguration.services.${index}.priority`)}
          >
            <MenuItem value="low">Low</MenuItem>
            <MenuItem value="medium">Medium</MenuItem>
            <MenuItem value="high">High</MenuItem>
          </TextField>
        </Stack>
      </CardContent>
    </Card>
  )
}
