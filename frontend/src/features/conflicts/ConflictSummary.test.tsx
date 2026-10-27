import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ConflictSummary } from './ConflictSummary'
import type { Summary } from './api/ticket-types'

describe('ConflictSummary', () => {
  it('renders API totals, risk counts, service-area count, and utility breakdown', () => {
    const summary: Summary = {
      total: 9,
      highRisk: 3,
      mediumRisk: 4,
      lowRisk: 2,
      outsideServiceArea: 2,
      byUtilityType: { WATER: 4, GAS: 2, SANITARY: 1, TELECOM: 2 },
    }
    render(<ConflictSummary summary={summary} />)

    expect(screen.getByText('High risk')).toBeInTheDocument()
    const cards = screen.getByLabelText('Search summary').querySelector('.summary-grid')
    if (!(cards instanceof HTMLElement)) throw new Error('Summary cards are missing')
    expect(within(cards).getByText('9')).toBeInTheDocument()
    expect(within(cards).getByText('3')).toBeInTheDocument()
    expect(within(cards).getByText('4')).toBeInTheDocument()
    expect(within(cards).getAllByText('2')).toHaveLength(2)
    const utilities = screen.getByRole('list')
    expect(within(utilities).getByText('WATER')).toBeInTheDocument()
    expect(within(utilities).getByText('SANITARY')).toBeInTheDocument()
  })
})
