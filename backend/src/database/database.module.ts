import { Inject, Injectable, Module, OnApplicationShutdown } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool } from 'pg';
import { backendConfigFromRecord } from '../config/configuration';
import { createPostgresPool, POSTGRES_POOL } from './postgres.provider';

@Injectable()
class PostgresPoolLifecycle implements OnApplicationShutdown {
  constructor(@Inject(POSTGRES_POOL) private readonly pool: Pool) {}

  async onApplicationShutdown(): Promise<void> {
    await this.pool.end();
  }
}

@Module({
  providers: [
    {
      provide: POSTGRES_POOL,
      inject: [ConfigService],
      useFactory: (config: ConfigService) =>
        createPostgresPool(backendConfigFromRecord(config)),
    },
    PostgresPoolLifecycle,
  ],
  exports: [POSTGRES_POOL],
})
export class DatabaseModule {}
