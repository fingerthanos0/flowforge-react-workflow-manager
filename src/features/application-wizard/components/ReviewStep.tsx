import { useFormContext, useWatch } from 'react-hook-form'
import { Box, Button, Card, CardContent, Chip, Divider, Stack, Typography } from '@mui/material'
import type { ApplicationFormValues, Priority } from '../types'

type ReviewStepProps = {
  onEditUserInfo: () => void
  onEditRequestConfiguration: () => void
}

const PRIORITY_LABEL: Record<Priority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
}

export function ReviewStep({ onEditUserInfo, onEditRequestConfiguration }: ReviewStepProps) {
  const { control } = useFormContext<ApplicationFormValues>()
  const values = useWatch<ApplicationFormValues>({ control })
  const userInfo = values.userInfo ?? { name: '', phone: '', email: '' }
  const services = values.requestConfiguration?.services ?? []

  return (
    <Stack spacing={3}>
      <Card variant="outlined">
        <CardContent>
          <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">User Information</Typography>
            <Button type="button" size="small" onClick={onEditUserInfo}>
              Edit
            </Button>
          </Stack>
          <Divider sx={{ my: 1 }} />
          <Stack spacing={0.5}>
            <Typography>
              <strong>Name:</strong> {userInfo.name}
            </Typography>
            <Typography>
              <strong>Contact number:</strong> {userInfo.phone}
            </Typography>
            <Typography>
              <strong>Email:</strong> {userInfo.email}
            </Typography>
          </Stack>
        </CardContent>
      </Card>

      <Card variant="outlined">
        <CardContent>
          <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Request Configuration</Typography>
            <Button type="button" size="small" onClick={onEditRequestConfiguration}>
              Edit
            </Button>
          </Stack>
          <Divider sx={{ my: 1 }} />

          {services.length === 0 && (
            <Typography color="text.secondary">No services were requested.</Typography>
          )}

          <Stack spacing={2}>
            {services.map((service, index) => (
              <Box key={service?.id ?? index}>
                <Stack
                  direction="row"
                  sx={{ justifyContent: 'space-between', alignItems: 'center' }}
                >
                  <Typography variant="subtitle2">{service?.serviceName}</Typography>
                  <Chip label={PRIORITY_LABEL[service?.priority ?? 'medium']} size="small" />
                </Stack>
                {service?.description && (
                  <Typography variant="body2" color="text.secondary">
                    {service.description}
                  </Typography>
                )}
                <Typography variant="body2">Quantity: {service?.quantity}</Typography>
              </Box>
            ))}
          </Stack>
        </CardContent>
      </Card>
    </Stack>
  )
}
