import { Inject, Injectable } from '@nestjs/common';
import { Pool } from 'pg';
import { BoundingBox } from './dto/bbox.parser';
import { POSTGRES_POOL } from '../database/postgres.provider';

export interface ConflictSearchQuery {
  bbox: BoundingBox;
  stationCode?: string;
  utilityType?: string;
  radiusMeters: number;
}

export interface ConflictTicketRow {
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
  isPastDue: boolean;
}

interface DatabaseTicketRow {
  id: number;
  ticket_no: string;
  status: string;
  priority: string;
  station_code: string | null;
  utility_type: string | null;
  longitude: number;
  latitude: number;
  inside_service_area: boolean;
  nearest_emergency_ticket_no: string | null;
  distance_to_nearest_emergency_meters: number | null;
  is_past_due: boolean;
}

@Injectable()
export class TicketsRepository {
  constructor(@Inject(POSTGRES_POOL) private readonly pool: Pool) {}

  async findConflicts(query: ConflictSearchQuery): Promise<ConflictTicketRow[]> {
    const { minLng, minLat, maxLng, maxLat } = query.bbox;
    const result = await this.pool.query<DatabaseTicketRow>(
      `SELECT
         t.id,
         t.ticket_no,
         t.status,
         t.priority,
         sc.code AS station_code,
         sc.utility_type,
         ST_X(t.geom)::float8 AS longitude,
         ST_Y(t.geom)::float8 AS latitude,
         EXISTS (
           SELECT 1
           FROM service_areas sa
           WHERE sa.station_code_id = t.station_code_id
             AND ST_Covers(sa.geom, t.geom)
         ) AS inside_service_area,
         nearest.ticket_no AS nearest_emergency_ticket_no,
         nearest.distance_meters::float8 AS distance_to_nearest_emergency_meters,
         COALESCE(
           t.due_at < (CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
           FALSE
         ) AS is_past_due
       FROM tickets t
       LEFT JOIN station_codes sc ON sc.id = t.station_code_id
       LEFT JOIN LATERAL (
         SELECT
           e.ticket_no,
           ST_Distance(t.geom::geography, e.geom::geography) AS distance_meters
         FROM tickets e
         WHERE e.id <> t.id
           AND e.priority = 'EMERGENCY'
           AND ST_DWithin(t.geom::geography, e.geom::geography, $7::float8)
         ORDER BY
           ST_Distance(t.geom::geography, e.geom::geography) ASC,
           e.ticket_no ASC
         LIMIT 1
       ) nearest ON TRUE
       WHERE ST_Intersects(
         t.geom,
         ST_MakeEnvelope($1::float8, $2::float8, $3::float8, $4::float8, 4326)
       )
         AND ($5::varchar IS NULL OR sc.code = $5::varchar)
         AND ($6::varchar IS NULL OR sc.utility_type = $6::varchar)
       ORDER BY t.ticket_no ASC`,
      [
        minLng,
        minLat,
        maxLng,
        maxLat,
        query.stationCode ?? null,
        query.utilityType ?? null,
        query.radiusMeters,
      ],
    );

    return result.rows.map((row) => ({
      id: row.id,
      ticketNo: row.ticket_no,
      status: row.status,
      priority: row.priority,
      stationCode: row.station_code,
      utilityType: row.utility_type,
      longitude: row.longitude,
      latitude: row.latitude,
      insideServiceArea: row.inside_service_area,
      nearestEmergencyTicketNo: row.nearest_emergency_ticket_no,
      distanceToNearestEmergencyMeters: row.distance_to_nearest_emergency_meters,
      isPastDue: row.is_past_due,
    }));
  }
}
