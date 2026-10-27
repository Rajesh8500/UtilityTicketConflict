import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { ConflictQueryDto } from '../../../src/tickets/dto/conflict-query.dto';
import { parseBoundingBox } from '../../../src/tickets/dto/bbox.parser';

function validationMessages(query: Record<string, unknown>): string[] {
  const instance = plainToInstance(ConflictQueryDto, query);
  return validateSync(instance).flatMap((error) => Object.values(error.constraints ?? {}));
}

describe('parseBoundingBox', () => {
  it('parses longitude-first WGS84 bounds', () => {
    expect(parseBoundingBox('-80.00,43.18,-79.65,43.38')).toEqual({
      minLng: -80,
      minLat: 43.18,
      maxLng: -79.65,
      maxLat: 43.38,
    });
  });

  it.each([
    ['', 'exactly four'],
    ['1,2,3', 'exactly four'],
    ['1,2,3,4,5', 'exactly four'],
    ['a,2,3,4', 'finite number'],
    ['NaN,2,3,4', 'finite number'],
    ['Infinity,2,3,4', 'finite number'],
    ['-181,-20,10,20', 'longitude'],
    ['-10,-91,10,20', 'latitude'],
    ['10,2,-10,4', 'minimum longitude'],
    ['-10,4,10,2', 'minimum latitude'],
    ['170,-10,-170,10', 'minimum longitude'],
  ])('rejects invalid bounds %j', (bbox, expectedMessage) => {
    expect(() => parseBoundingBox(bbox)).toThrow(expectedMessage);
  });
});

describe('ConflictQueryDto', () => {
  it('defaults the emergency radius to 250 meters', () => {
    const instance = plainToInstance(ConflictQueryDto, {
      bbox: '-80,43,-79,44',
    });
    expect(instance.radiusMeters).toBe(250);
    expect(validateSync(instance)).toHaveLength(0);
  });

  it('accepts a finite positive radius without imposing a maximum', () => {
    const instance = plainToInstance(ConflictQueryDto, {
      bbox: '-80,43,-79,44',
      radiusMeters: '1000000000',
      stationCode: 'UNKNOWN',
      utilityType: 'UNKNOWN',
    });
    expect(instance.radiusMeters).toBe(1_000_000_000);
    expect(validateSync(instance)).toHaveLength(0);
  });

  it.each([
    ['stationCode', 12],
    ['utilityType', 12],
    ['stationCode', 'S'.repeat(51)],
    ['utilityType', 'U'.repeat(51)],
  ])('rejects invalid %s values', (field, value) => {
    const errors = validateSync(
      plainToInstance(ConflictQueryDto, { bbox: '-80,43,-79,44', [field]: value }),
    );
    expect(errors.map((error) => error.property)).toContain(field);
  });

  it.each(['0', '-1', 'abc', 'Infinity', 'NaN'])('rejects radiusMeters=%s', (radiusMeters) => {
    const messages = validationMessages({ bbox: '-80,43,-79,44', radiusMeters });
    expect(messages.join(' ')).toContain('radiusMeters');
  });
});
