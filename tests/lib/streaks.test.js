import { describe, it, expect } from 'vitest'
import { computeStreaks } from '../../src/lib/streaks.js'
import { habit, comp, runOf } from '../fixtures/sample.js'

describe('streaks — forgiving rules', () => {
  it('a skip in the middle of a streak does not break it', () => {
    const h = habit({ schedule: { kind: 'daily' } })
    const c = comp([
      ['2026-06-01', 'done'],
      ['2026-06-02', 'done'],
      ['2026-06-03', 'skip'],
      ['2026-06-04', 'done'],
    ])
    const s = computeStreaks(h, c, '2026-06-04')
    expect(s.current).toBe(3)
    expect(s.longest).toBe(3)
  })

  it('one miss breaks current but longest keeps the prior peak', () => {
    const h = habit({ schedule: { kind: 'daily' } })
    const c = comp([
      ...runOf('2026-06-01', 5, 'done'), // 06-01..06-05
      ['2026-06-06', 'missed'],
      ['2026-06-07', 'done'],
    ])
    const s = computeStreaks(h, c, '2026-06-07')
    expect(s.current).toBe(1)
    expect(s.longest).toBe(5)
  })

  it('two consecutive misses both break', () => {
    const h = habit({ schedule: { kind: 'daily' } })
    const c = comp([
      ...runOf('2026-06-01', 3, 'done'),
      ['2026-06-04', 'missed'],
      ['2026-06-05', 'missed'],
      ['2026-06-06', 'done'],
    ])
    const s = computeStreaks(h, c, '2026-06-06')
    expect(s.current).toBe(1)
    expect(s.longest).toBe(3)
  })

  it('empty history is zero', () => {
    const h = habit({ schedule: { kind: 'daily' } })
    const s = computeStreaks(h, {}, '2026-06-05')
    expect(s).toMatchObject({ current: 0, longest: 0 })
  })

  it('today, due and unmarked, is NOT a miss (pending)', () => {
    const h = habit({ schedule: { kind: 'daily' } })
    const c = comp(runOf('2026-06-01', 3, 'done')) // 06-01..06-03 done
    const s = computeStreaks(h, c, '2026-06-04') // 06-04 due, unmarked
    expect(s.current).toBe(3)
  })

  it('non-due days are neutral and do not reset', () => {
    // Mon/Wed/Fri habit; the Tue/Thu gaps must not break the streak.
    const h = habit({ schedule: { kind: 'weekdays', weekdays: [1, 3, 5] } })
    const c = comp([
      ['2026-06-01', 'done'], // Mon
      ['2026-06-03', 'done'], // Wed
      ['2026-06-05', 'done'], // Fri
    ])
    const s = computeStreaks(h, c, '2026-06-05')
    expect(s.current).toBe(3)
    expect(s.longest).toBe(3)
  })

  it('timesPerWeek streaks count in weeks', () => {
    const h = habit({ schedule: { kind: 'timesPerWeek', timesPerWeek: 2 } })
    // week 05-31: 2 done (met); week 06-07: 2 done (met); week 06-14: 1 done (unmet);
    // week 06-21: 2 done (met)
    const c = comp([
      ['2026-06-01', 'done'], ['2026-06-02', 'done'],
      ['2026-06-08', 'done'], ['2026-06-09', 'done'],
      ['2026-06-15', 'done'],
      ['2026-06-22', 'done'], ['2026-06-23', 'done'],
    ])
    const s = computeStreaks(h, c, '2026-06-28') // end of the 06-28 week is current
    expect(s.unit).toBe('weeks')
    expect(s.current).toBe(1) // only the last met week (06-21) after the 06-14 unmet
    expect(s.longest).toBe(2) // 05-31 + 06-07
  })
})
