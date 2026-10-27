import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { TicketsController } from './tickets.controller';
import { TicketsRepository } from './tickets.repository';
import { TicketsService } from './tickets.service';

@Module({
  imports: [DatabaseModule],
  controllers: [TicketsController],
  providers: [TicketsRepository, TicketsService],
})
export class TicketsModule {}
