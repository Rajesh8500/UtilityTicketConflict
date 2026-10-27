import type { RiskLevel } from './api/ticket-types'

interface RiskBadgeProps {
  riskLevel: RiskLevel
}

export function RiskBadge({ riskLevel }: RiskBadgeProps) {
  return (
    <span className={`risk-badge risk-${riskLevel.toLowerCase()}`} data-risk={riskLevel}>
      <span className="risk-dot" aria-hidden="true" />
      {riskLevel}
    </span>
  )
}
