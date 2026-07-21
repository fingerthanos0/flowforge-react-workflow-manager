import type { ReactNode } from 'react'
import { Box, Typography } from '@mui/material'

type WizardLayoutProps = {
  stepLabel: string
  actions: ReactNode
  children: ReactNode
}

export function WizardLayout({ stepLabel, actions, children }: WizardLayoutProps) {
  return (
    <Box className="wizard-page">
      <Box component="header" sx={{ px: 2, pt: 2 }}>
        <Typography variant="h5" component="h1">
          FlowForge
        </Typography>
        <Typography color="text.secondary">{stepLabel}</Typography>
      </Box>
      <Box className="wizard-content">{children}</Box>
      {actions}
    </Box>
  )
}
