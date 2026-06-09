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

// Best-effort emoji -> Lucide iconName, so habits created before the icon picker keep a
// glyph instead of dropping to a monogram. Unmapped emoji fall through to the monogram.
const EMOJI_TO_ICON = {
  '💪': 'Dumbbell', '📖': 'BookOpen', '🧘': 'Sparkles', '💧': 'Droplet', '🏃': 'Footprints',
  '🥗': 'Salad', '😴': 'Moon', '🧹': 'Brush', '✍️': 'PenLine', '🎯': 'Target', '🎸': 'Guitar',
  '💰': 'Wallet', '🧠': 'Brain', '🦷': 'Smile', '🚭': 'Cigarette', '☕': 'Coffee', '🌱': 'Sprout',
  '🛏️': 'BedDouble', '📱': 'Phone', '🧴': 'Bath', '🐕': 'Dog', '🙏': 'Hand', '🎨': 'Palette',
  '🧺': 'WashingMachine', '⏰': 'AlarmClock', '📵': 'Phone', '🥦': 'Carrot', '🚴': 'Bike',
  '🏊': 'Waves', '⛰️': 'Mountain', '📓': 'NotebookPen', '🎹': 'Music',
}

// Themes the redesign (step 2) dropped, remapped to the perceptually-closest survivor by
// hue + mode. 'steel' is the theme.js id for the palette the engine keys as 'slatemono';
// remap so a Steel pick made via the old modal renders instead of falling back to Native.
const THEME_REMAP = {
  forest: 'pine', midnight: 'slate', mint: 'sage', mocha: 'bark',
  plum: 'heather', rose: 'clay', sky: 'fog', steel: 'slatemono',
}

// Ordered migration chain. Each step upgrades state from version N to N+1 and is a pure
// function of state.
const MIGRATIONS = {
  // v1 -> v2: introduce meta.direction (the "Look"). Map the two base presets to their
  // matching Look — Nocturne (theme 'dark') is the night edition of Ledger -> C; everything
  // else (Ledger / curated lights / custom) starts on Ledger -> A. The emptyMeta merge below
  // would backfill 'A' on its own; this step exists so an existing dark user lands on C.
  2: (state) => ({
    ...state,
    meta: { ...state.meta, direction: state.meta?.theme === 'dark' ? 'C' : 'A' },
  }),
  // v2 -> v3: the faithful redesign. Backfill iconName from the legacy emoji, ensure tod
  // exists, convert anchors stored by habit-id to the referenced habit's name (Detail now
  // renders "after <name>"), and remap any theme id the redesign dropped to a close survivor.
  3: (state) => {
    const habits = (state.habits || []).map((h) => {
      const patch = {}
      if (!h.iconName && h.icon && EMOJI_TO_ICON[h.icon]) patch.iconName = EMOJI_TO_ICON[h.icon]
      if (h.tod === undefined) patch.tod = null
      return Object.keys(patch).length ? { ...h, ...patch } : h
    })
    const nameById = new Map(habits.map((h) => [h.id, h.name]))
    const repaired = habits.map((h) => (h.anchor && nameById.has(h.anchor) ? { ...h, anchor: nameById.get(h.anchor) } : h))
    const theme = THEME_REMAP[state.meta?.theme] || state.meta?.theme
    return { ...state, habits: repaired, meta: { ...state.meta, theme } }
  },
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
