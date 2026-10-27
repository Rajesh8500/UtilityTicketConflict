import { Pool } from 'pg';

const databaseUrl = process.env.TEST_DATABASE_URL;
const integrationDescribe = databaseUrl ? describe : describe.skip;

integrationDescribe('PostgreSQL/PostGIS configuration', () => {
  let pool: Pool;

  beforeAll(async () => {
    if (!databaseUrl) return;
    const parsedUrl = new URL(databaseUrl);
    if (!parsedUrl.pathname.endsWith('_test')) {
      throw new Error('TEST_DATABASE_URL must target a database whose name ends with _test');
    }
    pool = new Pool({ connectionString: databaseUrl, options: '-c timezone=UTC' });
  });

  afterAll(async () => {
    if (pool) await pool.end();
  });

  it('connects with UTC timezone and PostGIS enabled', async () => {
    const result = await pool.query<{
      timezone: string;
      postgis_version: string;
      current_database: string;
    }>(
      `SELECT current_setting('TimeZone') AS timezone,
              PostGIS_Version() AS postgis_version,
              current_database() AS current_database`,
    );
    expect(result.rows[0].timezone).toBe('UTC');
    expect(result.rows[0].postgis_version).toBeTruthy();
    expect(result.rows[0].current_database.endsWith('_test')).toBe(true);
  });
});
