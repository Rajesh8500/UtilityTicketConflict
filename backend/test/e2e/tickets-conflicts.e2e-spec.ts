import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Pool } from 'pg';
import request = require('supertest');
import { POSTGRES_POOL } from '../../src/database/postgres.provider';
import { createValidationException } from '../../src/common/validation-error.filter';
import { SafeHttpExceptionFilter } from '../../src/common/http-exception.filter';
import { TicketsController } from '../../src/tickets/tickets.controller';
import { TicketsRepository } from '../../src/tickets/tickets.repository';
import { TicketsService } from '../../src/tickets/tickets.service';

const databaseUrl = process.env.TEST_DATABASE_URL;
const e2eDescribe = databaseUrl ? describe : describe.skip;

e2eDescribe('GET /api/tickets/conflicts with seeded PostGIS data', () => {
  let app: INestApplication;
  let pool: Pool;

  beforeAll(async () => {
    if (!databaseUrl) return;
    const parsedUrl = new URL(databaseUrl);
    if (!parsedUrl.pathname.endsWith('_test')) {
      throw new Error('TEST_DATABASE_URL must target a database whose name ends with _test');
    }

    pool = new Pool({ connectionString: databaseUrl, options: '-c timezone=UTC' });
    const setup = await pool.query<{
      postgis: boolean;
      stations: number;
      service_areas: number;
      tickets: number;
    }>(
      `SELECT
         EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'postgis') AS postgis,
         (SELECT COUNT(*)::int FROM station_codes) AS stations,
         (SELECT COUNT(*)::int FROM service_areas) AS service_areas,
         (SELECT COUNT(*)::int FROM tickets) AS tickets`,
    );
    const state = setup.rows[0];
    if (!state.postgis || state.stations !== 4 || state.service_areas !== 4 || state.tickets !== 10) {
      throw new Error('TEST_DATABASE_URL must contain PostGIS and the unchanged supplied seed data');
    }

    const moduleRef = await Test.createTestingModule({
      controllers: [TicketsController],
      providers: [
        TicketsService,
        TicketsRepository,
        { provide: POSTGRES_POOL, useValue: pool },
      ],
    }).compile();
    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
        exceptionFactory: createValidationException,
      }),
    );
    app.useGlobalFilters(new SafeHttpExceptionFilter());
    await app.init();
  });

  afterAll(async () => {
    if (app) await app.close();
    if (pool) await pool.end();
  });

  it('returns the exact demo bbox tickets and risk summary', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/tickets/conflicts')
      .query({ bbox: '-80.00,43.18,-79.65,43.38', radiusMeters: '250' })
      .expect(200);

    expect(response.body.tickets).toHaveLength(9);
    expect(response.body.summary).toEqual({
      total: 9,
      highRisk: 3,
      mediumRisk: 4,
      lowRisk: 2,
      outsideServiceArea: 2,
      byUtilityType: { WATER: 4, GAS: 2, SANITARY: 1, TELECOM: 2 },
    });
  });

  it.each([
    ['utilityType', 'WATER'],
    ['stationCode', 'HLTNW02'],
  ])('runs the documented %s sample request', async (filter, value) => {
    const response = await request(app.getHttpServer())
      .get('/api/tickets/conflicts')
      .query({ bbox: '-80.00,43.18,-79.65,43.38', radiusMeters: '250', [filter]: value })
      .expect(200);

    expect(response.body.tickets).toHaveLength(4);
    expect(response.body.summary.total).toBe(4);
    expect(response.body.summary.byUtilityType).toEqual({ WATER: 4 });
  });

  it('returns an empty result and zero summary for an unmatched valid utility filter', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/tickets/conflicts')
      .query({ bbox: '-80.00,43.18,-79.65,43.38', utilityType: 'UNKNOWN' })
      .expect(200);

    expect(response.body).toEqual({
      tickets: [],
      summary: {
        total: 0,
        highRisk: 0,
        mediumRisk: 0,
        lowRisk: 0,
        outsideServiceArea: 0,
        byUtilityType: {},
      },
    });
  });
});
