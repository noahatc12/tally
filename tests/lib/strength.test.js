import { describe, it, expect } from 'vitest'
import { computeStrength } from '../../src/lib/strength.js'
import { habit, comp, runOf } from '../fixtures/sample.js'

describe('strength — forgiving EWMA', () => {
  it('a brand-new habit with no resolved events reads as the seed (50)', () => {
    const h = habit({ schedule: { kind: 'daily' } })
    // today === createdAt, due but unmarked -> pending -> excluded
    expect(computeStrength(h, {}, '2026-06-01')).toBe(50)
  })

  it('a long all-done run approaches 100', () => {
    const h = habit({ schedule: { kind: 'daily' } })
    const c = comp(runOf('2026-06-01', 30, 'done'))
    expect(computeStrength(h, c, '2026-06-30')).toBeGreaterThan(90)
  })

  it('a long run then ONE miss is a small dip, not a crash', () => {
    const h = habit({ schedule: { kind: 'daily' } })
    const c = comp([...runOf('2026-06-01', 30, 'done'), ['2026-07-01', 'missed']])
    const s = computeStrength(h, c, '2026-07-01')
    expect(s).toBeGreaterThan(85)
    expect(s).toBeLessThan(95)
  })

  it('two misses dip further but still recoverable', () => {
    const h = habit({ schedule: { kind: 'daily' } })
    const c = comp([...runOf('2026-06-01', 30, 'done'), ['2026-07-01', 'missed'], ['2026-07-02', 'missed']])
    expect(computeStrength(h, c, '2026-07-02')).toBeGreaterThan(70)
  })

  it('a skip is a no-op (carries strength forward unchanged)', () => {
    const h = habit({ schedule: { kind: 'daily' } })
    // Events: done, skip, done. With seed 50, alpha 0.12:
    //   50 -> done 56 -> skip 56 (no update) -> done 61.28 -> round 61.
    // If skip counted as a miss it would be 55; as a done, higher. 61 pins the no-op.
    const c = comp([['2026-06-01', 'done'], ['2026-06-02', 'skip'], ['2026-06-03', 'done']])
    expect(computeStrength(h, c, '2026-06-03')).toBe(61)
  })

  it('today-unmarked does not change strength (pending excluded)', () => {
    const h = habit({ schedule: { kind: 'daily' } })
    const c = comp(runOf('2026-06-01', 3, 'done'))
    expect(computeStrength(h, c, '2026-06-03')).toBe(computeStrength(h, c, '2026-06-04'))
  })
})
