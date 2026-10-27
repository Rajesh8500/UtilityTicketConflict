---

description: "Ordered implementation tasks for Utility Ticket Conflict & Service Area Validator"
---

# Tasks: Utility Ticket Conflict & Service Area Validator

**Input**: Design documents from `specs/001-ticket-conflict-validator/`

**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/openapi.yaml`, `quickstart.md`

**Tests**: Tests are required by the specification. Add each story's tests before its implementation and keep them in the story phase.

**Organization**: Tasks are grouped by user story, with shared setup and foundational prerequisites first. Category labels in headings identify database, backend, frontend, testing, integration, and documentation work.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Use only when the task can proceed independently in different files without waiting on incomplete work.
- **[Story]**: Required for user-story tasks; use `[US1]` through `[US4]`.
- Every task description names the exact file path(s) it changes or uses.

## Path Conventions

- Backend: `backend/src/`, `backend/test/`
- Frontend: `frontend/src/`, `frontend/e2e/`
- Supplied database scripts: `database/`
- Project documentation and sample requests: `docs/`, `README.md`

## Phase 1: Setup

**Purpose**: Establish the web-project layout and safe local configuration without feature behavior.

### Repository and Project Setup

- [X] T001 Create the NestJS application scaffold, scripts, and TypeScript configuration in `backend/package.json`, `backend/tsconfig.json`, `backend/nest-cli.json`, and `backend/src/main.ts`.
- [X] T002 [P] Create the React/Vite application scaffold and scripts in `frontend/package.json`, `frontend/tsconfig.json`, `frontend/vite.config.ts`, `frontend/index.html`, and `frontend/src/main.tsx`.
- [X] T003 [P] Configure repository ignore rules and safe environment examples in `.gitignore` and `.env.example`; use placeholders only and exclude local `.env` files.
- [X] T004 Add backend and frontend lint, type-check, unit-test, and integration-test scripts in `backend/package.json` and `frontend/package.json` without adding feature code.
- [X] T005 Copy the supplied SQL scripts unchanged to `database/01_schema.sql`, `database/02_seed.sql`, and `database/03_sanity_check.sql`, and copy the supplied sample requests unchanged to `docs/SAMPLE_API_REQUESTS.http`; preserve `code VARCHAR(50) NOT NULL UNIQUE`, `ticket_no VARCHAR(50) NOT NULL UNIQUE`, `station_code_id INT REFERENCES station_codes(id)`, `geom GEOMETRY(Polygon, 4326) NOT NULL`, `geom GEOMETRY(Point, 4326) NOT NULL`, and `due_at TIMESTAMP NULL` exactly as supplied.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Verify the preserved database and establish shared backend/frontend configuration before story implementation.

### Database

- [X] T006 Create a disposable local PostGIS database and run `database/01_schema.sql`, then `database/02_seed.sql`, then `database/03_sanity_check.sql` in that exact order with the database session set to UTC; confirm 4 stations, 4 service areas, 10 tickets, and 9 demo-bbox tickets.

### Backend Foundation

- [X] T007 [P] Add validated environment configuration and UTC PostgreSQL session settings in `backend/src/config/configuration.ts` and `backend/src/config/config.module.ts` for `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_SSL`, `API_PORT`, `FRONTEND_ORIGIN`, and `DB_TIMEZONE`.
- [X] T008 Add the managed PostgreSQL Pool provider and module lifecycle in `backend/src/database/postgres.provider.ts` and `backend/src/database/database.module.ts`; bind credentials from validated config and close the pool on shutdown.
- [X] T009 Add database connectivity and PostGIS readiness integration coverage in `backend/test/integration/database-connection.integration.spec.ts`, including UTC session verification against a disposable test database.
- [X] T010 Configure the NestJS root module, global prefix `/api`, explicit local CORS origin, and startup/shutdown behavior in `backend/src/app.module.ts` and `backend/src/main.ts`.

### Frontend Foundation

- [X] T011 [P] Add typed environment access for `VITE_API_BASE_URL` and local server defaults in `frontend/src/config.ts` and `frontend/vite.config.ts`.

**Checkpoint**: Supplied schema/seed are verified in a disposable database; backend and frontend start with safe local configuration; no feature story depends on an unverified schema.

---

## Phase 3: User Story 1 - Search Tickets in an Area (Priority: P1)

**Goal**: Return bbox-matching tickets with optional station/utility filters and a summary derived from exactly those returned tickets.


- [X] T012 [P] [US1] Add OpenAPI response/parameter contract tests from `specs/001-ticket-conflict-validator/contracts/openapi.yaml` in `backend/test/contracts/tickets-conflicts.contract.spec.ts`.
- [X] T013 [P] [US1] Add query-validation tests for missing/malformed bbox, coordinate count/ranges/order, antimeridian rejection, omitted radius default, and zero/negative/non-numeric/non-finite radius in `backend/test/unit/tickets/conflict-query.dto.spec.ts`.
- [X] T014 [US1] Implement bbox parsing, query DTO validation, positive finite uncapped radius handling, and the shared field-specific HTTP 400 error envelope in `backend/src/tickets/dto/conflict-query.dto.ts`, `backend/src/tickets/dto/bbox.parser.ts`, and `backend/src/common/validation-error.filter.ts`.

### Database Query and Risk Tests

- [X] T015 [P] [US1] Add PostGIS repository integration cases for bbox inclusion, longitude-first coordinates, station/utility filters, outside-bbox emergency candidates, self-exclusion, nearest meter distance, boundary coverage, multiple matching polygons, and unassigned stations in `backend/test/integration/tickets/tickets.repository.integration.spec.ts`.
- [X] T016 [US1] Implement fixed parameterized SQL for bbox selection, `station_codes` utility lookup, `station_code_id` area association, boundary-inclusive coverage, and global nearest-other-emergency candidates using geography distance in `backend/src/tickets/tickets.repository.ts`.
- [X] T017 [P] [US1] Add risk classifier unit cases for own EMERGENCY, nearby EMERGENCY, HIGH precedence, outside-area MEDIUM, UTC-overdue PRE_COMPLETED MEDIUM, non-PRE_COMPLETED overdue LOW, null due date, and LOW fallback in `backend/test/unit/tickets/risk-classifier.spec.ts`.
- [X] T018 [US1] Implement the pure HIGH/MEDIUM/LOW risk classifier using the exact precedence and UTC `due_at TIMESTAMP` convention in `backend/src/tickets/risk-classifier.ts`.
- [X] T019 [P] [US1] Add summary aggregation tests for filtered totals, HIGH/MEDIUM/LOW counts, outside-service-area count, utility counts, and empty results in `backend/test/unit/tickets/conflict-summary.spec.ts`.
- [X] T020 [US1] Implement summary mapping from the same filtered/classified ticket rows, returning zero numeric counts and `byUtilityType: {}` for no results, in `backend/src/tickets/conflict-summary.ts`.

### Backend Endpoint and Integration

- [X] T021 [US1] Implement `GET /tickets/conflicts` controller/service wiring, response types, station and utility filters, repository calls, and response mapping in `backend/src/tickets/tickets.controller.ts`, `backend/src/tickets/tickets.service.ts`, `backend/src/tickets/tickets.module.ts`, and `backend/src/tickets/ticket-response.ts`.
- [X] T022 [US1] Add end-to-end endpoint tests for the exact response fields, shared HTTP 400 error structure, empty results, sample bbox totals, and optional filters in `backend/test/e2e/tickets-conflicts.e2e-spec.ts`; verify all three requests in `docs/SAMPLE_API_REQUESTS.http` against the local service.

**Checkpoint**: The API is independently testable and returns the documented filtered tickets, risk fields, and summary without frontend calculations or hardcoded results.

---

## Phase 4: User Story 2 - Understand Ticket Risk (Priority: P1)

**Goal**: Present the server-calculated risk, service-area status, and nearest-emergency details in a usable dashboard.

**Independent Test**: With the API available, search the demo bbox and confirm the dashboard displays all required fields and risk counts from the live response; verify station and utility filters update the same result and summary.

### Frontend API and Search Controls

- [X] T023 [P] [US2] Add API client tests for bbox encoding, optional filter omission/inclusion, radius default handling, typed response fields, and HTTP 400 message parsing in `frontend/src/features/conflicts/api/tickets-api.test.ts`.
- [X] T024 [US2] Implement typed ticket/summary/error models and the `GET /api/tickets/conflicts` client in `frontend/src/features/conflicts/api/ticket-types.ts` and `frontend/src/features/conflicts/api/tickets-api.ts`.
- [X] T025 [P] [US2] Add search form requirement tests for bbox, station code, utility type, radius, accessible labels, and submit behavior in `frontend/src/features/conflicts/ConflictSearchForm.test.tsx`.
- [X] T026 [US2] Implement bbox, station-code, utility-type, and radius inputs with a search action in `frontend/src/features/conflicts/ConflictSearchForm.tsx`.

### Risk, Summary, and Results Presentation

- [X] T027 [P] [US2] Add risk badge requirements tests proving HIGH/MEDIUM/LOW are textually identifiable without color in `frontend/src/features/conflicts/RiskBadge.test.tsx`.
- [X] T028 [US2] Implement the reusable text-identifiable risk badge in `frontend/src/features/conflicts/RiskBadge.tsx`.
- [X] T029 [P] [US2] Add ticket table requirements tests for every required API field and null nearest-emergency display in `frontend/src/features/conflicts/TicketTable.test.tsx`.
- [X] T030 [US2] Implement the ticket table with ticket number, status, priority, station code, utility type, longitude, latitude, `insideServiceArea`, nearest emergency number/distance, and risk in `frontend/src/features/conflicts/TicketTable.tsx`.
- [X] T031 [P] [US2] Add summary card tests for total, each risk count, outside-service-area, and by-utility counts in `frontend/src/features/conflicts/ConflictSummary.test.tsx`.
- [X] T032 [US2] Implement summary cards using only the API response values in `frontend/src/features/conflicts/ConflictSummary.tsx`.
- [X] T033 [US2] Compose search controls, API client, summary cards, risk badge, and ticket table into the live conflict page in `frontend/src/features/conflicts/ConflictPage.tsx` and `frontend/src/App.tsx`; do not provide mock/demo fallback rows.

**Checkpoint**: A reviewer can use the dashboard with a real API response and independently inspect the risk, spatial facts, nearest-emergency details, and filtered summary.

---

## Phase 5: User Story 3 - Recover from Search States (Priority: P2)

**Goal**: Distinguish loading, empty, validation-error, transport-error, and successful searches without stale results.

**Independent Test**: Use controlled pending, rejected, invalid-input, and empty API responses; confirm each state is distinguishable and a retry displays fresh results.

### Frontend Request-State Tests and Behavior

- [X] T034 [P] [US3] Add page-state tests for loading, successful results, empty results with zero totals, recoverable transport errors, and superseded requests in `frontend/src/features/conflicts/ConflictPage.states.test.tsx`.
- [X] T035 [US3] Implement loading/success/empty/error states, clear or suppress prior results during a new request, and abort or ignore stale responses in `frontend/src/features/conflicts/ConflictPage.tsx`.
- [X] T036 [P] [US3] Add tests mapping the shared HTTP 400 envelope to field-specific user-facing messages without exposing stack details in `frontend/src/features/conflicts/api/validation-error.test.ts`.
- [X] T037 [US3] Implement recoverable API/validation error mapping and retry behavior in `frontend/src/features/conflicts/api/validation-error.ts` and `frontend/src/features/conflicts/ConflictPage.tsx`.

**Checkpoint**: The user can distinguish an empty search from invalid input and service failure, and can retry without stale response data replacing newer results.

---

## Phase 6: User Story 4 - Inspect Results on a Map (Priority: P3)

**Goal**: Add the optional Leaflet/OpenStreetMap map only after the core dashboard and API are verified.

**Independent Test**: Given successful core search results, confirm markers use returned coordinates, each marker's risk is identifiable, and a map-bounds search updates bbox and the result set.

### Optional Map

- [ ] T038 [US4] Add `leaflet` and `react-leaflet` dependencies and Leaflet stylesheet configuration in `frontend/package.json` and `frontend/src/main.tsx` after Phases 3–5 pass.
- [ ] T039 [P] [US4] Add map requirements tests for marker coordinates, risk labels, and bounds-to-bbox behavior in `frontend/src/features/conflicts/ConflictMap.test.tsx`.
- [ ] T040 [US4] Implement the optional ticket map and map-bounds search integration in `frontend/src/features/conflicts/ConflictMap.tsx` and `frontend/src/features/conflicts/ConflictPage.tsx`.

**Checkpoint**: Map delivery is optional and cannot block the core dashboard acceptance criteria.

---

## Phase 7: Polish & Cross-Cutting Verification

**Purpose**: Verify cross-layer acceptance, sample requests, performance, security, and complete setup documentation.

### Integration and Testing

- [ ] T041 [P] Add a Playwright smoke workflow for backend/frontend startup and the primary search against the live API and PostGIS database, with no mocked endpoint or demo fixture responses, in `frontend/e2e/ticket-conflicts.spec.ts` and `frontend/playwright.config.ts`.
- [X] T042 Run the full backend unit/HTTP/PostGIS suite and frontend component suite using `backend/package.json` and `frontend/package.json`; resolve failures without changing supplied SQL or expected business rules.
- [X] T043 Run the documented main, utility-filter, and station-filter requests in `docs/SAMPLE_API_REQUESTS.http`; verify 9 demo-bbox tickets and summary values HIGH 3, MEDIUM 4, LOW 2, outsideServiceArea 2, WATER 4, GAS 2, SANITARY 1, TELECOM 2 in `backend/test/e2e/tickets-conflicts.e2e-spec.ts`.
- [ ] T044 Run the Playwright primary workflow and 20 demo-bbox timing repetitions; confirm at least 19 searches display results within two seconds and record outcome in `specs/001-ticket-conflict-validator/quickstart.md`.

### Documentation and Security

- [X] T045 Complete `README.md` with prerequisites, safe environment setup from `.env.example`, disposable database warning, exact SQL order, UTC setup, API examples, test commands, troubleshooting, and optional map status; confirm no real credentials are documented.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 Setup**: Begins immediately; project scaffolds and source-artifact copy are required before database or application work.
- **Phase 2 Foundational**: Depends on Setup. The disposable PostGIS database, preserved data, validated environment, and Pool connectivity block all feature stories.
- **Phase 3 US1**: Depends on Phase 2. The endpoint contract and backend business logic establish the authoritative response.
- **Phase 4 US2**: Depends on the US1 endpoint and response contract; frontend integration consumes only live API values.
- **Phase 5 US3**: Depends on the US2 search page and API client.
- **Phase 6 US4**: Depends on verified US1–US3 core functionality; optional only.
- **Phase 7 Polish**: E2E, performance, and documentation closeout depends on all required core stories; map E2E is conditional on US4.

### User Story Dependencies

- **US1 (P1)**: Depends on Foundational database/API configuration; independently testable through API tests and the supplied data.
- **US2 (P1)**: Depends on US1's response contract and API; independently testable through a live API-backed dashboard with all risk fields.
- **US3 (P2)**: Depends on US2's page and API client; independently testable with controlled request states.
- **US4 (P3)**: Depends on verified US1–US3; may be omitted without affecting the core release.

### Parallel Opportunities

- Setup T002–T004 can proceed in parallel with T001 after directories exist; T005 is independent of frontend scaffolding.
- After Phase 2, isolated US1 contract, DTO, repository, classifier, and summary test files (T012, T013, T015, T017, T019) can be authored in parallel; implementation tasks follow the tests and their dependencies.
- In US2, API client, form, badge, table, and summary tests (T023, T025, T027, T029, T031) touch separate files and can be authored in parallel once frontend test tooling is available.
- In US3, page-state and validation-error tests (T034, T036) can be developed in parallel; their implementations integrate afterward.
- US4 must remain serial after the core acceptance checkpoint; map dependencies/test/code may then be split by file where no shared-page edit conflicts exist.

## Parallel Example: User Story 1

```text
After Phase 2, author these independent test files in parallel:
T012 backend/test/contracts/tickets-conflicts.contract.spec.ts
T013 backend/test/unit/tickets/conflict-query.dto.spec.ts
T015 backend/test/integration/tickets/tickets.repository.spec.ts
T017 backend/test/unit/tickets/risk-classifier.spec.ts
T019 backend/test/unit/tickets/conflict-summary.spec.ts

