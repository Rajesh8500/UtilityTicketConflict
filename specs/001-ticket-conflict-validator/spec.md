# Feature Specification: Utility Ticket Conflict & Service Area Validator

**Feature Branch**: Not created (this workspace is not a Git repository and no branch hook is configured)

**Created**: 2026-10-27

**Status**: Draft

**Input**: User description: Build a Utility Ticket Conflict & Service Area Validator using the requirements and SQL in the supplied package.

## Clarifications

### Session 2026-10-27

- Q: Should `radiusMeters` have a maximum value beyond requiring a finite, positive number? → A: No product-level cap; accept any finite, positive radius.
- Q: Which timezone should determine whether a ticket's `due_at` is in the past? → A: Treat `due_at` as a UTC wall-clock value; writes, imports, and comparisons use UTC.
- Q: Should invalid query parameters return the same HTTP status and JSON error structure, with details identifying the invalid fields? → A: Yes; use HTTP 400 and a consistent JSON error structure with field-specific details.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Search Tickets in an Area (Priority: P1)

A utility operations user searches tickets in a map area and optionally narrows results by station, utility type, or emergency radius. The user needs the result set and its summary to reflect the same search so that counts can be trusted.

**Why this priority**: This is the core workflow and provides useful results before optional visualization or refinements.

**Independent Test**: Load the supplied schema and seed data, request the sample bounding box, and verify that the dashboard shows the nine matching tickets and a summary total of nine.

**Acceptance Scenarios**:

1. **Given** the supplied ten-ticket seed data, **When** the user searches `-80.00,43.18,-79.65,43.38`, **Then** nine tickets are returned and the summary is calculated from those nine tickets.
2. **Given** the sample search, **When** the user adds `stationCode=HLTNW02` or `utilityType=WATER`, **Then** only matching tickets are shown and every summary count reflects that filtered result set.
3. **Given** a valid search with no matching tickets, **When** the search completes, **Then** the dashboard shows an empty state and zero totals rather than stale results.

---

### User Story 2 - Understand Ticket Risk (Priority: P1)

A dispatcher reviews each ticket's location, service-area status, and nearest other emergency ticket to decide which work needs attention first.

**Why this priority**: Correct and explainable risk results are the reason the validator exists; users must be able to inspect each contributing ticket detail.

**Independent Test**: Use automated checks and the supplied seed data to exercise each risk rule, then verify every required ticket field and the summary against the API response.

**Acceptance Scenarios**:

1. **Given** a ticket whose own priority is `EMERGENCY`, **When** its risk is evaluated, **Then** its risk is `HIGH` even if it has no other emergency nearby.
2. **Given** a non-emergency ticket with another emergency within the requested radius, **When** its risk is evaluated, **Then** its risk is `HIGH`, and the nearest-other-emergency fields identify that other ticket and its distance.
3. **Given** a ticket outside its assigned service area or a `PRE_COMPLETED` ticket with a past `due_at`, **When** neither HIGH rule applies, **Then** its risk is `MEDIUM`; an overdue ticket in any other status is not MEDIUM for lateness alone.
4. **Given** a ticket both outside its service area and near another emergency, **When** its risk is evaluated, **Then** HIGH takes precedence over MEDIUM.
5. **Given** a ticket on a service-area boundary, **When** its service-area status is evaluated, **Then** it is considered inside that area.

---

### User Story 3 - Recover from Search States (Priority: P2)

A user receives clear feedback while a search is running, when results are unavailable, and when request validation fails, so the user can distinguish an empty result from an error and retry safely.

**Why this priority**: Clear states prevent stale or missing results from being mistaken for a successful search.

**Independent Test**: Exercise a delayed request, a valid no-match search, malformed input, and an unavailable API; verify the corresponding loading, empty, validation-error, and request-error states.

**Acceptance Scenarios**:

