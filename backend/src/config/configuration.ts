export interface BackendConfig {
  dbHost: string;
  dbPort: number;
  dbName: string;
  dbUser: string;
  dbPassword: string;
  dbSsl: boolean;
  dbTimezone: 'UTC';
  apiPort: number;
  frontendOrigin: string;
}

function required(env: NodeJS.ProcessEnv, key: string): string {
  const value = env[key]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

function positiveInteger(value: string, key: string): number {
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed <= 0 || parsed > 65535) {
    throw new Error(`${key} must be an integer between 1 and 65535`);
  }
  return parsed;
}

function booleanValue(value: string | undefined, key: string, fallback: boolean): boolean {
  if (value === undefined || value.trim() === '') return fallback;
  if (value.toLowerCase() === 'true') return true;
  if (value.toLowerCase() === 'false') return false;
  throw new Error(`${key} must be true or false`);
}

export function validateBackendEnvironment(env: NodeJS.ProcessEnv): Record<string, unknown> {
  const dbTimezone = env.DB_TIMEZONE?.trim().toUpperCase() || 'UTC';
  if (dbTimezone !== 'UTC') {
    throw new Error('DB_TIMEZONE must be UTC because due_at is stored without timezone metadata');
  }

  const frontendOrigin = required(env, 'FRONTEND_ORIGIN');
  const originUrl = new URL(frontendOrigin);
  if (originUrl.protocol !== 'http:' && originUrl.protocol !== 'https:') {
    throw new Error('FRONTEND_ORIGIN must use HTTP or HTTPS');
  }

  return {
    ...env,
    DB_HOST: required(env, 'DB_HOST'),
    DB_PORT: positiveInteger(env.DB_PORT || '5432', 'DB_PORT'),
    DB_NAME: required(env, 'DB_NAME'),
    DB_USER: required(env, 'DB_USER'),
    DB_PASSWORD: required(env, 'DB_PASSWORD'),
    DB_SSL: booleanValue(env.DB_SSL, 'DB_SSL', false),
    DB_TIMEZONE: 'UTC',
    API_PORT: positiveInteger(env.API_PORT || '3000', 'API_PORT'),
    FRONTEND_ORIGIN: frontendOrigin,
  };
}

export function backendConfigFromRecord(config: {
  getOrThrow<T = string>(key: string): T;
}): BackendConfig {
  return {
    dbHost: config.getOrThrow<string>('DB_HOST'),
    dbPort: config.getOrThrow<number>('DB_PORT'),
    dbName: config.getOrThrow<string>('DB_NAME'),
    dbUser: config.getOrThrow<string>('DB_USER'),
    dbPassword: config.getOrThrow<string>('DB_PASSWORD'),
    dbSsl: config.getOrThrow<boolean>('DB_SSL'),
    dbTimezone: 'UTC',
    apiPort: config.getOrThrow<number>('API_PORT'),
    frontendOrigin: config.getOrThrow<string>('FRONTEND_ORIGIN'),
  };
}
