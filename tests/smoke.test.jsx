import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import App from '../src/App.jsx'

// Renders the whole app in jsdom — catches import/runtime/render crashes that pure
// unit tests don't, without needing a browser. With no habits the app shows the
// onboarding screen; picking starters and tapping the CTA seeds them, then Today renders.

describe('App smoke', () => {
  beforeEach(() => localStorage.clear())

  const startWith = (names) => {
    names.forEach((n) => fireEvent.click(screen.getByText(n)))
    fireEvent.click(screen.getByText(new RegExp(`Start tracking ${names.length} habit`)))
  }

  it('renders the brand and the onboarding empty state', () => {
    render(<App />)
    expect(screen.getByText('tally')).toBeInTheDocument()
    expect(screen.getByText('Pick a few to start')).toBeInTheDocument()
  })

  it('a single tap secures the day for a count habit (forgiving target)', () => {
    const { container } = render(<App />)
    startWith(['Drink water'])
    fireEvent.click(container.querySelector('.count__btn--inc'))
    // 1 of 8 is far from the goal, but one tap already secures the day:
    expect(container.querySelector('.count__num').textContent).toBe('1')
    expect(screen.getByText('Drink water').closest('.hcard')).toHaveClass('is-done')
  })

  it('seeds the chosen starter habits and shows them on Today', () => {
    render(<App />)
    startWith(['Read', 'Meditate'])
    expect(screen.getByText('Read')).toBeInTheDocument()
    expect(screen.getByText('Meditate')).toBeInTheDocument()
  })

  it('marking a habit done gives it a streak of 1', () => {
    render(<App />)
    startWith(['Meditate'])
    fireEvent.click(screen.getByRole('button', { name: /done/i }))
    expect(screen.getAllByText('1').length).toBeGreaterThan(0)
  })
})
