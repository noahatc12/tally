// "Is this habit due on this day?" plus the weekly-quota model for timesPerWeek.
//
// daily / weekdays / everyNDays are deterministic per-day schedules. timesPerWeek
// is NOT a per-day schedule — it is a quota of N completions per calendar week, so
// asking "is it due Tuesday?" is ill-posed. We model quota habits at week
// granularity via evaluateWeek(); a "miss" for them is a fully-elapsed week below
// the (skip-adjusted) target, never a single day.

import { getWeekday, diffDays, eachDay, startOfWeek, addDays } from './dates.js'

function createdKey(habit) {
  // createdAt is stored as an ISO timestamp; we only care about its local day.
  // It was produced by todayKey()-style logic, so the date portion is the local key.
  return habit.createdAt.slice(0, 10)
}

// State recorded for a habit on a day, or undefined.
export function getState(completions, dateKey, habitId) {
  return completions[dateKey]?.[habitId]?.state
}

// Deterministic per-day due check (daily / weekdays / everyNDays).
// timesPerWeek returns true while the week's quota is still actionable that day,
// but quota scoring should use evaluateWeek(), not this.
export function isDue(habit, dateKey, completions = {}, today = dateKey) {
  if (habit.archived) return false
  const created = createdKey(habit)
  if (diffDays(created, dateKey) < 0) return false

  const s = habit.schedule || { kind: 'daily' }
  switch (s.kind) {
    case 'daily':
      return true
    case 'weekdays':
      return (s.weekdays || []).includes(getWeekday(dateKey))
    case 'everyNDays': {
      const n = Math.max(1, s.everyN || 1)
      return diffDays(created, dateKey) % n === 0
    }
    case 'timesPerWeek': {
      const wk = evaluateWeek(habit, startOfWeek(dateKey), completions, today)
      return wk.status === 'in-progress' && wk.done < wk.target
    }
    default:
      return true
  }
}

export function dueDaysInRange(habit, startKey, endKey, completions = {}, today = endKey) {
  return eachDay(startKey, endKey).filter((k) => isDue(habit, k, completions, today))
}

// Evaluate one calendar week for a timesPerWeek habit.
// status: "met" | "unmet" | "in-progress" | "pre-creation"
//   - pre-creation: the whole week precedes the habit's creation -> ignored by scorers.
//   - in-progress: the week contains or follows `today` -> never a miss (mirrors
//     "today-unmarked is not a miss").
//   - met/unmet: only for fully-elapsed past weeks.
// done   = count of "done" days in the week.
// target = max(0, timesPerWeek - skips): an intentional skip buys back one required
//   rep so illness/rest cannot manufacture a miss.
export function evaluateWeek(habit, weekStartKey, completions, today, weekStartsOn = 0) {
  const start = startOfWeek(weekStartKey, weekStartsOn)
  const end = addDays(start, 6)
  const created = createdKey(habit)
  const rawTarget = Math.max(1, habit.schedule?.timesPerWeek || 1)

  let done = 0
  let skips = 0
  for (const key of eachDay(start, end)) {
    if (diffDays(created, key) < 0) continue
    const st = getState(completions, key, habit.id)
    if (st === 'done') done++
    else if (st === 'skip') skips++
  }

  const target = Math.max(0, rawTarget - skips)
  const result = { weekStartKey: start, weekEndKey: end, done, target }

  if (diffDays(created, end) < 0) return { ...result, status: 'pre-creation' }
  // Week is current or future if today falls on/before the week's end.
  if (diffDays(today, end) >= 0) return { ...result, status: 'in-progress' }
  return { ...result, status: done >= target ? 'met' : 'unmet' }
}

export function isQuota(habit) {
  return habit.schedule?.kind === 'timesPerWeek'
}
