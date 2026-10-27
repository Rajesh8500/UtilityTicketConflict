import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request = require('supertest');
import { parse } from 'yaml';
import { createValidationException } from '../../src/common/validation-error.filter';
import { ConflictResponse } from '../../src/tickets/ticket-response';
import { TicketsController } from '../../src/tickets/tickets.controller';
import { TicketsService } from '../../src/tickets/tickets.service';
import { SafeHttpExceptionFilter } from '../../src/common/http-exception.filter';

const sampleResponse: ConflictResponse = {
  tickets: [
    {
      id: 1,
      ticketNo: '20261318930',
      status: 'PRE_COMPLETED',
      priority: 'STANDARD',
      stationCode: 'HLTNW02',
      utilityType: 'WATER',
      longitude: -79.8711,
      latitude: 43.2557,
      insideServiceArea: true,
      nearestEmergencyTicketNo: '2026133783',
      distanceToNearestEmergencyMeters: 80,
      riskLevel: 'HIGH',
    },
  ],
  summary: {
    total: 1,
    highRisk: 1,
    mediumRisk: 0,
    lowRisk: 0,
    outsideServiceArea: 0,
    byUtilityType: { WATER: 1 },
  },
};

describe('GET /api/tickets/conflicts contract', () => {
  let app: INestApplication;
  const ticketsService = { findConflicts: jest.fn() };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [TicketsController],
      providers: [{ provide: TicketsService, useValue: ticketsService }],
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
    await app.close();
  });

  beforeEach(() => {
    ticketsService.findConflicts.mockReset();
    ticketsService.findConflicts.mockResolvedValue(sampleResponse);
  });

  it('keeps the endpoint parameters and response fields aligned with the OpenAPI contract', () => {
    const contractPath = resolve(
      __dirname,
      '../../../specs/001-ticket-conflict-validator/contracts/openapi.yaml',
    );
    const contract = parse(readFileSync(contractPath, 'utf8'));
    const operation = contract.paths['/tickets/conflicts'].get;
    const parameterNames = operation.parameters.map(
      (parameter: { name: string }) => parameter.name,
    );

    expect(contract.openapi).toBe('3.1.0');
    expect(parameterNames).toEqual(['bbox', 'stationCode', 'utilityType', 'radiusMeters']);
    expect(operation.parameters[0].required).toBe(true);
    expect(operation.responses['400']).toBeDefined();
    expect(contract.components.schemas.Ticket.properties).toHaveProperty(
      'distanceToNearestEmergencyMeters',
    );
    expect(contract.components.schemas.Summary.properties).toHaveProperty('byUtilityType');
  });

  it('returns the documented ticket fields and summary nesting', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/tickets/conflicts')
      .query({ bbox: '-80,43,-79,44', radiusMeters: '250' })
      .expect(200);

    expect(response.body).toEqual(sampleResponse);
    expect(Object.keys(response.body.tickets[0]).sort()).toEqual(
      [
        'id',
        'ticketNo',
        'status',
        'priority',
        'stationCode',
        'utilityType',
        'longitude',
        'latitude',
        'insideServiceArea',
        'nearestEmergencyTicketNo',
        'distanceToNearestEmergencyMeters',
        'riskLevel',
      ].sort(),
    );
  });

  it('returns the same field-specific HTTP 400 envelope for invalid bbox and radius', async () => {
    const invalidBbox = await request(app.getHttpServer())
      .get('/api/tickets/conflicts')
      .query({ bbox: '1,2,3' })
      .expect(400);
    expect(invalidBbox.body).toMatchObject({ statusCode: 400, error: 'Bad Request' });
    expect(invalidBbox.body.message.join(' ')).toContain('bbox');

    const invalidRadius = await request(app.getHttpServer())
      .get('/api/tickets/conflicts')
      .query({ bbox: '-80,43,-79,44', radiusMeters: '0' })
      .expect(400);
    expect(invalidRadius.body).toMatchObject({ statusCode: 400, error: 'Bad Request' });
    expect(invalidRadius.body.message.join(' ')).toContain('radiusMeters');
  });

  it('requires bbox and applies the default radius and exact optional filters', async () => {
    await request(app.getHttpServer()).get('/api/tickets/conflicts').expect(400);

    await request(app.getHttpServer())
      .get('/api/tickets/conflicts')
      .query({
        bbox: '-80,43,-79,44',
        stationCode: 'HLTNW02',
        utilityType: 'WATER',
      })
      .expect(200);

    expect(ticketsService.findConflicts).toHaveBeenCalledWith({
      bbox: { minLng: -80, minLat: 43, maxLng: -79, maxLat: 44 },
      stationCode: 'HLTNW02',
      utilityType: 'WATER',
      radiusMeters: 250,
    });
  });

  it('returns an empty result for valid unmatched filters rather than treating them as invalid', async () => {
    ticketsService.findConflicts.mockResolvedValue({
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

    const response = await request(app.getHttpServer())
      .get('/api/tickets/conflicts')
      .query({ bbox: '-80,43,-79,44', stationCode: 'UNKNOWN' })
      .expect(200);
    expect(response.body.tickets).toEqual([]);
    expect(response.body.summary.byUtilityType).toEqual({});
  });

  it('sanitizes unexpected repository errors', async () => {
    ticketsService.findConflicts.mockRejectedValue(
      new Error('database connection failed: password=private-test-sentinel; SQL=SELECT *'),
    );

    const response = await request(app.getHttpServer())
      .get('/api/tickets/conflicts')
      .query({ bbox: '-80,43,-79,44' })
      .expect(500);

    expect(response.body).toEqual({
      statusCode: 500,
      error: 'Internal Server Error',
      message: 'An unexpected server error occurred',
    });
    expect(JSON.stringify(response.body)).not.toContain('private-test-sentinel');
    expect(JSON.stringify(response.body)).not.toContain('SELECT');
  });
});
