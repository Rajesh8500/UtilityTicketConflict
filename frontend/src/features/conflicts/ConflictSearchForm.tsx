import { useState, type FormEvent } from 'react'
import type { ConflictSearch } from './api/ticket-types'

export interface SearchFormValues {
  minLng: string
  minLat: string
  maxLng: string
  maxLat: string
  stationCode: string
  utilityType: string
  radiusMeters: string
}

const initialSearchValues: SearchFormValues = {
  minLng: '-80.00',
  minLat: '43.18',
  maxLng: '-79.65',
  maxLat: '43.38',
  stationCode: '',
  utilityType: '',
  radiusMeters: '250',
}

interface ConflictSearchFormProps {
  onSearch: (search: ConflictSearch) => void
  onReset: () => void
  disabled: boolean
}

export function ConflictSearchForm({ onSearch, onReset, disabled }: ConflictSearchFormProps) {
  const [values, setValues] = useState(initialSearchValues)

  function update(field: keyof SearchFormValues, value: string) {
    setValues((current) => ({ ...current, [field]: value }))
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    onSearch({
      minLng: Number(values.minLng),
      minLat: Number(values.minLat),
      maxLng: Number(values.maxLng),
      maxLat: Number(values.maxLat),
      stationCode: values.stationCode.trim() || undefined,
      utilityType: values.utilityType.trim() || undefined,
      radiusMeters: Number(values.radiusMeters),
    })
  }

  function reset() {
    setValues(initialSearchValues)
    onReset()
  }

  return (
    <form className="search-panel" onSubmit={submit} aria-busy={disabled}>
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Search area</p>
          <h2>Find tickets and conflicts</h2>
        </div>
        <p className="panel-hint">Coordinates use longitude, then latitude.</p>
      </div>

      <fieldset className="search-fields">
        <legend className="sr-only">Ticket search filters</legend>
        <label>
          Minimum longitude
          <input
            aria-label="Minimum longitude"
            type="number"
            step="any"
            required
            value={values.minLng}
            onChange={(event) => update('minLng', event.target.value)}
          />
        </label>
        <label>
          Minimum latitude
          <input
            aria-label="Minimum latitude"
            type="number"
            step="any"
            required
            value={values.minLat}
            onChange={(event) => update('minLat', event.target.value)}
          />
        </label>
        <label>
          Maximum longitude
          <input
            aria-label="Maximum longitude"
            type="number"
            step="any"
            required
            value={values.maxLng}
            onChange={(event) => update('maxLng', event.target.value)}
          />
        </label>
        <label>
          Maximum latitude
          <input
            aria-label="Maximum latitude"
            type="number"
            step="any"
            required
            value={values.maxLat}
            onChange={(event) => update('maxLat', event.target.value)}
          />
        </label>
        <label>
          Station code <span className="optional-label">Optional</span>
          <input
            aria-label="Station code"
            type="text"
            maxLength={50}
            placeholder="e.g. HLTNW02"
            value={values.stationCode}
            onChange={(event) => update('stationCode', event.target.value)}
          />
        </label>
        <label>
          Utility type <span className="optional-label">Optional</span>
          <input
            aria-label="Utility type"
            type="text"
            maxLength={50}
            placeholder="e.g. WATER"
            value={values.utilityType}
            onChange={(event) => update('utilityType', event.target.value)}
          />
        </label>
        <label>
          Emergency radius (meters)
          <input
            aria-label="Emergency radius in meters"
            type="number"
            min="0.000001"
            step="any"
            required
            value={values.radiusMeters}
            onChange={(event) => update('radiusMeters', event.target.value)}
          />
        </label>
      </fieldset>

      <div className="form-actions">
        <button className="button button-primary" type="submit">
          Search tickets
        </button>
        <button className="button button-quiet" type="button" onClick={reset}>
          Reset
        </button>
        {disabled && <span className="subtle-copy">A new search will replace the current request.</span>}
      </div>
    </form>
  )
}
