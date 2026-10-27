import { classifyRisk } from '../../../src/tickets/risk-classifier';

describe('classifyRisk', () => {
  const base = {
    priority: 'STANDARD',
    status: 'OPEN',
    insideServiceArea: true,
    isPastDue: false,
    hasNearbyEmergency: false,
  };

  it('returns HIGH for an emergency ticket without requiring another emergency', () => {
    expect(classifyRisk({ ...base, priority: 'EMERGENCY' })).toBe('HIGH');
  });

  it('returns HIGH when another emergency is within radius', () => {
    expect(classifyRisk({ ...base, hasNearbyEmergency: true })).toBe('HIGH');
  });

  it('gives HIGH precedence over outside-area and overdue reasons', () => {
    expect(
      classifyRisk({
        ...base,
        priority: 'EMERGENCY',
        insideServiceArea: false,
        isPastDue: true,
        status: 'PRE_COMPLETED',
      }),
    ).toBe('HIGH');
  });

  it('returns MEDIUM for a ticket outside its assigned area', () => {
    expect(classifyRisk({ ...base, insideServiceArea: false })).toBe('MEDIUM');
  });

  it('returns MEDIUM for an overdue PRE_COMPLETED ticket', () => {
    expect(classifyRisk({ ...base, status: 'PRE_COMPLETED', isPastDue: true })).toBe('MEDIUM');
  });

  it('does not make another overdue status MEDIUM', () => {
    expect(classifyRisk({ ...base, status: 'OPEN', isPastDue: true })).toBe('LOW');
  });

  it('does not classify a null due date as overdue when isPastDue is false', () => {
    expect(classifyRisk({ ...base, status: 'PRE_COMPLETED', isPastDue: false })).toBe('LOW');
  });

  it('returns LOW when no HIGH or MEDIUM rule applies', () => {
    expect(classifyRisk(base)).toBe('LOW');
  });
});
