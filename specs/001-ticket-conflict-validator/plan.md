# Implementation Plan: Utility Ticket Conflict & Service Area Validator

**Branch**: `001-ticket-conflict-validator` | **Date**: 2026-10-27 | **Spec**: [spec.md](spec.md)

**Input**: Clarified feature specification and project constitution.

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

## Summary

Deliver a React dashboard and NestJS API for bbox-filtered utility-ticket risk review. Preserve the supplied SQL schema and seed data. PostgreSQL/PostGIS provides authoritative filtering, service-area coverage, and emergency proximity; pure TypeScript risk classification and response aggregation make business rules independently testable.

## Technical Context

**Language/Version**: TypeScript for backend and frontend; use the Node.js LTS version supported by the selected NestJS/Vite releases.

**Primary Dependencies**: NestJS, `pg`, `class-validator`, `class-transformer`, `@nestjs/config`; React, Vite, `fetch`, and Vitest/Testing Library. Optional map dependencies: Leaflet and React Leaflet. See [research.md](research.md).

**Storage**: PostgreSQL with PostGIS; preserve `station_codes`, `service_areas`, and `tickets` exactly as supplied.

**Testing**: Jest and Supertest for NestJS unit/integration tests; Vitest and React Testing Library for UI/component tests; Playwright for a small local end-to-end smoke flow.

**Target Platform**: Local development on Windows with PostgreSQL/PostGIS; Node services run on localhost. Keep scripts and setup instructions portable where practical.

**Project Type**: Full-stack web application with separate frontend and backend projects.

**Performance Goals**: On the supplied ten-ticket seed dataset, at least 19 of 20 demo-bbox searches complete and render within two seconds, as required by SC-005.

**Constraints**: Do not alter supplied SQL/schema/seed/API fields. Validate bbox/radius consistently with HTTP 400 and field-specific messages. Radius has no product-level maximum. Interpret timezone-naive `due_at` as UTC and use UTC for inserts/imports/comparisons. Keep all authoritative spatial calculations in PostGIS.

**Scale/Scope**: Ten supplied seed tickets, four stations, and four service areas; one conflict-search page and one read-only endpoint. No pagination, editing, authentication changes, or required map in the core release.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Gate | Result | Plan evidence |
|---|---|---|
| Requirements and supplied artifacts are authoritative | PASS | Source SQL remains unchanged; schema flexibility in the README is not used. |
| SQL uses bound parameters for untrusted values | PASS | Repository uses fixed SQL and bound bbox/filter/radius values. |
| Spatial and risk authority stays out of the frontend | PASS | PostGIS computes spatial facts; backend risk classifier determines levels. |
| API contract and risk precedence are preserved | PASS | Contract follows the clarified spec, including HIGH precedence and HTTP 400 validation errors. |
| Automated backend and frontend tests are planned | PASS | Jest/Supertest, Vitest/Testing Library, and a narrow Playwright smoke flow are specified. |
| Functional dashboard precedes optional map | PASS | Map is an explicitly gated final phase. |
| No unjustified architecture complexity | PASS | Two app projects, one PostgreSQL driver, and no ORM or shared package are proposed. |

## Project Structure

### Documentation (this feature)

```text
specs/001-ticket-conflict-validator/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)
```text
backend/
├── src/
│   ├── app.module.ts
│   ├── config/
│   ├── database/
│   └── tickets/
│       ├── dto/
│       ├── tickets.controller.ts
│       ├── tickets.service.ts
│       ├── tickets.repository.ts
│       ├── risk-classifier.ts
│       └── summary.ts
└── test/
    ├── unit/
    ├── integration/
    └── e2e/

frontend/
├── src/
│   ├── api/
│   ├── components/
│   ├── features/conflicts/
│   └── test/
└── vite.config.ts

database/
├── 01_schema.sql          # Supplied source file; unchanged
├── 02_seed.sql            # Supplied source file; unchanged
└── 03_sanity_check.sql    # Supplied source file; unchanged

.env.example
README.md
```

**Structure Decision**: Use two isolated applications in `backend/` and `frontend/`, with supplied database scripts at `database/`. Keep the API contract and architecture notes in this feature directory. Do not create a shared package until real duplication appears. The SQL files listed here are to be copied from the supplied package without edits during repository setup.

## Architecture and Dependencies

- **Backend**: NestJS `TicketsModule`; controller owns the route and HTTP binding, a query DTO/parser validates inputs, service orchestrates query and classification, repository owns a `pg` Pool and fixed parameterized SQL, and pure classifier/summary functions carry unit-testable business rules.
- **Spatial query**: Filter returned tickets with `ST_Intersects` and `ST_MakeEnvelope`; derive service-area membership with `EXISTS` and `ST_Covers` over polygons matching `station_code_id`; use a lateral nearest-emergency query over all tickets, excluding the current `id`, with `ST_DWithin`/`ST_Distance` on `geometry::geography` and `radiusMeters` bound as a parameter. Do not apply bbox, station, or utility filters to emergency candidates.
- **Risk and summary**: Repository returns one row per bbox/filter-matching ticket with spatial facts. A pure classifier applies HIGH then MEDIUM then LOW rules. Aggregate summary from the exact classified response array after bbox and optional filters; empty matches produce `tickets: []`, zero totals, and an empty `byUtilityType` object.
- **Frontend**: Typed API client serializes search params and response types; conflict feature owns form state and request lifecycle; presentational components render summary, table, risk badge, and loading/error/empty states. Abort or supersede stale requests so old responses cannot replace newer searches.
- **Dependencies**: Backend runtime: `@nestjs/common`, `@nestjs/core`, `@nestjs/platform-express`, `@nestjs/config`, `pg`, `class-validator`, `class-transformer`, `reflect-metadata`, and `rxjs`. Backend test: Jest, Nest testing utilities, Supertest. Frontend runtime: React, React DOM, Vite. Frontend test: Vitest, jsdom, React Testing Library, jest-dom. End-to-end: Playwright. Add `leaflet` and `react-leaflet` only in the optional map phase.

## Configuration and Local Startup

Use environment variables for `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_SSL`, `API_PORT`, `FRONTEND_ORIGIN`, and `VITE_API_BASE_URL`; provide safe placeholder values only in `.env.example`. The backend must set its PostgreSQL connection/session timezone to UTC. The seed command must also execute in a UTC session because `due_at` is `TIMESTAMP` without timezone metadata and seed expressions use `NOW()`.

Local startup order: provision a disposable local PostgreSQL database with PostGIS; run the supplied `database/01_schema.sql`, then `02_seed.sql` in UTC; run `03_sanity_check.sql`; start the NestJS backend on port 3000; start the Vite frontend on port 5173 with API base URL pointing to `http://localhost:3000/api`; then run automated checks and the documented demo request. Since `01_schema.sql` drops the feature tables, never run it against a shared or valuable database.

