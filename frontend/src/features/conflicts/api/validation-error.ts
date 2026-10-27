import { TicketsApiError } from './tickets-api'

export function validationErrorMessage(error: unknown): string {
  if (error instanceof TicketsApiError && error.status === 400) {
    return error.message
  }
  return 'The ticket service is unavailable. Please try again.'
}
