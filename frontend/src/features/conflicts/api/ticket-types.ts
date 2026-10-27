export type RiskLevel = 'HIGH' | 'MEDIUM' | 'LOW'

export interface Ticket {
  id: number
  ticketNo: string
  status: string
  priority: string
  stationCode: string | null
  utilityType: string | null
  longitude: number
  latitude: number
  insideServiceArea: boolean
  nearestEmergencyTicketNo: string | null
  distanceToNearestEmergencyMeters: number | null
  riskLevel: RiskLevel
}

export interface Summary {
  total: number
  highRisk: number
  mediumRisk: number
  lowRisk: number
  outsideServiceArea: number
  byUtilityType: Record<string, number>
}

export interface ConflictResponse {
  tickets: Ticket[]
  summary: Summary
}

export interface ConflictSearch {
  minLng: number
  minLat: number
  maxLng: number
  maxLat: number
  stationCode?: string
  utilityType?: string
  radiusMeters?: number
}
