import type { Ticket } from './api/ticket-types'
import { RiskBadge } from './RiskBadge'

interface TicketTableProps {
  tickets: Ticket[]
}

function formatDistance(distance: number | null): string {
  return distance === null ? '—' : `${distance.toFixed(1)} m`
}

export function TicketTable({ tickets }: TicketTableProps) {
  return (
    <div className="table-scroll">
      <table className="ticket-table">
        <caption className="sr-only">Filtered utility tickets and conflict details</caption>
        <thead>
          <tr>
            <th scope="col">Ticket number</th>
            <th scope="col">Status</th>
            <th scope="col">Priority</th>
            <th scope="col">Station code</th>
            <th scope="col">Utility type</th>
            <th scope="col">Longitude</th>
            <th scope="col">Latitude</th>
            <th scope="col">Inside service area</th>
            <th scope="col">Nearest emergency ticket</th>
            <th scope="col">Distance to nearest emergency (m)</th>
            <th scope="col">Risk</th>
          </tr>
        </thead>
        <tbody>
          {tickets.map((ticket) => (
            <tr key={ticket.id}>
              <th scope="row">{ticket.ticketNo}</th>
              <td>{ticket.status.replaceAll('_', ' ')}</td>
              <td>
                <span className={ticket.priority === 'EMERGENCY' ? 'priority-emergency' : ''}>
                  {ticket.priority}
                </span>
              </td>
              <td>{ticket.stationCode ?? <span className="muted-value">Not assigned</span>}</td>
              <td>{ticket.utilityType ?? <span className="muted-value">Not assigned</span>}</td>
              <td className="coordinate">{ticket.longitude.toFixed(5)}</td>
              <td className="coordinate">{ticket.latitude.toFixed(5)}</td>
              <td>
                <span className={ticket.insideServiceArea ? 'area-yes' : 'area-no'}>
                  {ticket.insideServiceArea ? 'Inside' : 'Outside'}
                </span>
              </td>
              <td>
                {ticket.nearestEmergencyTicketNo ?? (
                  <span className="muted-value">No nearby emergency</span>
                )}
              </td>
              <td>{formatDistance(ticket.distanceToNearestEmergencyMeters)}</td>
              <td><RiskBadge riskLevel={ticket.riskLevel} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
