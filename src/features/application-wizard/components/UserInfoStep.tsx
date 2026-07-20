import { useFormContext } from 'react-hook-form'
import { Stack, TextField } from '@mui/material'
import type { ApplicationFormValues } from '../types'

export function UserInfoStep() {
  const {
    register,
    formState: { errors },
  } = useFormContext<ApplicationFormValues>()

  return (
    <Stack spacing={3}>
      <TextField
        label="Full name"
        autoComplete="name"
        fullWidth
        error={!!errors.userInfo?.name}
        helperText={errors.userInfo?.name?.message}
        {...register('userInfo.name')}
      />
      <TextField
        label="Contact number"
        type="tel"
        slotProps={{ htmlInput: { inputMode: 'tel' } }}
        autoComplete="tel"
        fullWidth
        error={!!errors.userInfo?.phone}
        helperText={errors.userInfo?.phone?.message}
        {...register('userInfo.phone')}
      />
      <TextField
        label="Email address"
        type="email"
        slotProps={{ htmlInput: { inputMode: 'email' } }}
        autoComplete="email"
        fullWidth
        error={!!errors.userInfo?.email}
        helperText={errors.userInfo?.email?.message}
        {...register('userInfo.email')}
      />
    </Stack>
  )
}
