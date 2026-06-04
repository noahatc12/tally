import { createHabit } from '../../src/lib/factories.js'
import { addDays } from '../../src/lib/dates.js'

// Fixed reference points so every test is deterministic.
export const CREATED = '2026-06-01' // a Monday
export const CREATED_ISO = '2026-06-01T08:00:00.000Z'
export const TODAY = '2026-07-01' // well after CREATED so past weeks are fully elapsed

export function habit(overrides = {}, id = 'h1') {
  return createHabit({ name: 'Test', schedule: { kind: 'daily' }, ...overrides }, { id, createdAt: CREATED_ISO })
}

// entries: array of [dateKey, state] (or [dateKey, state, value]) for a single habit id.
export function comp(entries, id = 'h1') {
  const c = {}
  for (const [date, state, value] of entries) {
    c[date] = c[date] || {}
    c[date][id] = value === undefined ? { state } : { state, value }
  }
  return c
}

// n consecutive days of the same state starting at startKey.
export function runOf(startKey, n, state) {
  const out = []
  let k = startKey
  for (let i = 0; i < n; i++) {
    out.push([k, state])
    k = addDays(k, 1)
  }
  return out
}
