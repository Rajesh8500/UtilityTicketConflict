import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ConflictSearchForm } from './ConflictSearchForm'

describe('ConflictSearchForm', () => {
  it('renders labeled bbox, filter, radius, search, and reset controls', () => {
    render(<ConflictSearchForm onSearch={vi.fn()} onReset={vi.fn()} disabled={false} />)

    expect(screen.getByLabelText(/minimum longitude/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/minimum latitude/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/maximum longitude/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/maximum latitude/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/station code/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/utility type/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/radius/i)).toHaveValue(250)
    expect(screen.getByRole('button', { name: /search tickets/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /reset/i })).toBeInTheDocument()
  })

  it('submits the entered search values', async () => {
    const onSearch = vi.fn()
    const user = userEvent.setup()
    render(<ConflictSearchForm onSearch={onSearch} onReset={vi.fn()} disabled={false} />)

    await user.clear(screen.getByRole('textbox', { name: 'Station code' }))
    await user.type(screen.getByRole('textbox', { name: 'Station code' }), 'HLTNW02')
    await user.click(screen.getByRole('button', { name: /search tickets/i }))

    expect(onSearch).toHaveBeenCalledWith({
      minLng: -80,
      minLat: 43.18,
      maxLng: -79.65,
      maxLat: 43.38,
      stationCode: 'HLTNW02',
      utilityType: undefined,
      radiusMeters: 250,
    })
  })

  it('resets values to the initial search', async () => {
    const user = userEvent.setup()
    const onReset = vi.fn()
    render(<ConflictSearchForm onSearch={vi.fn()} onReset={onReset} disabled={false} />)
    const station = screen.getByRole('textbox', { name: 'Station code' })
    await user.type(station, 'HLTNW02')
    await user.click(screen.getByRole('button', { name: /reset/i }))
    expect(station).toHaveValue('')
    expect(screen.getByLabelText(/radius/i)).toHaveValue(250)
    expect(onReset).toHaveBeenCalledOnce()
  })
})
