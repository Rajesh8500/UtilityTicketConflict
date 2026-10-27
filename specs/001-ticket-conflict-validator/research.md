# Research: Utility Ticket Conflict & Service Area Validator

## Decision: Preserve the supplied database contract

**Decision**: Keep `station_codes`, `service_areas`, and `tickets` unchanged, including columns, relationships, geometry types/SRID, indexes, and the ten seeded tickets/four station-area records.

**Rationale**: The current constitution and explicit feature instructions designate the supplied SQL as authoritative, even though the README notes that changing it is permitted. The schema scripts drop tables, so setup and integration tests must use a disposable database.

**Alternatives considered**: Normalize schema or add columns for timezone-aware due dates, area identifiers, or risk fields. Rejected because this would violate the governing preservation requirement and is unnecessary for the read-only response contract.

## Decision: Use PostgreSQL driver with fixed parameterized SQL

**Decision**: Use `pg` Pool from NestJS repository/provider code. Keep SQL statements fixed and bind bbox coordinates, station/utility filters, and radius as values. Avoid an ORM and dynamic SQL assembled from raw query strings.

**Rationale**: The source schema is small and PostGIS behavior is central. Parameterized SQL makes spatial predicates and their semantics explicit while satisfying the security requirements without introducing an abstraction that hides spatial operators.

**Alternatives considered**: A new ORM or query builder. Rejected for this small, single endpoint; an existing suitable database abstraction may be used if one is introduced before implementation, but there is none in the current repository.

## Decision: Validate query input at the HTTP boundary and normalize 400 errors

**Decision**: Parse the comma-separated bbox in a dedicated parser/DTO validator; use DTO validation for other query values. Normalize both custom and framework validation failures to HTTP 400 with `statusCode`, `error`, and a `message` array whose entries identify the field and reason.

**Rationale**: `bbox` is one string containing four interdependent coordinates, so a custom validator is needed even when NestJS `ValidationPipe`, `class-validator`, and `class-transformer` are used. A single exception formatter guarantees identical error behavior.

**Alternatives considered**: Framework-default exception bodies for some errors and ad hoc errors for others. Rejected because the clarified API contract requires one consistent envelope.

## Decision: Perform all authoritative spatial calculations in PostGIS

**Decision**: Use `ST_MakeEnvelope` + `ST_Intersects` for bbox selection; `EXISTS` + `ST_Covers` for boundary-inclusive coverage by any area with matching `station_code_id`; and a lateral nearest-emergency query that applies `ST_DWithin` and `ST_Distance` to geography casts. Exclude the current ticket by primary key. Do not apply response bbox/station/utility filters to emergency candidates.

**Rationale**: These expressions directly implement the contract, preserve meter-based distances, handle polygon boundaries and multiple polygons without duplicate ticket rows, and ensure emergencies outside the display filters still influence risk.

**Alternatives considered**: Client-side filtering, geometry-only distances, strict polygon containment, or a joined service-area result. Rejected because they respectively contradict authoritative-server spatial rules, produce degree rather than meter distances, exclude boundaries, or risk duplicate ticket rows.

**Open implementation consideration**: Equal-distance emergency candidates have no product-defined tie-break. Use a stable secondary key (for example `ticket_no`) if deterministic output is desired; this does not change risk or distance.

## Decision: Keep risk classification and summary pure and deterministic

**Decision**: The repository supplies each returned ticket with authoritative spatial facts. A pure TypeScript classifier applies HIGH, then MEDIUM, then LOW; a pure aggregator computes all summary fields from the same filtered/classified ticket array returned by the endpoint.

**Rationale**: This separates business precedence from SQL orchestration and allows exhaustive unit tests while ensuring summary totals cannot drift from returned tickets.

**Alternatives considered**: Recomputing risk or summary in React, or separately querying summary counts. Rejected because the frontend is non-authoritative and separate queries can disagree with the filtered result set.

## Decision: Interpret `due_at TIMESTAMP` as UTC without changing its type

**Decision**: Treat the timezone-naive `due_at` wall-clock value as UTC for imports, writes, and comparisons. Configure backend PostgreSQL sessions and seed/import sessions to UTC. Compare against a UTC current time; null remains not overdue.

**Rationale**: This convention is an accepted clarification and avoids environment-dependent comparisons while preserving the provided schema and seed file.

**Alternatives considered**: Using each database session's local timezone or converting to a regional timezone. Rejected because results would vary by machine/session and the supplied column has no timezone metadata.

## Decision: Do not add a maximum radius

**Decision**: Accept any finite positive `radiusMeters`, defaulting to 250 when omitted. Do not invent a product-level upper bound.

**Rationale**: The source requirements define a configurable radius and the accepted clarification explicitly selects no cap.

**Alternatives considered**: Fixed 10 km or 50 km maximum. Rejected because no such product limit is specified.

**Risk**: Very large finite radii can widen the geography candidate search. Preserve the API contract, benchmark supplied data, inspect query plans, and document operational risk rather than silently rejecting valid values.

## Decision: Keep frontend requests and display state separate from domain calculations

**Decision**: Use a typed API client, a conflict-search feature boundary, and reusable summary/table/risk components. Abort or supersede stale requests; display server-provided risk and summary values without recalculation.

**Rationale**: The structure supports component tests for request states and prevents spatial/business rules from migrating into the browser.

**Alternatives considered**: Hardcoded demo results, direct fetch logic in each component, or frontend risk computation. Rejected because they undermine real integration, repeat request handling, or contradict the constitution.

## Dependencies and versioning

**Decision**: At repository setup, select the supported Node.js LTS and compatible current NestJS, React, Vite, and test-library releases, then pin exact versions in lockfiles. Use `pg`, Nest config/validation packages, Jest/Supertest, Vitest/Testing Library, and Playwright. Add Leaflet/React Leaflet only in the optional map phase.

**Rationale**: No package manifest or existing dependency versions are present to preserve. Lockfiles and documented Node version make the selected stack reproducible without prematurely guessing patch versions during planning.

**Alternatives considered**: Pin versions during this planning phase. Rejected because dependency installation is part of repository setup and supported current versions may change before implementation.

## Decision: Define empty summary map behavior for this plan

**Decision**: For empty results, return `byUtilityType: {}`. For non-empty results, include only utility types represented by returned tickets; do not emit fabricated zero-count categories.

**Rationale**: This keeps summary values derived strictly from the returned filtered result set and avoids presenting utilities absent from the result as matching data. The documented unfiltered sample continues to include all four non-zero types.

**Alternatives considered**: Always return all seeded utility keys with zero values for absent types. Not selected because the spec requires derivation from filtered results but does not require a fixed category set.
