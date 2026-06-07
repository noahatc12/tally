import { describe, it, expect } from 'vitest'
import { formatDuration, formatClock } from '../../src/lib/duration.js'

describe('formatDuration', () => {
  it('shows whole minutes under an hour', () => {
    expect(formatDuration(0)).toBe('0 min')
    expect(formatDuration(5)).toBe('5 min')
    expect(formatDuration(59)).toBe('59 min')
  })

  it('rounds fractional minutes (stopwatch precision)', () => {
    expect(formatDuration(29.4)).toBe('29 min')
    expect(formatDuration(29.6)).toBe('30 min')
  })

  it('shows hours and minutes past an hour', () => {
    expect(formatDuration(60)).toBe('1h')
    expect(formatDuration(90)).toBe('1h 30m')
    expect(formatDuration(125)).toBe('2h 05m')
  })

  it('long form spells out the units', () => {
    expect(formatDuration(90, { long: true })).toBe('1 hr 30 min')
    expect(formatDuration(45, { long: true })).toBe('45 min')
  })

  it('never goes negative', () => {
    expect(formatDuration(-10)).toBe('0 min')
  })
})

describe('formatClock', () => {
  it('formats elapsed milliseconds as MM:SS', () => {
    expect(formatClock(0)).toBe('00:00')
    expect(formatClock(65 * 1000)).toBe('01:05')
    expect(formatClock(9 * 1000)).toBe('00:09')
  })

  it('adds an hours field past 60 minutes', () => {
    expect(formatClock((3600 + 125) * 1000)).toBe('1:02:05')
  })
})
