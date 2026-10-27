import { useEffect, useRef, useState } from 'react'
import { ConflictSearchForm } from './ConflictSearchForm'
import { ConflictSummary } from './ConflictSummary'
import { getTicketConflicts } from './api/tickets-api'
import type { ConflictResponse, ConflictSearch } from './api/ticket-types'
import { TicketTable } from './TicketTable'
import { validationErrorMessage } from './api/validation-error'

type RequestState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'success'; response: ConflictResponse }

export function ConflictPage() {
  const [requestState, setRequestState] = useState<RequestState>({ status: 'idle' })
  const activeRequest = useRef<{ id: number; controller: AbortController } | null>(null)
  const requestId = useRef(0)

  useEffect(() => () => activeRequest.current?.controller.abort(), [])

  function resetSearch() {
    activeRequest.current?.controller.abort()
    activeRequest.current = null
    setRequestState({ status: 'idle' })
  }

  async function search(searchQuery: ConflictSearch) {
    activeRequest.current?.controller.abort()
    const request = { id: ++requestId.current, controller: new AbortController() }
    activeRequest.current = request
    setRequestState({ status: 'loading' })

    try {
      const response = await getTicketConflicts(searchQuery, request.controller.signal)
      if (activeRequest.current?.id === request.id) {
        setRequestState({ status: 'success', response })
      }
    } catch (error) {
      if (activeRequest.current?.id !== request.id) return
      if (error instanceof DOMException && error.name === 'AbortError') return
      const message = validationErrorMessage(error)
      setRequestState({ status: 'error', message })
    } finally {
      if (activeRequest.current?.id === request.id) activeRequest.current = null
    }
  }

  const hasResults = requestState.status === 'success'
  const isEmpty = hasResults && requestState.response.tickets.length === 0

  return (
    <main className="dashboard">
      <header className="app-header">
        <a className="brand" href="/" aria-label="Utility operations home">
          <span className="brand-mark" aria-hidden="true">U</span>
          <span>Utility Ops</span>
        </a>
        <span className="header-tag">Ticket intelligence</span>
      </header>

      <section className="page-intro">
        <div className="intro-copy">
          <p className="eyebrow">Operations dashboard</p>
          <h1>Ticket conflict validator</h1>
          <p className="intro-description">
            Search an area to review service coverage, nearby emergency work, and ticket risk.
          </p>
        </div>
        <div className="intro-status">
          <span className="status-indicator" aria-hidden="true" />
          API-powered results
        </div>
      </section>

      <ConflictSearchForm
        onSearch={search}
        onReset={resetSearch}
        disabled={requestState.status === 'loading'}
      />

      {requestState.status === 'loading' && (
        <div className="request-state loading-state" role="status" aria-live="polite">
          <span className="loading-spinner" aria-hidden="true" />
          <span>Searching tickets…</span>
        </div>
      )}

      {requestState.status === 'error' && (
        <section className="request-state error-state" role="alert">
          <div>
            <p className="eyebrow">Search failed</p>
            <h2>We couldn’t load ticket results</h2>
            <p>{requestState.message}</p>
          </div>
          <p className="subtle-copy">Check your filters or connection, then search again.</p>
        </section>
      )}

      {requestState.status === 'idle' && (
        <section className="request-state idle-state" aria-live="polite">
          <span className="idle-icon" aria-hidden="true">⌖</span>
          <div>
            <h2>Ready to search</h2>
            <p>Enter an area and filters above to load current tickets from the API.</p>
          </div>
        </section>
      )}

      {hasResults && (
        <section className="results-section" aria-label="Ticket search results">
          <div className="results-heading">
            <div>
              <p className="eyebrow">Live result set</p>
              <h2>{isEmpty ? 'No matching tickets' : 'Search results'}</h2>
            </div>
            <span className="result-count">
              {requestState.response.summary.total} {requestState.response.summary.total === 1 ? 'ticket' : 'tickets'}
            </span>
          </div>
          <ConflictSummary summary={requestState.response.summary} />
          {isEmpty ? (
            <div className="request-state empty-state" role="status">
              <h3>No tickets match this search</h3>
              <p>Try a wider bounding box or remove one of the optional filters.</p>
            </div>
          ) : (
            <TicketTable tickets={requestState.response.tickets} />
          )}
        </section>
      )}

      <footer className="app-footer">
        <span>Risk and spatial results are calculated by the service.</span>
        <span>Utility Ticket Conflict Validator</span>
      </footer>
    </main>
  )
}
