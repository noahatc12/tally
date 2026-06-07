import { describe, it, expect } from 'vitest'
import { computeStrength, strengthSeries } from '../../src/lib/strength.js'
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

describe('strengthSeries — trajectory for the trend chart', () => {
  it('a brand-new habit (no resolved events) is just the seed baseline point', () => {
    const h = habit({ schedule: { kind: 'daily' } })
    const series = strengthSeries(h, {}, '2026-06-01')
    expect(series).toEqual([{ key: '2026-06-01', value: 50 }])
  })

  it('a done run rises monotonically; one point per done plus the seed', () => {
    const h = habit({ schedule: { kind: 'daily' } })
    const c = comp(runOf('2026-06-01', 3, 'done'))
    const series = strengthSeries(h, c, '2026-06-03')
    // seed 50 -> 56 -> 61.28(61) -> 65.93(66)
    expect(series.map((p) => p.value)).toEqual([50, 56, 61, 66])
    expect(series[0].key).toBe('2026-06-01') // leading seed at creation day
  })

  it('the last point equals computeStrength() exactly (shared accumulator)', () => {
    const h = habit({ schedule: { kind: 'daily' } })
    const c = comp([...runOf('2026-06-01', 12, 'done'), ['2026-06-13', 'missed'], ['2026-06-14', 'done']])
    const series = strengthSeries(h, c, '2026-06-14')
    expect(series[series.length - 1].value).toBe(computeStrength(h, c, '2026-06-14'))
  })

  it('skips emit no point and do not move strength', () => {
    const h = habit({ schedule: { kind: 'daily' } })
    const c = comp([['2026-06-01', 'done'], ['2026-06-02', 'skip'], ['2026-06-03', 'done']])
    const series = strengthSeries(h, c, '2026-06-03')
    expect(series.map((p) => p.value)).toEqual([50, 56, 61]) // 3 points, not 4
  })

  it('a miss after a high run dips the last point below the peak', () => {
    const h = habit({ schedule: { kind: 'daily' } })
    const c = comp([...runOf('2026-06-01', 20, 'done'), ['2026-06-21', 'missed']])
    const series = strengthSeries(h, c, '2026-06-21')
    const values = series.map((p) => p.value)
    const peak = Math.max(...values)
    expect(values[values.length - 1]).toBeLessThan(peak)
  })

  it('quota habits emit one point per elapsed week, keyed by week start', () => {
    const h = habit({ schedule: { kind: 'timesPerWeek', timesPerWeek: 2 } })
    const c = comp([
      ['2026-06-01', 'done'], ['2026-06-02', 'done'], // week of 05-31: met
      ['2026-06-08', 'done'], ['2026-06-09', 'done'], // week of 06-07: met
    ])
    const series = strengthSeries(h, c, '2026-06-15')
    // seed + 2 elapsed met weeks (the 06-14 week is in-progress -> pending -> no point)
    expect(series.map((p) => p.key)).toEqual(['2026-06-01', '2026-05-31', '2026-06-07'])
  })
})
