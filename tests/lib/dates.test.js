import { describe, it, expect } from 'vitest'
import {
  toKey,
  fromKey,
  getWeekday,
  addDays,
  diffDays,
  eachDay,
  startOfWeek,
  startOfMonthKey,
} from '../../src/lib/dates.js'

describe('dates', () => {
  it('toKey uses the LOCAL calendar date, not UTC (no evening drift)', () => {
    // 11:30pm local on Mar 8 must still key as Mar 8, even though it is Mar 9 in UTC
    // for anyone west of GMT.
    const d = new Date(2026, 2, 8, 23, 30)
    expect(toKey(d)).toBe('2026-03-08')
  })

  it('fromKey parses to local midnight, not UTC midnight', () => {
    const d = fromKey('2026-03-08')
    expect(d.getFullYear()).toBe(2026)
    expect(d.getMonth()).toBe(2) // March
    expect(d.getDate()).toBe(8)
  })

  it('addDays crosses a DST spring-forward boundary correctly', () => {
    // US DST begins 2026-03-08; calendar-field math must still advance one day.
    expect(addDays('2026-03-07', 1)).toBe('2026-03-08')
    expect(addDays('2026-03-08', 1)).toBe('2026-03-09')
  })

  it('diffDays counts whole calendar days inclusive of DST', () => {
    expect(diffDays('2026-03-01', '2026-03-31')).toBe(30)
    expect(diffDays('2026-03-31', '2026-03-01')).toBe(-30)
  })

  it('eachDay is an inclusive ascending range', () => {
    expect(eachDay('2026-06-01', '2026-06-03')).toEqual(['2026-06-01', '2026-06-02', '2026-06-03'])
    expect(eachDay('2026-06-03', '2026-06-01')).toEqual([])
  })

  it('startOfWeek backs up to Sunday', () => {
    expect(getWeekday(startOfWeek('2026-06-10'))).toBe(0)
    expect(diffDays(startOfWeek('2026-06-10'), '2026-06-10')).toBeLessThan(7)
  })

  it('startOfMonthKey returns the first of the month', () => {
    expect(startOfMonthKey('2026-06-17')).toBe('2026-06-01')
  })
})
