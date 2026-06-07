import { describe, it, expect } from 'vitest'
import { completionRate, valueTotals } from '../../src/lib/stats.js'
import { habit, comp } from '../fixtures/sample.js'

describe('stats — completion rate', () => {
  it('excludes skips from the denominator', () => {
    const h = habit({ schedule: { kind: 'daily' } })
    const c = comp([
      ['2026-06-01', 'done'],
      ['2026-06-02', 'done'],
      ['2026-06-03', 'skip'],
      ['2026-06-04', 'missed'],
    ])
    const r = completionRate(h, c, '2026-06-01', '2026-06-04', '2026-06-05')
    expect(r.done).toBe(2)
    expect(r.missed).toBe(1)
    expect(r.eligible).toBe(3) // skip excluded
    expect(r.rate).toBeCloseTo(2 / 3)
  })

  it('returns null rate when the denominator is zero (all skips)', () => {
    const h = habit({ schedule: { kind: 'daily' } })
    const c = comp([['2026-06-01', 'skip'], ['2026-06-02', 'skip']])
    const r = completionRate(h, c, '2026-06-01', '2026-06-02', '2026-06-05')
    expect(r.eligible).toBe(0)
    expect(r.rate).toBeNull()
  })

  it('excludes today-unmarked and future due days from the denominator', () => {
    const h = habit({ schedule: { kind: 'daily' } })
    const c = comp([
      ['2026-06-01', 'done'],
      ['2026-06-02', 'done'],
      ['2026-06-03', 'done'],
    ])
    // window runs to 06-10 but today is 06-04: 06-04 (pending) and 06-05..06-10 (future)
    // must all be excluded, leaving only the 3 resolved done days.
    const r = completionRate(h, c, '2026-06-01', '2026-06-10', '2026-06-04')
    expect(r.eligible).toBe(3)
    expect(r.rate).toBe(1)
  })
})

describe('stats — valueTotals (measured / duration)', () => {
  it('sums logged values and averages over logged days, ignoring skips', () => {
    const h = habit({ type: 'duration', target: { amount: 30 } })
    const c = comp([
      ['2026-06-01', 'done', 20],
      ['2026-06-02', 'done', 40],
      ['2026-06-03', 'skip'],
      ['2026-06-04', 'done', 30],
    ])
    const t = valueTotals(h, c, '2026-06-01', '2026-06-04')
    expect(t.total).toBe(90)
    expect(t.daysLogged).toBe(3)
    expect(t.avg).toBe(30)
  })

  it('is zero when nothing is logged', () => {
    const h = habit({ type: 'duration', target: { amount: 30 } })
    const t = valueTotals(h, {}, '2026-06-01', '2026-06-07')
    expect(t).toEqual({ total: 0, daysLogged: 0, avg: 0 })
  })
})
