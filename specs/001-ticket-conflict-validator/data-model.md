# Data Model: Utility Ticket Conflict & Service Area Validator

## Source Records

The database contract is the supplied SQL. These records are read-only for this feature; no schema migration, new column, or persisted risk value is planned.

### `station_codes`

| Field | SQL type / constraint | API use |
|---|---|---|
| `id` | `SERIAL PRIMARY KEY` | Join key for tickets and service areas; not exposed as a ticket response field. |
| `code` | `VARCHAR(50) NOT NULL UNIQUE` | Ticket `stationCode`; optional exact-match filter. |
| `utility_type` | `VARCHAR(50) NOT NULL` | Ticket `utilityType`; optional exact-match filter and summary grouping. |

Seed values: `HLTNW02`/`WATER`, `HLTGS01`/`GAS`, `HLTST01`/`SANITARY`, and `HLDT01`/`TELECOM`.

### `service_areas`

| Field | SQL type / constraint | API use |
|---|---|---|
| `id` | `SERIAL PRIMARY KEY` | Internal polygon identity. |
| `name` | `VARCHAR(100) NOT NULL` | Descriptive source value; not required in response. |
| `station_code_id` | `INT REFERENCES station_codes(id)` | Associates each service-area polygon to a station. |
| `geom` | `GEOMETRY(Polygon, 4326) NOT NULL` | Polygon used by PostGIS for coverage. |

A ticket is inside its assigned area when at least one polygon whose `station_code_id` equals the ticket's station covers the ticket point. Boundary points count as inside. No station assignment or no matching polygon yields `insideServiceArea: false`.

### `tickets`

| Field | SQL type / constraint | API use |
|---|---|---|
| `id` | `SERIAL PRIMARY KEY` | Stable identity for excluding the current ticket from emergency candidates. |
| `ticket_no` | `VARCHAR(50) NOT NULL UNIQUE` | API `ticketNo` and nearest emergency ticket identifier. |
| `status` | `VARCHAR(50) NOT NULL` | API `status`; `PRE_COMPLETED` gates overdue MEDIUM risk. |
| `priority` | `VARCHAR(50) NOT NULL` | API `priority`; `EMERGENCY` triggers own-ticket HIGH risk and identifies proximity candidates. |
| `station_code_id` | `INT REFERENCES station_codes(id)` | Optional station relationship and service-area association. |
| `due_at` | `TIMESTAMP NULL` | API risk input only; timezone-naive wall-clock values are interpreted and compared as UTC. Null is not overdue. |
| `geom` | `GEOMETRY(Point, 4326) NOT NULL` | PostGIS bbox, coverage, and emergency-proximity source. X is longitude, Y is latitude. |

Source indexes: GiST on `tickets.geom` and `service_areas.geom`; B-tree on ticket station, status, and priority. Do not modify the source SQL/indexes without approval.

## Derived Ticket Response

| Field | Type / nullability | Derivation |
|---|---|---|
| `id` | integer, non-null | `tickets.id`. |
| `ticketNo` | string, non-null | `tickets.ticket_no`. |
| `status` | string, non-null | `tickets.status`. |
| `priority` | string, non-null | `tickets.priority`. |
| `stationCode` | string or null | `station_codes.code` via `tickets.station_code_id`. |
| `utilityType` | string or null | `station_codes.utility_type` via the same join. |
| `longitude` | number, non-null | `ST_X(tickets.geom)`. |
| `latitude` | number, non-null | `ST_Y(tickets.geom)`. |
| `insideServiceArea` | boolean, non-null | True if any matching station polygon `ST_Covers` the point. |
| `nearestEmergencyTicketNo` | string or null | Nearest other ticket with `priority = 'EMERGENCY'` whose geography distance is within the requested radius. |
| `distanceToNearestEmergencyMeters` | number or null | Geography distance in meters for the selected other emergency; null with no qualifying candidate. |
| `riskLevel` | `HIGH`, `MEDIUM`, or `LOW`, non-null | Backend classifier using the ordered rules below. |

The result list includes only tickets whose point intersects the validated bbox and that match any supplied optional filters. Nearby emergency candidates are searched independently across all database tickets and can be outside the bbox or optional filters.

## Risk Classification

Apply in order:

1. `HIGH` when the ticket's own priority is `EMERGENCY` or a different emergency ticket qualifies within `radiusMeters`.
2. Otherwise `MEDIUM` when the ticket is outside its assigned service area, or its status is `PRE_COMPLETED` and its UTC-interpreted `due_at` is earlier than the current UTC time.
3. Otherwise `LOW`.

Overdue status alone never causes MEDIUM. A null due date is not overdue. HIGH takes precedence over both MEDIUM reasons.

## Summary Response

Top-level `summary` contains:

- `total`: number of returned tickets.
- `highRisk`, `mediumRisk`, `lowRisk`: counts by each returned ticket's classified risk.
- `outsideServiceArea`: returned tickets where `insideServiceArea` is false, including unassigned tickets.
- `byUtilityType`: map from utility type string to the number of returned tickets of that type. Null utility types do not create an object key. Empty results use `{}`.

All summary values are computed from the same filtered/classified response records. Empty results return `tickets: []`, zero numeric counts, and empty `byUtilityType`.

## Query Validation Model

- `bbox`: required string with exactly four finite numbers in `minLng,minLat,maxLng,maxLat` order. Longitude range is [-180, 180], latitude range is [-90, 90], and each minimum is less than its maximum. Antimeridian-wrapping boxes are unsupported.
- `stationCode`: optional exact-match string; unknown but syntactically valid code yields no rows, not a validation error.
- `utilityType`: optional exact-match string; unknown but syntactically valid value yields no rows, not a validation error.
- `radiusMeters`: omitted means 250; supplied value must parse as finite and > 0. No product-level maximum is imposed.
- Invalid or missing bbox and invalid radius return HTTP 400 with the shared field-specific error envelope.
