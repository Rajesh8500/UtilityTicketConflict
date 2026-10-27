import { Controller, Get, Query } from '@nestjs/common';
import { ConflictQueryDto } from './dto/conflict-query.dto';
import { ConflictResponse } from './ticket-response';
import { TicketsService } from './tickets.service';

@Controller('tickets')
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Get('conflicts')
  findConflicts(@Query() query: ConflictQueryDto): Promise<ConflictResponse> {
    return this.ticketsService.findConflicts({
      bbox: query.bboxBounds,
      stationCode: query.stationCode,
      utilityType: query.utilityType,
      radiusMeters: query.radiusMeters,
    });
  }
}
