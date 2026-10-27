import { Injectable } from '@nestjs/common';
import { ConflictResponse, TicketResponse } from './ticket-response';
import { classifyRisk } from './risk-classifier';
import { summarizeTickets } from './conflict-summary';
import { ConflictSearchQuery, TicketsRepository } from './tickets.repository';

@Injectable()
export class TicketsService {
  constructor(private readonly ticketsRepository: TicketsRepository) {}

  async findConflicts(query: ConflictSearchQuery): Promise<ConflictResponse> {
    const rows = await this.ticketsRepository.findConflicts(query);

    const tickets: TicketResponse[] = rows.map((row) => ({
      id: row.id,
      ticketNo: row.ticketNo,
      status: row.status,
      priority: row.priority,
      stationCode: row.stationCode,
      utilityType: row.utilityType,
      longitude: row.longitude,
      latitude: row.latitude,
      insideServiceArea: row.insideServiceArea,
      nearestEmergencyTicketNo: row.nearestEmergencyTicketNo,
      distanceToNearestEmergencyMeters: row.distanceToNearestEmergencyMeters,
      riskLevel: classifyRisk({
        priority: row.priority,
        status: row.status,
        insideServiceArea: row.insideServiceArea,
        isPastDue: row.isPastDue,
        hasNearbyEmergency: row.nearestEmergencyTicketNo !== null,
      }),
    }));

    return {
      tickets,
      summary: summarizeTickets(tickets),
    };
  }
}
