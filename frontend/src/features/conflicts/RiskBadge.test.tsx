import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { RiskBadge } from './RiskBadge'

describe('RiskBadge', () => {
  it.each(['HIGH', 'MEDIUM', 'LOW'] as const)('identifies %s without relying on color', (risk) => {
    render(<RiskBadge riskLevel={risk} />)
    expect(screen.getByText(risk)).toHaveAttribute('data-risk', risk)
  })
})
