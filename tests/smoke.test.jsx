import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import App from '../src/App.jsx'

// Renders the whole app in jsdom — catches import/runtime/render crashes that pure
// unit tests don't, without needing a browser.
describe('App smoke', () => {
  beforeEach(() => localStorage.clear())

  it('renders the header and the empty state', () => {
    render(<App />)
    expect(screen.getByText('Habits')).toBeInTheDocument()
    expect(screen.getByText('Start one small habit')).toBeInTheDocument()
  })

  it('seeds example habits and shows them', () => {
    render(<App />)
    fireEvent.click(screen.getByText('Add a few examples'))
    expect(screen.getByText('Strength training')).toBeInTheDocument()
    expect(screen.getByText('Read')).toBeInTheDocument()
  })

  it('marking a habit done updates its streak', () => {
    render(<App />)
    fireEvent.click(screen.getByText('Add a few examples'))
    // "Read" is a daily habit -> due today -> appears with a Done button.
    const doneButtons = screen.getAllByRole('button', { name: /done/i })
    fireEvent.click(doneButtons[doneButtons.length - 1])
    // At least one streak badge should now read 1.
    expect(screen.getAllByText('1').length).toBeGreaterThan(0)
  })
})
