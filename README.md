# Utility Ticket Conflict & Service Area Validator

## Live Coding Test — 1 Hour

You are building a small full-stack GIS utility ticket validator.

You may use your own existing local setup, but the required stack is:

- React.js frontend
- NestJS backend with TypeScript
- PostgreSQL
- PostGIS extension enabled

This package contains:

- database schema
- seed data
- backend API requirements
- frontend requirements
- expected response shape
- submission checklist

You are responsible for installing and running your own project dependencies.


---

## Flexibility Note

The provided schema and seed data are recommended starting points for the live test. If you believe there is a better way to model the data, you may adjust the schema, table names, relationships, or seed structure.

However, your final solution must still produce the required API output shape and must support the required behavior:

- bbox-based ticket search
- station code and utility type filtering
- service area validation
- nearby emergency conflict detection
- HIGH / MEDIUM / LOW risk calculation
- summary counts

In short: you may change the internal implementation, but the final working output must match the requirements.

---

## Goal

Build a feature that finds utility tickets inside a map bounding box and evaluates risk based on:

1. whether the ticket is inside its assigned service area polygon
2. whether there is a nearby emergency ticket within a configurable radius
3. whether the ticket is overdue

---

## Required Backend Endpoint

Create this endpoint:

```txt
GET /api/tickets/conflicts
```

Query params:

```txt
bbox=minLng,minLat,maxLng,maxLat   required
stationCode                         optional
utilityType                         optional
radiusMeters                        optional, default 250
```

Example:

```txt
GET /api/tickets/conflicts?bbox=-80.00,43.20,-79.70,43.40&utilityType=WATER&radiusMeters=250
```

---

## Required Frontend

Create a React page with:

- bbox input
- station code filter
- utility type filter
- radius input
- search button
- summary cards
- ticket table
- risk badge for HIGH / MEDIUM / LOW
- loading and error states

Bonus:

- Leaflet/OpenStreetMap map
- markers colored by risk level
- map bounds update bbox

---

## Database Setup

Run the SQL files in this order:

```bash
psql -d YOUR_DATABASE_NAME -f database/01_schema.sql
psql -d YOUR_DATABASE_NAME -f database/02_seed.sql
```

Or copy/paste the SQL into your database client.

## Local Backend Setup

The project constitution and approved feature specification require the supplied SQL schema, seed data, identifiers, and polygons to remain unchanged. This project-specific requirement overrides the flexibility note above; do not edit the supplied SQL to make a test pass.

Install PostGIS for the same PostgreSQL major version before initializing a database. The schema script starts with `CREATE EXTENSION IF NOT EXISTS postgis` and then drops/recreates the three feature tables, so run it only against a disposable local database.

Copy `.env.example` to `.env` if `.env` does not already exist. Put the real local PostgreSQL password only in ignored `.env`; keep the password in `.env.example` as a dummy placeholder. The backend reads the database host, port, name, user, password, SSL mode, UTC timezone, API port, and CORS origin from environment variables.

PowerShell setup and initialization:

```powershell
$settings = @{}
Get-Content .env | ForEach-Object {
  if ($_ -match '^\s*([^#=]+)=(.*)$') {
    $settings[$Matches[1]] = $Matches[2]
  }
}
$env:PGPASSWORD = $settings['DB_PASSWORD']
$env:PGHOST = $settings['DB_HOST']
$env:PGPORT = $settings['DB_PORT']
$env:PGUSER = $settings['DB_USER']
$env:PGOPTIONS = '-c timezone=UTC'
$databaseExists = psql -d postgres -v "db_name=$($settings['DB_NAME'])" -Atc "SELECT 1 FROM pg_database WHERE datname = :'db_name'"
if ($LASTEXITCODE -ne 0) { throw 'Could not check PostgreSQL database state' }
if (-not $databaseExists) {
  createdb $settings['DB_NAME']
  if ($LASTEXITCODE -ne 0) { throw 'Could not create the configured local database' }
}
$tableCount = psql -d $settings['DB_NAME'] -Atc "SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public'"
if ($LASTEXITCODE -ne 0) { throw 'Could not inspect the configured database' }
if ([int]$tableCount -ne 0) { throw 'Refusing to run the destructive schema on a database with existing public tables' }
psql -d $settings['DB_NAME'] -v ON_ERROR_STOP=1 -f database/01_schema.sql
if ($LASTEXITCODE -ne 0) { throw 'Schema initialization failed' }
psql -d $settings['DB_NAME'] -v ON_ERROR_STOP=1 -f database/02_seed.sql
if ($LASTEXITCODE -ne 0) { throw 'Seed initialization failed' }
psql -d $settings['DB_NAME'] -v ON_ERROR_STOP=1 -f database/03_sanity_check.sql
if ($LASTEXITCODE -ne 0) { throw 'Database sanity checks failed' }
Remove-Item Env:PGOPTIONS
Remove-Item Env:PGPASSWORD
Remove-Item Env:PGHOST
Remove-Item Env:PGPORT
Remove-Item Env:PGUSER
```

The expected sanity counts are 4 stations, 4 service areas, and 10 tickets; the documented demo bbox returns 9 tickets. Run `02_seed.sql` in UTC because `due_at` is a timezone-naive `TIMESTAMP` interpreted as UTC by this project.

Install and run the backend from the repository root:

```powershell
npm --prefix backend install
npm --prefix backend run build
npm --prefix backend test
npm --prefix backend run test:integration
npm --prefix backend run test:e2e
npm --prefix backend run start:dev
```

The API listens on port 3000 by default. The integration and E2E suites require `TEST_DATABASE_URL` to point to a disposable database whose name ends in `_test`, initialized with PostGIS and the supplied seed. They skip database cases when that variable is absent. Never use a shared or valuable database for those suites.

## Local Frontend Setup

The React/Vite frontend reads `VITE_API_BASE_URL` from the repository-root `.env` file and defaults to `http://localhost:3000/api` when the setting is absent. Start it in a second PowerShell terminal after the backend:

```powershell
npm --prefix frontend install
npm --prefix frontend run dev
```

Open the Vite URL printed in the terminal (normally `http://localhost:5173`). The dashboard requests live ticket data from the NestJS API; it does not contain fallback ticket rows or calculate risk/spatial results.

Run frontend checks from the repository root:

```powershell
npm --prefix frontend test
npm --prefix frontend run build
npm --prefix frontend run lint
```

The component tests use mock HTTP responses only as isolated fixtures; the running dashboard always calls the configured API.

## Troubleshooting

- **Database connection refused**: Confirm PostgreSQL is running and `.env` has the correct host, port, database name, user, and local password.
- **PostGIS extension unavailable**: Install the PostGIS package matching the installed PostgreSQL major version, then rerun the schema only against a disposable database.
- **Frontend cannot reach the API**: Keep the backend running, check `VITE_API_BASE_URL` in the root `.env`, and confirm `FRONTEND_ORIGIN` matches the Vite origin.
- **Port already in use**: Change `API_PORT` or the Vite port and update the corresponding frontend origin/API URL.

## Optional Map

The Leaflet/OpenStreetMap map remains optional and is not included in the verified core dashboard. The core search, server-provided risk and summary, and ticket table work without it.

---

## Important GIS Rules

- Coordinates are stored as longitude first, latitude second.
- bbox format is `minLng,minLat,maxLng,maxLat`.
- Use SRID `4326`.
- Use PostGIS for spatial filtering.
- Do not fetch all tickets and filter only in React.

---

## Time Limit

You have 1 hour.

Prioritize correctness over styling.
