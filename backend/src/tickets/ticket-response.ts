import { RiskLevel } from './risk-classifier';

export interface TicketResponse {
  id: number;
  ticketNo: string;
  status: string;
  priority: string;
  stationCode: string | null;
  utilityType: string | null;
  longitude: number;
  latitude: number;
  insideServiceArea: boolean;
  nearestEmergencyTicketNo: string | null;
  distanceToNearestEmergencyMeters: number | null;
  riskLevel: RiskLevel;
}

export interface ConflictSummaryResponse {
  total: number;
  highRisk: number;
  mediumRisk: number;
  lowRisk: number;
  outsideServiceArea: number;
  byUtilityType: Record<string, number>;
}

export interface ConflictResponse {
  tickets: TicketResponse[];
  summary: ConflictSummaryResponse;
}
