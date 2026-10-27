import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ConflictPage } from './ConflictPage'
import { getTicketConflicts } from './api/tickets-api'
import type { ConflictResponse } from './api/ticket-types'

vi.mock('./api/tickets-api', () => ({
  getTicketConflicts: vi.fn(),
  TicketsApiError: class TicketsApiError extends Error {},
}))

const emptyResponse: ConflictResponse = {
  tickets: [],
  summary: {
    total: 0,
    highRisk: 0,
    mediumRisk: 0,
    lowRisk: 0,
    outsideServiceArea: 0,
    byUtilityType: {},
  },
}

afterEach(() => vi.resetAllMocks())

describe('ConflictPage request states', () => {
  it('shows loading and then the successful empty result', async () => {
    let resolveRequest!: (response: ConflictResponse) => void
    vi.mocked(getTicketConflicts).mockReturnValue(
      new Promise((resolve) => { resolveRequest = resolve }),
    )
    render(<ConflictPage />)

    fireEvent.click(screen.getByRole('button', { name: /search tickets/i }))
    expect(screen.getByRole('status')).toHaveTextContent(/searching/i)
    await act(async () => resolveRequest(emptyResponse))

    expect(await screen.findByRole('heading', { name: 'No matching tickets' })).toBeInTheDocument()
    expect(screen.getAllByText('0').length).toBeGreaterThan(0)
  })

  it('shows a recoverable error and allows retry', async () => {
    vi.mocked(getTicketConflicts)
      .mockRejectedValueOnce(new Error('Service unavailable'))
      .mockResolvedValueOnce(emptyResponse)
    render(<ConflictPage />)

    fireEvent.click(screen.getByRole('button', { name: /search tickets/i }))
    expect(await screen.findByRole('alert')).toHaveTextContent(/ticket service is unavailable/i)
    fireEvent.click(screen.getByRole('button', { name: /search tickets/i }))
    expect(await screen.findByRole('heading', { name: 'No matching tickets' })).toBeInTheDocument()
    expect(getTicketConflicts).toHaveBeenCalledTimes(2)
  })

  it('shows successful ticket data returned by the API', async () => {
    vi.mocked(getTicketConflicts).mockResolvedValue({
      ...emptyResponse,
      tickets: [{
        id: 21,
        ticketNo: 'API-21',
        status: 'OPEN',
        priority: 'EMERGENCY',
        stationCode: 'HLTNW02',
        utilityType: 'WATER',
        longitude: -79.87,
        latitude: 43.25,
        insideServiceArea: true,
        nearestEmergencyTicketNo: null,
        distanceToNearestEmergencyMeters: null,
        riskLevel: 'HIGH',
      }],
      summary: { ...emptyResponse.summary, total: 1, highRisk: 1 },
    })
    render(<ConflictPage />)

    fireEvent.click(screen.getByRole('button', { name: /search tickets/i }))
    expect(await screen.findByText('API-21')).toBeInTheDocument()
    expect(screen.getByText('HIGH')).toBeInTheDocument()
    expect(screen.getByText('No nearby emergency')).toBeInTheDocument()
  })

  it('does not allow a stale request to replace the latest response', async () => {
    let resolveFirst!: (response: ConflictResponse) => void
    vi.mocked(getTicketConflicts)
      .mockReturnValueOnce(new Promise((resolve) => { resolveFirst = resolve }))
      .mockResolvedValueOnce(emptyResponse)
    render(<ConflictPage />)

    const searchButton = screen.getByRole('button', { name: /search tickets/i })
    fireEvent.click(searchButton)
    fireEvent.click(searchButton)
    expect(await screen.findByRole('heading', { name: 'No matching tickets' })).toBeInTheDocument()

    resolveFirst({
      ...emptyResponse,
      summary: { ...emptyResponse.summary, total: 99 },
    })
    expect(screen.queryByText('99')).not.toBeInTheDocument()
  })
})
