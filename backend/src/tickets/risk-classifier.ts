export type RiskLevel = 'HIGH' | 'MEDIUM' | 'LOW';

export interface RiskFacts {
  priority: string;
  status: string;
  insideServiceArea: boolean;
  isPastDue: boolean;
  hasNearbyEmergency: boolean;
}

export function classifyRisk(facts: RiskFacts): RiskLevel {
  if (facts.priority === 'EMERGENCY' || facts.hasNearbyEmergency) {
    return 'HIGH';
  }

  if (
    !facts.insideServiceArea ||
    (facts.status === 'PRE_COMPLETED' && facts.isPastDue)
  ) {
    return 'MEDIUM';
  }

  return 'LOW';
}
