// Current + longest streak with the forgiving rules:
//   done       -> extends the run
//   skip       -> transparent (carries the run; never breaks it)
//   missed     -> breaks (run resets to 0)
//   today, due, unmarked -> pending: transparent, doesn't break, doesn't yet count
// Non-due days are simply not in the iteration, so they are neutral by construction.
//
// Per-day schedules count in days; timesPerWeek counts in whole weeks.

import { diffDays, eachDay, startOfWeek, addDays } from './dates.js'
import { isDue, getState, evaluateWeek, isQuota } from './scheduling.js'

function createdKey(habit) {
  return habit.createdAt.slice(0, 10)
}

// Resolve a due day to one of: 'done' | 'skip' | 'miss' | 'pending'.
export function resolveDay(habit, key, completions, today) {
  const st = getState(completions, key, habit.id)
  if (st === 'done') return 'done'
  if (st === 'skip') return 'skip'
  if (st === 'missed') return 'miss'
  // Unmarked: a past due day is a miss; today (or future) is pending.
  return diffDays(key, today) > 0 ? 'miss' : 'pending'
}

function runFromEvents(events) {
  // events: array of 'done' | 'skip' | 'miss' | 'pending' in chronological order.
  let run = 0
  let longest = 0
  for (const e of events) {
    if (e === 'done') {
      run += 1
      if (run > longest) longest = run
    } else if (e === 'miss') {
      run = 0
    }
    // 'skip' and 'pending' carry the run unchanged.
  }
  return { current: run, longest }
}

// Chronological event tokens ('done'|'skip'|'miss'|'pending') for a quota habit's
// weeks (pre-creation weeks dropped).
export function weekEvents(habit, completions, today) {
  const created = createdKey(habit)
  if (diffDays(created, today) < 0) return []
  const firstWeek = startOfWeek(created)
  const lastWeek = startOfWeek(today)
  const events = []
  for (let wk = firstWeek; diffDays(wk, lastWeek) >= 0; wk = addDays(wk, 7)) {
    const { status } = evaluateWeek(habit, wk, completions, today)
    if (status === 'pre-creation') continue
    if (status === 'met') events.push('done')
    else if (status === 'unmet') events.push('miss')
    else events.push('pending') // in-progress
  }
  return events
}

// Chronological event tokens for a per-day habit's due days.
export function dayEvents(habit, completions, today) {
  const created = createdKey(habit)
  if (diffDays(created, today) < 0) return []
  return eachDay(created, today)
    .filter((k) => isDue(habit, k, completions, today))
    .map((k) => resolveDay(habit, k, completions, today))
}

export function streakEvents(habit, completions, today) {
  return isQuota(habit) ? weekEvents(habit, completions, today) : dayEvents(habit, completions, today)
}

export function computeStreaks(habit, completions, today) {
  const unit = isQuota(habit) ? 'weeks' : 'days'
  return { ...runFromEvents(streakEvents(habit, completions, today)), unit }
}
