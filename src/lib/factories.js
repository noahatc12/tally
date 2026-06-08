// Pure constructors / defaults. Kept pure: id and createdAt can be injected so tests
// are deterministic; they default to crypto.randomUUID() / now in real use.

export const SCHEMA_VERSION = 1

export const HABIT_COLORS = [
  '#C7F94B', // lime (dark accent)
  '#E2725B', // terracotta (light accent)
  '#5BA8E2', // blue
  '#B98CE2', // violet
  '#E2B85B', // amber
  '#5BE2A8', // mint
  '#E25B8C', // rose
  '#F4A24B', // orange
  '#7CD6F9', // sky
  '#9AE25B', // green
  '#E25B5B', // red
  '#C0C6CF', // slate
]

// Quick-pick emoji set; the form also accepts any pasted/typed emoji.
export const HABIT_ICONS = [
  '💪', '📖', '🧘', '💧', '🏃', '🥗', '😴', '🧹', '✍️', '🎯', '🎸', '💰',
  '🧠', '🦷', '🚭', '☕', '🌱', '🛏️', '📱', '🧴', '🐕', '🙏', '🎨', '🧺',
  '⏰', '📵', '🥦', '🚴', '🏊', '⛰️', '📓', '🎹',
]

export function uuid() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  // Fallback for very old environments / certain test runners.
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16)
  })
}

export function createHabit(partial = {}, { id, createdAt } = {}) {
  return {
    id: id ?? `habit_${uuid()}`,
    name: partial.name ?? '',
    color: partial.color ?? HABIT_COLORS[0],
    icon: partial.icon ?? HABIT_ICONS[0],
    type: partial.type ?? 'binary', // "binary" | "quantitative"
    target: partial.target ?? null, // quantitative: { amount, unit }
    schedule: partial.schedule ?? { kind: 'daily', weekdays: [1, 2, 3, 4, 5], timesPerWeek: 3, everyN: 2 },
    minimumVersion: partial.minimumVersion ?? '',
    plan: partial.plan ?? { cue: '', time: '', place: '' },
    anchor: partial.anchor ?? null,
    createdAt: createdAt ?? new Date().toISOString(),
    archived: partial.archived ?? false,
  }
}

export function emptyMeta() {
  return {
    schemaVersion: SCHEMA_VERSION,
    points: 0,
    level: 0,
    badges: [],
    freezes: 0,
    theme: 'light', // first-run default = Ledger (light). 'dark' = Nocturne | a custom theme id
    customThemes: [], // [{ id, name, bg, surface, text, accent }]
    font: 'default', // a FONT_OPTIONS id
  }
}
