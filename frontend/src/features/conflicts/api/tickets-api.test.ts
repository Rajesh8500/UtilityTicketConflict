import { afterEach, describe, expect, it, vi } from 'vitest'
import { getTicketConflicts } from './tickets-api'

describe('getTicketConflicts', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('encodes bbox values and includes supplied optional filters', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ tickets: [], summary: {} }), { status: 200 }),
    )
    vi.stubGlobal('fetch', fetchMock)

    await getTicketConflicts({
      minLng: -80,
      minLat: 43.18,
      maxLng: -79.65,
      maxLat: 43.38,
      stationCode: 'HLTNW02',
      utilityType: 'WATER',
      radiusMeters: 500,
    })

    const requestedUrl = new URL(fetchMock.mock.calls[0][0] as string)
    expect(requestedUrl.pathname).toBe('/api/tickets/conflicts')
    expect(requestedUrl.searchParams.get('bbox')).toBe('-80,43.18,-79.65,43.38')
    expect(requestedUrl.searchParams.get('stationCode')).toBe('HLTNW02')
    expect(requestedUrl.searchParams.get('utilityType')).toBe('WATER')
    expect(requestedUrl.searchParams.get('radiusMeters')).toBe('500')
  })

  it('uses the 250-meter radius default and omits blank filters', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ tickets: [], summary: {} }), { status: 200 }),
    )
    vi.stubGlobal('fetch', fetchMock)

    await getTicketConflicts({
      minLng: -80,
      minLat: 43,
      maxLng: -79,
      maxLat: 44,
      stationCode: ' ',
      utilityType: '',
    })

    const requestedUrl = new URL(fetchMock.mock.calls[0][0] as string)
    expect(requestedUrl.searchParams.get('radiusMeters')).toBe('250')
    expect(requestedUrl.searchParams.has('stationCode')).toBe(false)
    expect(requestedUrl.searchParams.has('utilityType')).toBe(false)
  })

  it('returns the typed response from the API', async () => {
    const body = {
      tickets: [{
        id: 1,
        ticketNo: 'T-1',
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
      }],
      summary: {
        total: 1,
        highRisk: 0,
        mediumRisk: 1,
        lowRisk: 0,
        outsideServiceArea: 1,
        byUtilityType: {},
      },
    }
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response(JSON.stringify(body), { status: 200 })),
    )

    await expect(
      getTicketConflicts({ minLng: -80, minLat: 43, maxLng: -79, maxLat: 44 }),
    ).resolves.toEqual(body)
  })

  it('parses the shared HTTP 400 error envelope', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({
          statusCode: 400,
          error: 'Bad Request',
          message: ['bbox must contain four coordinates'],
        }), { status: 400 }),
      ),
    )

    await expect(
      getTicketConflicts({ minLng: -80, minLat: 43, maxLng: -79, maxLat: 44 }),
    ).rejects.toThrow('bbox must contain four coordinates')
  })
})
