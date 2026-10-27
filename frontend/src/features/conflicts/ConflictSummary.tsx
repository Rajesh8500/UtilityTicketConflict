import type { Summary } from './api/ticket-types'

interface ConflictSummaryProps {
  summary: Summary
}

export function ConflictSummary({ summary }: ConflictSummaryProps) {
  const cards = [
    { label: 'Tickets found', value: summary.total, tone: 'neutral' },
    { label: 'High risk', value: summary.highRisk, tone: 'high' },
    { label: 'Medium risk', value: summary.mediumRisk, tone: 'medium' },
    { label: 'Low risk', value: summary.lowRisk, tone: 'low' },
    { label: 'Outside service area', value: summary.outsideServiceArea, tone: 'outside' },
  ]

  return (
    <section aria-label="Search summary" className="summary-section">
      <div className="summary-grid">
        {cards.map((card) => (
          <article className={`summary-card summary-${card.tone}`} key={card.label}>
            <span className="summary-label">{card.label}</span>
            <strong className="summary-value">{card.value}</strong>
          </article>
        ))}
      </div>
      <div className="utility-breakdown">
        <div>
          <p className="eyebrow">By utility</p>
          <h3>Utility type counts</h3>
        </div>
        {Object.keys(summary.byUtilityType).length === 0 ? (
          <p className="muted-value">No utility types in this result set.</p>
        ) : (
          <ul className="utility-list">
            {Object.entries(summary.byUtilityType).map(([utilityType, count]) => (
              <li key={utilityType}>
                <span>{utilityType}</span>
                <strong>{count}</strong>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}
