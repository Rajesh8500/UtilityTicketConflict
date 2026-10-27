import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { TicketTable } from './TicketTable'
import type { Ticket } from './api/ticket-types'

const ticket: Ticket = {
  id: 1,
  ticketNo: 'T-100',
  status: 'OPEN',
  priority: 'STANDARD',
  stationCode: null,
  utilityType: null,
  longitude: -79.9,
  latitude: 43.2,
  insideServiceArea: false,
  nearestEmergencyTicketNo: null,
  distanceToNearestEmergencyMeters: null,
  riskLevel: 'MEDIUM',
}

describe('TicketTable', () => {
  it('renders all contract fields and handles nullable values', () => {
    render(<TicketTable tickets={[ticket]} />)

    for (const header of [
      'Ticket number', 'Status', 'Priority', 'Station code', 'Utility type',
      'Longitude', 'Latitude', 'Inside service area', 'Nearest emergency ticket',
      'Distance to nearest emergency (m)', 'Risk',
    ]) {
      expect(screen.getByRole('columnheader', { name: header })).toBeInTheDocument()
    }

    expect(screen.getByText('T-100')).toBeInTheDocument()
    expect(screen.getAllByText('Not assigned')).toHaveLength(2)
    expect(screen.getByText('No nearby emergency')).toBeInTheDocument()
    expect(screen.getByText('Outside')).toBeInTheDocument()
    expect(screen.getByText('MEDIUM')).toBeInTheDocument()
  })
})
