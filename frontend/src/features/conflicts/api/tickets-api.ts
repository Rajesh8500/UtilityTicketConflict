import { API_BASE_URL } from '../../../config'
import type { ConflictResponse, ConflictSearch } from './ticket-types'

export class TicketsApiError extends Error {
  readonly status?: number

  constructor(
    message: string,
    status?: number,
  ) {
    super(message)
    this.name = 'TicketsApiError'
    this.status = status
  }
}

function errorMessage(payload: unknown): string {
  if (typeof payload !== 'object' || payload === null || !('message' in payload)) {
    return 'The ticket service could not complete the request.'
  }

  const message = (payload as { message?: unknown }).message
  if (typeof message === 'string') return message
  if (Array.isArray(message)) {
    const details = message.filter((item): item is string => typeof item === 'string')
    if (details.length > 0) return details.join('; ')
  }
  return 'The ticket service could not complete the request.'
}

export async function getTicketConflicts(
  search: ConflictSearch,
  signal?: AbortSignal,
): Promise<ConflictResponse> {
  const url = new URL(`${API_BASE_URL}/tickets/conflicts`)
  url.searchParams.set(
    'bbox',
    `${search.minLng},${search.minLat},${search.maxLng},${search.maxLat}`,
  )
  const stationCode = search.stationCode?.trim()
  const utilityType = search.utilityType?.trim()
  if (stationCode) url.searchParams.set('stationCode', stationCode)
  if (utilityType) url.searchParams.set('utilityType', utilityType)
  url.searchParams.set('radiusMeters', String(search.radiusMeters ?? 250))

  let response: Response
  try {
    response = await fetch(url, { signal, headers: { Accept: 'application/json' } })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error
    throw new TicketsApiError('Unable to reach the ticket service. Check the connection and try again.')
  }

  let payload: unknown
  try {
    payload = await response.json()
  } catch {
    throw new TicketsApiError(
      'The ticket service returned an unreadable response.',
      response.status,
    )
  }

  if (!response.ok) {
    throw new TicketsApiError(errorMessage(payload), response.status)
  }

  return payload as ConflictResponse
}
