import { Pool } from 'pg';
import { TicketsRepository } from '../../../src/tickets/tickets.repository';

const databaseUrl = process.env.TEST_DATABASE_URL;
const integrationDescribe = databaseUrl ? describe : describe.skip;

integrationDescribe('TicketsRepository with PostGIS', () => {
  let pool: Pool;
  let repository: TicketsRepository;
  let waterStationId: number | undefined;
  let telecomStationId: number | undefined;
  let secondAreaId: number;
  const createdTicketNos = [
    'TEST-API-TARGET-001',
    'TEST-API-EMERGENCY-001',
    'TEST-API-OWN-EMERGENCY-001',
    'TEST-API-BOUNDARY-001',
    'TEST-API-UNASSIGNED-001',
  ];

  beforeAll(async () => {
    if (!databaseUrl) return;
    pool = new Pool({ connectionString: databaseUrl, options: '-c timezone=UTC' });
    const database = await pool.query<{ current_database: string }>(
      'SELECT current_database()',
    );
    if (!database.rows[0].current_database.endsWith('_test')) {
      throw new Error('TEST_DATABASE_URL must point to a database whose name ends with _test');
    }

    const postgis = await pool.query<{ available: boolean }>(
      "SELECT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'postgis') AS available",
    );
    if (!postgis.rows[0].available) {
      throw new Error('The TEST_DATABASE_URL database must have PostGIS installed');
    }

    const stations = await pool.query<{ code: string; id: number }>(
      "SELECT code, id FROM station_codes WHERE code IN ('HLTNW02', 'HLDT01')",
    );
    waterStationId = stations.rows.find((row) => row.code === 'HLTNW02')?.id;
    telecomStationId = stations.rows.find((row) => row.code === 'HLDT01')?.id;
    if (!waterStationId || !telecomStationId) {
      throw new Error('The test database must be initialized with the supplied station seed data');
    }

    const area = await pool.query<{ id: number }>(
      `INSERT INTO service_areas (name, station_code_id, geom)
       VALUES (
         'Test-only additional water area',
         $1,
         ST_GeomFromText('POLYGON((-78.2 42.8, -78.0 42.8, -78.0 43.0, -78.2 43.0, -78.2 42.8))', 4326)
       )
       RETURNING id`,
      [waterStationId],
    );
    secondAreaId = area.rows[0].id;

    await pool.query(
      `INSERT INTO tickets (ticket_no, status, priority, station_code_id, due_at, geom)
       VALUES
         ('TEST-API-TARGET-001', 'OPEN', 'STANDARD', $1, NULL, ST_SetSRID(ST_MakePoint(-78.1, 42.9), 4326)),
         ('TEST-API-EMERGENCY-001', 'OPEN', 'EMERGENCY', $2, NULL, ST_SetSRID(ST_MakePoint(-78.099, 42.9), 4326)),
         ('TEST-API-OWN-EMERGENCY-001', 'OPEN', 'EMERGENCY', $1, NULL, ST_SetSRID(ST_MakePoint(-78.5, 42.5), 4326)),
         ('TEST-API-BOUNDARY-001', 'OPEN', 'STANDARD', $1, NULL, ST_SetSRID(ST_MakePoint(-78.2, 42.9), 4326)),
         ('TEST-API-UNASSIGNED-001', 'OPEN', 'STANDARD', NULL, NULL, ST_SetSRID(ST_MakePoint(-78.1, 42.9), 4326))`,
      [waterStationId, telecomStationId],
    );

    repository = new TicketsRepository(pool);
  });

  afterAll(async () => {
    if (!pool) return;
    await pool.query('DELETE FROM tickets WHERE ticket_no = ANY($1::varchar[])', [createdTicketNos]);
    if (secondAreaId) {
      await pool.query('DELETE FROM service_areas WHERE id = $1', [secondAreaId]);
    }
    await pool.end();
  });

  it('returns only bbox tickets and honors station and utility filters', async () => {
    const demo = await repository.findConflicts({
      bbox: { minLng: -80, minLat: 43.18, maxLng: -79.65, maxLat: 43.38 },
      radiusMeters: 250,
    });
    expect(demo).toHaveLength(9);

    const filtered = await repository.findConflicts({
      bbox: { minLng: -80, minLat: 43.18, maxLng: -79.65, maxLat: 43.38 },
      stationCode: 'HLTNW02',
      utilityType: 'WATER',
      radiusMeters: 250,
    });
    expect(filtered.length).toBeGreaterThan(0);
    expect(filtered.every((ticket) => ticket.stationCode === 'HLTNW02')).toBe(true);
    expect(filtered.every((ticket) => ticket.utilityType === 'WATER')).toBe(true);
  });

  it('uses any matching service-area polygon and includes polygon boundaries', async () => {
    const multipleArea = await repository.findConflicts({
      bbox: { minLng: -78.101, minLat: 42.899, maxLng: -78.0995, maxLat: 42.901 },
      stationCode: 'HLTNW02',
      utilityType: 'WATER',
      radiusMeters: 250,
    });
    expect(multipleArea).toHaveLength(1);
    expect(multipleArea[0].insideServiceArea).toBe(true);

    const boundary = await repository.findConflicts({
      bbox: { minLng: -78.201, minLat: 42.899, maxLng: -78.199, maxLat: 42.901 },
      stationCode: 'HLTNW02',
      radiusMeters: 250,
    });
    expect(boundary.find((ticket) => ticket.ticketNo === 'TEST-API-BOUNDARY-001')?.insideServiceArea).toBe(
      true,
    );
  });

  it('treats a ticket without station_code_id as outside its assigned area', async () => {
    const result = await repository.findConflicts({
      bbox: { minLng: -78.101, minLat: 42.899, maxLng: -78.099, maxLat: 42.901 },
      radiusMeters: 250,
    });
    const unassigned = result.find((ticket) => ticket.ticketNo === 'TEST-API-UNASSIGNED-001');

    expect(unassigned).toBeDefined();
    expect(unassigned?.stationCode).toBeNull();
    expect(unassigned?.utilityType).toBeNull();
    expect(unassigned?.insideServiceArea).toBe(false);
  });

  it('finds an emergency outside bbox and filters in geography meters', async () => {
    const result = await repository.findConflicts({
      bbox: { minLng: -78.1005, minLat: 42.8995, maxLng: -78.0995, maxLat: 42.9005 },
      stationCode: 'HLTNW02',
      utilityType: 'WATER',
      radiusMeters: 250,
    });
    expect(result).toHaveLength(1);
    expect(result[0].nearestEmergencyTicketNo).toBe('TEST-API-EMERGENCY-001');
    expect(result[0].distanceToNearestEmergencyMeters).toBeGreaterThan(0);
    expect(result[0].distanceToNearestEmergencyMeters).toBeLessThanOrEqual(250);
  });

  it('excludes the current emergency ticket from its own nearest result', async () => {
    const result = await repository.findConflicts({
      bbox: { minLng: -78.501, minLat: 42.499, maxLng: -78.499, maxLat: 42.501 },
      stationCode: 'HLTNW02',
      radiusMeters: 250,
    });
    expect(result).toHaveLength(1);
    expect(result[0].priority).toBe('EMERGENCY');
    expect(result[0].nearestEmergencyTicketNo).toBeNull();
    expect(result[0].distanceToNearestEmergencyMeters).toBeNull();
  });
});
