import { describe, it, expect } from 'vitest'
import { pickQuote, QUOTES } from '../../src/lib/quotes.js'
import { addDays } from '../../src/lib/dates.js'

describe('quotes', () => {
  it('returns a valid quote for a date', () => {
    const q = pickQuote('2026-06-04')
    expect(QUOTES).toContainEqual(q)
    expect(typeof q.text).toBe('string')
    expect(q.text.length).toBeGreaterThan(0)
  })

  it('is deterministic for the same day', () => {
    expect(pickQuote('2026-06-04')).toBe(pickQuote('2026-06-04'))
  })

  it('advances to a different quote the next day', () => {
    const a = pickQuote('2026-06-04')
    const b = pickQuote(addDays('2026-06-04', 1))
    expect(a).not.toBe(b)
  })
})
