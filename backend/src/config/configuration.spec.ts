import { validateBackendEnvironment } from './configuration';

const validEnvironment = (): NodeJS.ProcessEnv => ({
  DB_HOST: 'localhost',
  DB_PORT: '5432',
  DB_NAME: 'utility_tickets_dev',
  DB_USER: 'utility_ticket_app',
  DB_PASSWORD: 'local-test-password',
  DB_SSL: 'false',
  DB_TIMEZONE: 'UTC',
  API_PORT: '3000',
  FRONTEND_ORIGIN: 'http://localhost:5173',
});

describe('validateBackendEnvironment', () => {
  it('parses database and API settings from environment variables', () => {
    const result = validateBackendEnvironment(validEnvironment());

    expect(result.DB_PORT).toBe(5432);
    expect(result.DB_SSL).toBe(false);
    expect(result.DB_TIMEZONE).toBe('UTC');
    expect(result.API_PORT).toBe(3000);
  });

  it('rejects missing database credentials', () => {
    const environment = validEnvironment();
    delete environment.DB_PASSWORD;

    expect(() => validateBackendEnvironment(environment)).toThrow(
      'Missing required environment variable: DB_PASSWORD',
    );
  });

  it('rejects invalid ports and SSL values', () => {
    const environment = validEnvironment();
    environment.DB_PORT = '0';
    expect(() => validateBackendEnvironment(environment)).toThrow('DB_PORT');

    environment.DB_PORT = '5432';
    environment.DB_SSL = 'sometimes';
    expect(() => validateBackendEnvironment(environment)).toThrow('DB_SSL');
  });

  it('requires UTC for the timezone-naive due_at column', () => {
    const environment = validEnvironment();
    environment.DB_TIMEZONE = 'America/Toronto';

    expect(() => validateBackendEnvironment(environment)).toThrow('DB_TIMEZONE must be UTC');
  });
});