1. **Given** a search has been submitted, **When** its response has not arrived, **Then** a visible loading state is shown and duplicate stale results are not presented as the new response.
2. **Given** an invalid bounding box or radius, **When** the user submits it, **Then** a useful validation error is shown and no invalid search is treated as successful.
3. **Given** the API cannot be reached, **When** the search fails, **Then** the user sees a recoverable error without credentials or stack traces.

---

### User Story 4 - Inspect Results on a Map (Priority: P3)

A user optionally views ticket locations on a map, distinguishes risk levels, and searches a new area by changing the map bounds.

**Why this priority**: The map improves spatial exploration but is explicitly a bonus and must not delay the functional search dashboard.

**Independent Test**: With the core search working, verify each ticket appears at its reported coordinates, risk is conveyed by a marker label or color, and changing map bounds updates the bounding-box search.

**Acceptance Scenarios**:

1. **Given** ticket results are available, **When** the optional map is enabled, **Then** each result is represented at its longitude and latitude with its risk level identifiable.
2. **Given** the user changes map bounds, **When** the user searches those bounds, **Then** the displayed ticket results correspond to the new bounding box.

### Edge Cases

- Missing, malformed, non-numeric, non-finite, or out-of-range bounding-box coordinates are rejected with HTTP 400 and the standard field-specific JSON validation error.
- Bounding-box values must be ordered as `minLng,minLat,maxLng,maxLat`; minimums must be less than maximums. Antimeridian-wrapping boxes are not part of this version.
- Missing `bbox`, malformed `bbox`, and an empty but valid result set are distinct states.
- Missing `radiusMeters` uses 250 meters; zero, negative, non-numeric, and non-finite radii are rejected with HTTP 400 and the same field-specific JSON validation error used for `bbox`. Any valid finite positive radius is accepted without a product-level maximum.
- A ticket with no other emergency within the radius has null `nearestEmergencyTicketNo` and `distanceToNearestEmergencyMeters` values.
- The current ticket is never reported as its own nearest emergency, including when that ticket has priority `EMERGENCY`.
- Nearby emergency detection considers other tickets regardless of whether those emergency tickets match the user's station, utility, or bounding-box filters.
- A ticket on a polygon edge is inside the matching service area. If multiple service-area polygons reference its station, coverage by any matching polygon is sufficient.
- A ticket with no assigned station or no matching service-area polygon is outside its assigned service area; absent station and utility values are represented as null where the response fields require them.
- A null `due_at` is not overdue. Past due time produces MEDIUM only for `PRE_COMPLETED` tickets and only when no HIGH rule applies.
- The supplied `due_at TIMESTAMP` column has no timezone metadata. Its wall-clock values MUST be interpreted as UTC; writes, imports, and overdue comparisons MUST use UTC without changing the supplied column type.
- A filtered search with no matches returns an empty `tickets` array and zero counts; it does not reuse counts from an earlier search.
- Missing or invalid `bbox` and invalid `radiusMeters` return the same JSON error envelope with HTTP 400; the error details identify each invalid field and its reason. A syntactically valid but unmatched `stationCode` or `utilityType` filter returns an empty result, not a validation error.
- API and database errors do not expose credentials, SQL details, or stack traces to the user.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The service MUST provide `GET /api/tickets/conflicts` with required `bbox=minLng,minLat,maxLng,maxLat` and optional `stationCode`, `utilityType`, and `radiusMeters` query parameters. The endpoint and query names MUST match the supplied backend requirements and sample requests.
- **FR-002**: The service MUST validate that `bbox` contains four finite WGS84 coordinates in longitude-then-latitude order, with longitude in [-180, 180], latitude in [-90, 90], and minimums less than corresponding maximums. Invalid or missing bounding boxes MUST return HTTP 400 with the shared JSON error envelope `{\"statusCode\":400,\"error\":\"Bad Request\",\"message\":[...]}`; each message MUST identify the invalid field and reason.
- **FR-003**: The result set MUST contain only tickets intersecting the requested bounding box. The supplied demo box `-80.00,43.18,-79.65,43.38` MUST return nine of the ten supplied seed tickets.
- **FR-004**: The service MUST apply `stationCode` and `utilityType` filters when supplied. Supported seeded pairs are `HLTNW02`/`WATER`, `HLTGS01`/`GAS`, `HLTST01`/`SANITARY`, and `HLDT01`/`TELECOM`. Omitted filters MUST NOT restrict results.
- **FR-005**: The service MUST default `radiusMeters` to 250 and reject malformed, non-numeric, non-finite, zero, or negative values when the parameter is supplied. These failures MUST use the same HTTP 400 JSON error envelope defined in FR-002 and identify `radiusMeters` and its validation reason. The endpoint MUST NOT impose a product-level maximum radius.
- **FR-006**: The supplied SQL files MUST remain authoritative and unchanged: preserve the `station_codes`, `service_areas`, and `tickets` tables, their defined columns and relationships, the supplied ten ticket rows and four station/service-area rows, and the sample API contract. Database setup MUST run `01_schema.sql` before `02_seed.sql`; `03_sanity_check.sql` MUST report 4 stations, 4 service areas, and 10 tickets.
- **FR-007**: Service-area status MUST compare a ticket with area geometry associated through `station_code_id`, treat polygon boundaries as inside, and return `insideServiceArea` for each ticket.
- **FR-008**: For each returned ticket, the service MUST find the nearest other `EMERGENCY` ticket within `radiusMeters`, measure distance in meters, exclude the ticket itself, and return `nearestEmergencyTicketNo` and `distanceToNearestEmergencyMeters`. Both values MUST be null if no other emergency is within range.
- **FR-009**: Risk MUST be `HIGH` when the ticket's own priority is `EMERGENCY` or another `EMERGENCY` ticket is within the requested radius. Otherwise, risk MUST be `MEDIUM` when the ticket is outside its assigned service area or has status `PRE_COMPLETED` with `due_at` earlier than the current UTC time. Otherwise, risk MUST be `LOW`. HIGH MUST take precedence; overdue status alone MUST NOT cause MEDIUM. The supplied timezone-naive `due_at TIMESTAMP` values MUST be interpreted as UTC for writes, imports, and comparisons; the column type MUST remain unchanged.
- **FR-010**: The response MUST preserve the documented nesting and fields: top-level `tickets` array and `summary` object; each ticket MUST include `id`, `ticketNo`, `status`, `priority`, `stationCode`, `utilityType`, `longitude`, `latitude`, `insideServiceArea`, `nearestEmergencyTicketNo`, `distanceToNearestEmergencyMeters`, and `riskLevel`.
- **FR-011**: `summary` MUST include `total`, `highRisk`, `mediumRisk`, `lowRisk`, `outsideServiceArea`, and `byUtilityType`. All summary values MUST be calculated from the same tickets returned after bounding-box and optional filters are applied. `byUtilityType` MUST contain only non-null utility types represented by returned tickets; for an empty result set it MUST be `{}`. The sample demo response MUST match the documented counts: total 9, HIGH 3, MEDIUM 4, LOW 2, outside-service-area 2; WATER 4, GAS 2, SANITARY 1, TELECOM 2.
- **FR-012**: The dashboard MUST provide controls for the bounding box, station code, utility type, and radius, and a search action. It MUST call the real endpoint and MUST NOT substitute hardcoded demo results.
- **FR-013**: The ticket table MUST display ticket number, status, priority, station code, utility type, longitude, latitude, `insideServiceArea`, `nearestEmergencyTicketNo`, `distanceToNearestEmergencyMeters`, and `riskLevel`. HIGH, MEDIUM, and LOW MUST remain textually identifiable, not conveyed by color alone.
- **FR-014**: The dashboard MUST provide distinct loading, error, and empty-result states, plus summary cards for total tickets, each risk count, outside-service-area count, and counts by utility type.
- **FR-015**: Automated backend unit/integration tests and frontend component tests MUST cover request validation, bounding-box and optional filtering, service-area boundaries, emergency self-exclusion and distance, all risk precedence cases, summary/result consistency, the required table fields, and loading/error/empty states.
- **FR-016**: Setup documentation MUST explain local prerequisites, database initialization order, environment variables, API examples, test commands, and troubleshooting. The documented sample request MUST work against the supplied seeded data.
- **FR-017**: An optional map MAY be added after the core dashboard works. If added, it MUST show ticket markers with identifiable risk levels and allow map bounds to update the search bounding box.

