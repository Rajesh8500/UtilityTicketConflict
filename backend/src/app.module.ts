import { Module } from '@nestjs/common';
import { AppConfigModule } from './config/config.module';
import { DatabaseModule } from './database/database.module';
import { TicketsModule } from './tickets/tickets.module';

@Module({
  imports: [AppConfigModule, DatabaseModule, TicketsModule],
})
export class AppModule {}
