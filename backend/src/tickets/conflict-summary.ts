import { RiskLevel } from './risk-classifier';

export interface SummaryTicket {
  riskLevel: RiskLevel;
  insideServiceArea: boolean;
  utilityType: string | null;
}

export interface ConflictSummary {
  total: number;
  highRisk: number;
  mediumRisk: number;
  lowRisk: number;
  outsideServiceArea: number;
  byUtilityType: Record<string, number>;
}

export function summarizeTickets(tickets: readonly SummaryTicket[]): ConflictSummary {
  const utilityCounts = new Map<string, number>();
  let highRisk = 0;
  let mediumRisk = 0;
  let lowRisk = 0;
  let outsideServiceArea = 0;

  for (const ticket of tickets) {
    if (ticket.riskLevel === 'HIGH') highRisk += 1;
    if (ticket.riskLevel === 'MEDIUM') mediumRisk += 1;
    if (ticket.riskLevel === 'LOW') lowRisk += 1;
    if (!ticket.insideServiceArea) outsideServiceArea += 1;
    if (ticket.utilityType !== null) {
      utilityCounts.set(ticket.utilityType, (utilityCounts.get(ticket.utilityType) ?? 0) + 1);
    }
  }

  return {
    total: tickets.length,
    highRisk,
    mediumRisk,
    lowRisk,
    outsideServiceArea,
    byUtilityType: Object.fromEntries(utilityCounts),
  };
}
