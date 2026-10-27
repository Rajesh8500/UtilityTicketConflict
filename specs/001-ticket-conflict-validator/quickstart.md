# Quickstart: Local Validation

This guide describes the planned developer verification flow. It assumes repository setup has created the backend/frontend manifests and copied the supplied database scripts unchanged. Run all SQL only against a disposable local database: `01_schema.sql` drops the feature tables.

## Prerequisites

- Node.js LTS and npm, with the versions pinned by the repository lockfiles.
- PostgreSQL with PostGIS available to the database user.
- `psql` and `createdb` on `PATH`.
- PowerShell on Windows or equivalent environment-variable setup on another platform.

## Configure a Disposable Database

Create a local database, then set the connection values in the ignored local environment file copied from `.env.example`. Use placeholder values only in committed examples. The `due_at` column is timezone-naive; seed/import and API database sessions must use UTC.

```powershell
createdb utility_tickets_dev
$env:PGOPTIONS = '-c timezone=UTC'
psql -d utility_tickets_dev -v ON_ERROR_STOP=1 -f database/01_schema.sql
psql -d utility_tickets_dev -v ON_ERROR_STOP=1 -f database/02_seed.sql
psql -d utility_tickets_dev -v ON_ERROR_STOP=1 -f database/03_sanity_check.sql
Remove-Item Env:PGOPTIONS
```

Expected sanity counts: `station_codes = 4`, `service_areas = 4`, and `tickets = 10`. The sample bbox `-80.00,43.18,-79.65,43.38` includes nine tickets. The sanity SQL also prints each ticket's longitude (`ST_X`) and latitude (`ST_Y`).

Never point these commands at a shared or valuable database because the supplied schema script drops existing feature tables.

## Start the Applications

After creating each project and installing its locked dependencies:

```powershell
npm --prefix backend install
npm --prefix frontend install
npm --prefix backend run start:dev
```

In a second PowerShell terminal:

```powershell
npm --prefix frontend run dev
```

The planned local defaults are NestJS at `http://localhost:3000` and Vite at `http://localhost:5173`. Configure the frontend API base URL as `http://localhost:3000/api`, and set the backend database connection and frontend origin through environment variables. The backend Pool must establish UTC sessions.

## Verify the API

```powershell
Invoke-RestMethod 'http://localhost:3000/api/tickets/conflicts?bbox=-80.00%2C43.18%2C-79.65%2C43.38&radiusMeters=250' | ConvertTo-Json -Depth 8
```

Expected outcome: a top-level `tickets` array with nine entries and a `summary` object. The summary is expected to report total 9, HIGH 3, MEDIUM 4, LOW 2, outside-service-area 2, and utility counts WATER 4, GAS 2, SANITARY 1, TELECOM 2. Response fields and nullability are specified in [contracts/openapi.yaml](contracts/openapi.yaml).

Try the optional filters using the sample requests in the supplied package, for example `utilityType=WATER` and `stationCode=HLTNW02`. Each filter must narrow both the ticket list and summary; a valid unmatched filter yields no results and zero counts. Emergency candidates remain global and are not restricted to the returned bbox/filter set.

## Verify Validation and Risk Cases

- Omit `bbox`, supply the wrong coordinate count, non-numeric or out-of-range values, or reverse bbox bounds. Each returns HTTP 400 with the shared field-specific error envelope.
- Omit `radiusMeters` to verify the 250-meter default. Zero, negative, non-numeric, and non-finite values return the same HTTP 400 structure. A large finite positive value is accepted; no product-level maximum applies.
- Verify a point on a matching polygon boundary is inside, and a station with several polygons is inside if any one covers the point.
- Verify an unassigned ticket is outside the assigned service area.
- Verify an emergency outside bbox/optional filters can raise a returned ticket's risk, while the ticket itself is excluded as its own nearest candidate.
- Verify no qualifying emergency produces null nearest ticket and distance fields.
- Verify HIGH precedence, overdue `PRE_COMPLETED` behavior at a known UTC timestamp, non-`PRE_COMPLETED` overdue behavior, and null `due_at` behavior.
- Verify an empty valid result displays an empty state and zero summary, distinct from validation and transport errors.

## Run Automated Checks

After implementation defines the package scripts, the expected commands are:

```powershell
npm --prefix backend test
npm --prefix backend run test:integration
npm --prefix frontend test
npm run test:e2e
```

The backend integration tests require a disposable PostGIS database configured from test environment variables. The end-to-end test starts both applications and verifies a demo search, summary values, table columns, and a filter refresh. For the performance criterion, repeat the demo-box search 20 times and verify at least 19 complete within two seconds. If the optional map phase is implemented, verify marker risk labels and map-bound searches separately.
