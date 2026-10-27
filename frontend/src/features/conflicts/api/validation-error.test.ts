import { describe, expect, it } from 'vitest'
import { TicketsApiError } from './tickets-api'
import { validationErrorMessage } from './validation-error'

describe('validationErrorMessage', () => {
  it('shows field-specific HTTP 400 details from the API', () => {
    expect(
      validationErrorMessage(new TicketsApiError('bbox coordinates are invalid', 400)),
    ).toBe('bbox coordinates are invalid')
  })

  it('does not expose server error detail for HTTP 500 responses', () => {
    expect(
      validationErrorMessage(new TicketsApiError('database password: secret', 500)),
    ).toBe('The ticket service is unavailable. Please try again.')
  })

  it('does not expose unexpected error details', () => {
    expect(validationErrorMessage(new Error('stack trace or secret'))).toBe(
      'The ticket service is unavailable. Please try again.',
    )
  })
})