Then implement in dependency order: T014 -> T016 -> T018 -> T020 -> T021 -> T022.
```

## Implementation Strategy

### MVP First

1. Complete Phase 1 and Phase 2, including the exact SQL initialization order and sanity checks.
2. Complete US1 and US2: API validation, spatial query, risk rules, summary, live dashboard controls/results, and automated coverage. Both P1 stories are needed for a user-visible MVP because the dashboard must expose authoritative risk fields rather than placeholder values.
3. Complete US3 request states and error recovery before presenting the dashboard as core complete.
4. Stop before US4 if time is limited; map functionality is optional.

### Incremental Delivery

- Deliver the tested API contract and PostGIS backend first (US1).
- Add the live dashboard and risk presentation (US2), then request recovery behavior (US3).
- Gate optional mapping (US4) behind core verification.
- Finish the exact sample-request run, full end-to-end flow, performance threshold, and README before release.

## Notes

- All task lines use the required checkbox, sequential ID, optional `[P]`, story label when applicable, and explicit file path(s).
- `[P]` indicates isolated work only; tasks touching the same page/configuration file are intentionally sequential.
- Tests are required by the feature specification; add them before their associated implementation and run them against a disposable PostGIS database.
- Do not modify the supplied SQL schema, seed data, or sample API request text to make tests pass.
