<!--
Sync Impact Report
Version change: unratified template -> 1.0.0 (initial adoption)
Modified principles: none; this is the initial constitution.
Added principles: Required Technology Stack; Requirements-First Development;
Stable API Contracts; Spatial Correctness; Business-Rule Integrity;
Security and Configuration; Quality and Maintainability; Reproducible Delivery.
Added sections: Applicability; Delivery Workflow.
Removed sections: none.
Deferred TODOs: none.
-->
# Utility Ticket Conflict & Service Area Validator Constitution

## Core Principles

### I. Required Technology Stack
The frontend MUST use React, TypeScript, and Vite. The backend MUST use NestJS and
TypeScript. Persistence MUST use PostgreSQL with PostGIS and safe parameterized SQL
through the PostgreSQL driver or an existing suitable database abstraction. Automated
backend unit/integration tests and frontend component tests are required. Mapping MAY
use Leaflet with OpenStreetMap.

### II. Requirements-First Development
The supplied README, backend and frontend requirements, SQL schema, seed data, sanity
checks, and sample HTTP requests are authoritative. Contributors MUST inspect existing
files before creating, moving, or replacing files; MUST NOT invent replacement schemas,
ticket data, service-area polygons, or API contracts; and MUST resolve conflicting
requirements explicitly. Work MUST proceed in small, verifiable increments.

### III. Stable API Contracts
The required endpoint is `GET /api/tickets/conflicts`. It MUST accept
`bbox=minLng,minLat,maxLng,maxLat` and MAY accept `stationCode`, `utilityType`, and
`radiusMeters`; the default radius is 250 meters. Implementations MUST preserve
documented response fields and nesting, including `tickets` and `summary`, validate
inputs, and return useful HTTP errors. The frontend MUST NOT calculate authoritative
spatial results or risk levels.

### IV. Spatial Correctness
Ticket and service-area geometry MUST use SRID 4326, with longitude before latitude.
PostGIS MUST perform bounding-box, service-area, and emergency-proximity calculations.
Emergency distances MUST use meter-based geography calculations. Service areas MUST be
associated with tickets through `station_code_id`; service-area checks MUST include
boundaries; and nearby-emergency searches MUST exclude the current ticket.

### V. Business-Rule Integrity
Risk MUST be HIGH when a ticket's own priority is EMERGENCY or another EMERGENCY ticket
is within the requested radius. Otherwise, risk MUST be MEDIUM when the ticket is
outside its assigned service area or its status is PRE_COMPLETED and `due_at` is past;
otherwise risk MUST be LOW. HIGH MUST take precedence over MEDIUM. An overdue date
alone MUST NOT produce MEDIUM risk. Summary counts MUST be derived from the same
filtered results returned by the API.

### VI. Security and Configuration
Untrusted input MUST NOT be concatenated into SQL. Secrets and real database credentials
MUST NOT be committed. Configuration MUST use environment variables and provide safe
example files. Request inputs MUST be validated and constrained. Client-facing errors
MUST NOT expose database credentials or stack traces.

### VII. Quality and Maintainability
Code MUST use clear TypeScript types and modular architecture; controllers MUST remain
thin, separating HTTP handling, business logic, and database access. Tests MUST be
written alongside implementation. Contributors MUST avoid unnecessary dependencies,
duplicated logic, and premature abstractions. Demo results MUST NOT be hardcoded to
satisfy acceptance tests. A test, build, or manual verification MUST NOT be reported as
passing unless it was run successfully.

### VIII. Reproducible Delivery
The project MUST provide reproducible local setup instructions covering database
initialization order, environment variables, API examples, test commands, and
troubleshooting. The core dashboard MUST be functional before optional mapping is
implemented. At the end of each implementation phase, contributors MUST report files
changed, tests run and their results, and remaining issues.

## Applicability
These principles govern specifications, plans, tasks, code generation, implementation,
reviews, and tests. Where project artifacts conflict, contributors MUST identify the
conflict and resolve it explicitly before proceeding; they MUST NOT silently override
the authoritative requirements.

## Delivery Workflow
Each implementation increment MUST have a verifiable outcome, including relevant
automated tests. Reviews MUST check the change against these principles and the
authoritative project artifacts. Optional mapping work MUST NOT block a functional core
dashboard.

## Governance
This constitution governs project specifications, plans, tasks, implementation, review,
and tests. Amendments MUST be documented and reviewed; changes that alter contracts or
behavior MUST include a migration plan. Every amendment MUST update the version and
last-amended date and include a concise rationale. Versions follow semantic versioning:
MAJOR for backward-incompatible governance changes, MINOR for new principles or
materially expanded guidance, and PATCH for non-semantic clarifications. Reviews MUST
assess compliance with this constitution and record any justified exceptions and their
scope.

**Version**: 1.0.0 | **Ratified**: 2026-10-27 | **Last Amended**: 2026-10-27
