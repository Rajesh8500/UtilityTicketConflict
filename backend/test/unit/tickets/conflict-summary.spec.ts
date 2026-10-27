import { summarizeTickets } from '../../../src/tickets/conflict-summary';

describe('summarizeTickets', () => {
  it('derives all counts and utility totals from the provided filtered tickets', () => {
    const summary = summarizeTickets([
      { riskLevel: 'HIGH', insideServiceArea: true, utilityType: 'WATER' },
      { riskLevel: 'MEDIUM', insideServiceArea: false, utilityType: 'GAS' },
      { riskLevel: 'LOW', insideServiceArea: true, utilityType: 'WATER' },
      { riskLevel: 'HIGH', insideServiceArea: false, utilityType: null },
    ]);

    expect(summary).toEqual({
      total: 4,
      highRisk: 2,
      mediumRisk: 1,
      lowRisk: 1,
      outsideServiceArea: 2,
      byUtilityType: { WATER: 2, GAS: 1 },
    });
  });

  it('returns zero totals and an empty utility map for no filtered tickets', () => {
    expect(summarizeTickets([])).toEqual({
      total: 0,
      highRisk: 0,
      mediumRisk: 0,
      lowRisk: 0,
      outsideServiceArea: 0,
      byUtilityType: {},
    });
  });
});
