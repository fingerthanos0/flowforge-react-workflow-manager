import type { ReactNode } from 'react'

type WizardLayoutProps = {
  stepLabel: string
  children: ReactNode
}

export function WizardLayout({ stepLabel, children }: WizardLayoutProps) {
  return (
    <div className="wizard-page">
      <header>
        <h1>FlowForge</h1>
        <p>{stepLabel}</p>
      </header>
      <div className="wizard-content">{children}</div>
    </div>
  )
}
