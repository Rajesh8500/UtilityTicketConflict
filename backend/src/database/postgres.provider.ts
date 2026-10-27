import { Pool } from 'pg';
import { BackendConfig } from '../config/configuration';

export const POSTGRES_POOL = Symbol('POSTGRES_POOL');

export function createPostgresPool(config: BackendConfig): Pool {
  return new Pool({
    host: config.dbHost,
    port: config.dbPort,
    database: config.dbName,
    user: config.dbUser,
    password: config.dbPassword,
    ssl: config.dbSsl ? { rejectUnauthorized: true } : false,
    options: '-c timezone=UTC',
    application_name: 'utility-ticket-conflict-validator',
    max: 10,
  });
}