## Implementation Sequence

1. Establish root documentation and separate NestJS/Vite projects, lockfiles, scripts, lint/type-check commands, and safe `.env.example`; do not implement feature behavior yet.
2. Bring in the three supplied SQL files unchanged. Create a disposable database, enable/verify PostGIS via the supplied schema, seed in UTC, and verify 4 stations, 4 service areas, 10 tickets, and 9 demo-bbox tickets.
3. Configure NestJS environment loading, PostgreSQL Pool lifecycle, connectivity/health check, and database integration-test setup.
4. Implement request parsing/DTO validation for required bbox, ranges/order, optional filters, default 250m radius, finite positive radius without a maximum, and consistent field-specific HTTP 400 responses.
5. Add repository SQL with parameter binding: filtered ticket base rows, station join for `utility_type`, boundary-inclusive any-area check via `station_code_id`, and global nearest-other-emergency candidates using geography meters.
6. Add pure risk classification for own EMERGENCY, nearby emergency, outside-area, UTC overdue PRE_COMPLETED, and precedence; add null nearest values when no candidate qualifies.
7. Build response mapping and summary aggregation from the same filtered/classified rows; verify empty and filtered results and documented sample counts.
8. Complete backend unit, validation, and PostGIS integration tests, including source schema/data invariants and query-candidate/filter independence.
9. Build the React API client and search/filter controls; connect summary cards, ticket table, risk badges, accessibility labels, and loading/error/empty states to live responses.
10. Add frontend component tests for parameter serialization, all required table fields, state transitions, and error mapping.
11. Only after the core dashboard and API are verified, add optional Leaflet/OpenStreetMap markers, risk labels, and map-bounds-to-bbox behavior.
12. Run the Playwright/local end-to-end flow and repeat the demo-box timing check; verify API response shape, risk/summary counts, stale-request handling, and safe error output.
13. Finish setup and troubleshooting documentation with exact database order, UTC setup, environment values, sample HTTP requests, test commands, and known destructive schema behavior.

## Testing Strategy

- **Pure unit tests**: bbox parser, radius parser, risk classifier, UTC overdue boundary and null due date, summary aggregator, and response mapping.
- **Backend HTTP tests**: missing/malformed bbox, coordinate range/order, malformed/zero/negative/non-finite radius, default radius, shared HTTP 400 envelope, unmatched optional filters, and response fields.
- **PostGIS integration tests**: bbox filtering; lon/lat order; boundary `ST_Covers`; multiple matching polygons; null station; emergency outside bbox/filters still considered; self-exclusion; nearest distance in meters; no candidate null fields; UTC timestamp cases; and fixture cleanup against a disposable database.
- **Frontend component tests**: request query serialization, pending/error/empty/success states, retry after error, required table columns, accessible risk text, and summary rendering.
- **End-to-end**: Start database and both apps, call the documented request, and use Playwright to submit the sample bbox and verify nine rows, summary counts, and a filter-driven refresh. Run the optional-map E2E only if that phase is implemented.

## Technical Risks and Mitigations

| Risk | Mitigation |
|---|---|
| `due_at TIMESTAMP` is timezone-naive and seed data uses `NOW()` | Keep the schema unchanged; use UTC for database connections, seed/import sessions, writes, and comparisons; test exact UTC boundaries. |
| `01_schema.sql` drops tables | Use a disposable local database only; clearly document reset behavior before running scripts. |
| Emergency search must include candidates outside display filters | Keep the correlated/lateral candidate subquery independent of the returned-ticket CTE filters; add an integration fixture outside bbox/filter. |
| Geography casts and no radius cap can make proximity queries expensive at scale | Preserve the no-cap API rule; benchmark the specified seed workload and inspect query plans. Do not alter the provided schema/indexes without approval. |
| Multiple polygons can duplicate tickets if joined directly | Use `EXISTS`/any-cover semantics instead of row-multiplying joins. |
| Summary counts can drift from ticket rows | Compute all summary values from the same classified filtered array returned in `tickets`. |
| Validation errors can have inconsistent Nest shapes | Centralize exception formatting and assert the same HTTP 400 envelope for bbox and radius failures. |
| Rapid searches can render stale responses | Abort superseded requests or compare request sequence identifiers before committing state. |
| Browser CORS or missing credentials block local startup | Configure one explicit frontend origin and safe env examples; document DB readiness and PostGIS prerequisites. |

## Complexity Tracking

No constitution violations are proposed. No additional application or database abstraction is justified for this scope.