### Nonfunctional Requirements

- **NFR-001**: All request values MUST be validated and constrained before they affect data access. Untrusted values MUST use safe parameterized database operations; client-facing errors MUST NOT reveal database credentials or stack traces.
- **NFR-002**: A developer following the documented setup MUST be able to initialize the supplied database and run the dashboard and service without undocumented project-specific steps.
- **NFR-003**: Search controls MUST have accessible labels and be keyboard operable. Risk MUST be readable as text so meaning is not dependent on color or the optional map.
- **NFR-004**: On the documented local setup with the supplied ten-ticket seed, at least 19 of 20 repeated demo-box searches MUST display results within two seconds of submission.

### Key Entities *(include if data involved)*

- **Station code**: The supplied `station_codes` record, with `id`, `code`, and `utility_type`; identifies the ticket's station and utility.
- **Service area**: The supplied `service_areas` record, with `id`, `name`, `station_code_id`, and `geom` as a Polygon with SRID 4326; associated to tickets through `station_code_id`.
- **Ticket**: The supplied `tickets` record, with `id`, `ticket_no`, `status`, `priority`, `station_code_id`, `due_at`, and `geom` as a Point with SRID 4326. Coordinates are interpreted as longitude before latitude.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The supplied demo bounding box returns exactly 9 tickets from the 10-ticket seed and reports `summary.total` as 9.
- **SC-002**: For the demo response, all risk and utility summary counts match the supplied expected values: 3 HIGH, 4 MEDIUM, 2 LOW, 2 outside service area; WATER 4, GAS 2, SANITARY 1, and TELECOM 2.
- **SC-003**: Every returned row displays all 11 user-required ticket columns, and the risk level can be identified without interpreting color.
- **SC-004**: The automated risk-rule cases pass at 100%, including emergency self-exclusion, boundary inclusion, HIGH precedence, and the PRE_COMPLETED-only overdue rule.
- **SC-005**: In 20 repeated local demo-box searches, at least 19 complete within two seconds of submission.
- **SC-006**: A reviewer can follow the setup guide from the supplied schema and seed scripts, run the sample request, and observe the expected result and summary without undocumented steps.

