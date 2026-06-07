// The ONLY module that touches localStorage. JSON (de)serialization, corruption
// tolerance, and a schema-migration chain. No domain logic lives here.

import { emptyMeta, SCHEMA_VERSION } from './factories.js'

export const KEYS = { habits: 'habits', completions: 'completions', meta: 'meta', timers: 'timers' }

export function isAvailable() {
  try {
    const k = '__ht_probe__'
    localStorage.setItem(k, '1')
    localStorage.removeItem(k)
    return true
  } catch {
    return false
  }
}

export function readRaw(key) {
  try {
    const v = localStorage.getItem(key)
    return v == null ? null : JSON.parse(v)
  } catch {
    // Corrupt JSON or no storage -> degrade to null rather than white-screening.
    return null
  }
}

export function writeRaw(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (err) {
    // Quota exceeded / private mode. Surface for callers that care; never crash render.
    console.warn(`[storage] failed to write "${key}":`, err)
  }
}

// Ordered migration chain. Each step upgrades state from version N to N+1 and is a
// pure function of state. v1 is the baseline (no prior versions), so the chain is
// currently a no-op that just stamps the current version.
const MIGRATIONS = {
  // 1: (state) => ({ ...state, meta: { ...state.meta, /* new field */ } }),
}

export function migrate(state) {
  let next = state
  let version = next.meta?.schemaVersion ?? 0
  while (version < SCHEMA_VERSION) {
    const step = MIGRATIONS[version + 1]
    if (step) next = step(next)
    version += 1
  }
  return { ...next, meta: { ...emptyMeta(), ...next.meta, schemaVersion: SCHEMA_VERSION } }
}

export function loadAll() {
  const habits = readRaw(KEYS.habits) ?? []
  const completions = readRaw(KEYS.completions) ?? {}
  const meta = readRaw(KEYS.meta) ?? emptyMeta()
  // Running stopwatch sessions: { [habitId]: { startedAt } }. Persisted so a timer
  // keeps running across a reload / app close (the point of timing a real activity).
  const timers = readRaw(KEYS.timers) ?? {}
  return { ...migrate({ habits, completions, meta }), timers }
}

export function saveHabits(habits) {
  writeRaw(KEYS.habits, habits)
}
export function saveCompletions(completions) {
  writeRaw(KEYS.completions, completions)
}
export function saveMeta(meta) {
  writeRaw(KEYS.meta, meta)
}
export function saveTimers(timers) {
  writeRaw(KEYS.timers, timers)
}

export function saveAll({ habits, completions, meta, timers }) {
  saveHabits(habits)
  saveCompletions(completions)
  saveMeta(meta)
  if (timers) saveTimers(timers)
}
