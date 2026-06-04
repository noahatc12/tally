import { describe, it, expect } from 'vitest'
import { isDue, evaluateWeek } from '../../src/lib/scheduling.js'
import { habit, comp, TODAY } from '../fixtures/sample.js'

describe('scheduling — per-day', () => {
  it('daily is due every day on/after createdAt, false before', () => {
    const h = habit({ schedule: { kind: 'daily' } })
    expect(isDue(h, '2026-05-31')).toBe(false) // before creation
    expect(isDue(h, '2026-06-01')).toBe(true)
    expect(isDue(h, '2026-06-15')).toBe(true)
  })

  it('everyNDays is due on day 0, N, 2N from createdAt', () => {
    const h = habit({ schedule: { kind: 'everyNDays', everyN: 3 } })
    expect(isDue(h, '2026-06-01')).toBe(true) // day 0
    expect(isDue(h, '2026-06-02')).toBe(false)
    expect(isDue(h, '2026-06-03')).toBe(false)
    expect(isDue(h, '2026-06-04')).toBe(true) // day 3
    expect(isDue(h, '2026-06-07')).toBe(true) // day 6
  })

  it('weekdays is due only on listed weekdays (0=Sun..6=Sat)', () => {
    // 2026-06-01 is a Monday(1); 06-02 Tue(2); 06-03 Wed(3)
    const h = habit({ schedule: { kind: 'weekdays', weekdays: [1, 3, 5] } })
    expect(isDue(h, '2026-06-01')).toBe(true) // Mon
    expect(isDue(h, '2026-06-02')).toBe(false) // Tue
    expect(isDue(h, '2026-06-03')).toBe(true) // Wed
  })
})

describe('scheduling — timesPerWeek quota', () => {
  const week = '2026-05-31' // Sunday of the week containing CREATED (Mon 06-01)

  it('quota met when done >= target in a fully past week', () => {
    const h = habit({ schedule: { kind: 'timesPerWeek', timesPerWeek: 3 } })
    const c = comp([['2026-06-01', 'done'], ['2026-06-02', 'done'], ['2026-06-03', 'done']])
    expect(evaluateWeek(h, week, c, TODAY).status).toBe('met')
  })

  it('quota unmet when done < target in a fully past week', () => {
    const h = habit({ schedule: { kind: 'timesPerWeek', timesPerWeek: 3 } })
    const c = comp([['2026-06-01', 'done'], ['2026-06-02', 'done']])
    expect(evaluateWeek(h, week, c, TODAY).status).toBe('unmet')
  })

  it('the current/future week is never a miss (in-progress)', () => {
    const h = habit({ schedule: { kind: 'timesPerWeek', timesPerWeek: 3 } })
    const thisWeek = '2026-06-28' // Sunday of the week containing TODAY (2026-07-01)
    expect(evaluateWeek(h, thisWeek, {}, TODAY).status).toBe('in-progress')
  })

  it('a skip buys back one required rep (rest cannot manufacture a miss)', () => {
    const h = habit({ schedule: { kind: 'timesPerWeek', timesPerWeek: 3 } })
    // 2 done + 1 skip -> effective target 2, done 2 -> met
    const c = comp([['2026-06-01', 'done'], ['2026-06-02', 'done'], ['2026-06-03', 'skip']])
    const res = evaluateWeek(h, week, c, TODAY)
    expect(res.target).toBe(2)
    expect(res.status).toBe('met')
  })
})