## Assumptions

- The current project constitution and the user's explicit instruction make the ZIP's SQL schema, seed data, sanity checks, and sample request authoritative. This resolves the README/backend note that permits schema changes: that flexibility is not used for this feature.
- The technology constraints are the constitution-mandated React, TypeScript, and Vite dashboard; NestJS and TypeScript service; PostgreSQL with PostGIS; safe parameterized database access; and automated backend and frontend tests. The map is optional Leaflet/OpenStreetMap work.
- Use the sample bbox `-80.00,43.18,-79.65,43.38` as the initial example value. The four documented station/utility pairs and the documented sample response counts remain unchanged.
- Emergency proximity is evaluated against all other tickets, not only tickets returned by the current bounding box or optional filters. This keeps filtering the displayed set from hiding a nearby emergency.
- Where no other emergency is within range, both nearest-emergency fields are null. A ticket without an assigned or matching service area is outside its assigned area; the schema's nullable station relationship is preserved.
- For a station associated with multiple service-area polygons, a ticket is inside when any polygon for that station covers it. A null `due_at` is not past due.
- No pagination, ticket editing, authentication changes, or additional data import/export workflow is included. The optional map follows only after core search and table workflows are complete.
- The source requirements specify no maximum `radiusMeters`; the specification therefore requires a finite positive value without inventing a new public upper-bound contract.
- The source schema's timezone-naive `due_at TIMESTAMP` values use UTC by convention. Setup, seed/import, and runtime database operations must use UTC for those values and comparisons; no schema alteration is required.
