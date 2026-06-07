// Completion-rate and heatmap data. The defining rule: SKIPS are excluded from the
// denominator (an intentional skip is neither a success nor a failure), as are
// today-unmarked and future due days (not yet failable).

import { eachDay, startOfWeek, startOfMonthKey, addDays, diffDays } from './dates.js'
import { isDue, getState, evaluateWeek, isQuota } from './scheduling.js'
import { resolveDay } from './streaks.js'

// rate = done / eligible, where eligible = done + missed (skips/pending excluded).
// rate is null when eligible === 0 (UI shows "—").
export function completionRate(habit, completions, startKey, endKey, today) {
  let done = 0
  let missed = 0

  if (isQuota(habit)) {
    const firstWeek = startOfWeek(startKey)
    const lastWeek = startOfWeek(endKey)
    for (let wk = firstWeek; diffDays(wk, lastWeek) >= 0; wk = addDays(wk, 7)) {
      const { status } = evaluateWeek(habit, wk, completions, today)
      if (status === 'met') done++
      else if (status === 'unmet') missed++
    }
  } else {
    for (const key of eachDay(startKey, endKey)) {
      if (!isDue(habit, key, completions, today)) continue
      const r = resolveDay(habit, key, completions, today)
      if (r === 'done') done++
      else if (r === 'miss') missed++
    }
  }

  const eligible = done + missed
  return { rate: eligible === 0 ? null : done / eligible, done, missed, eligible }
}

export function rateForWindow(habit, completions, windowKind, today) {
  const startKey = windowKind === 'month' ? startOfMonthKey(today) : startOfWeek(today)
  return completionRate(habit, completions, startKey, today, today)
}

// One entry per calendar day in [startKey, endKey] for the v2 heatmap.
// intensity: 0 (not done) or 1 (done). `value` carries the logged amount (count or
// minutes) so measured/duration heatmaps can ramp shade by value/target.
export function heatmapData(habit, completions, startKey, endKey, today = endKey) {
  return eachDay(startKey, endKey).map((date) => {
    const state = getState(completions, date, habit.id) || 'none'
    const due = isDue(habit, date, completions, today)
    const value = completions[date]?.[habit.id]?.value || 0
    return { date, state, due, intensity: state === 'done' ? 1 : 0, value }
  })
}

// Aggregate logged values (counts or minutes) for measured/duration habits over a
// window. total = sum of values on logged days; daysLogged = days with value > 0;
// avg = mean over logged days. Skipped days are excluded.
export function valueTotals(habit, completions, startKey, endKey) {
  let total = 0
  let daysLogged = 0
  for (const key of eachDay(startKey, endKey)) {
    const entry = completions[key]?.[habit.id]
    if (!entry || entry.state === 'skip') continue
    const v = entry.value || 0
    if (v > 0) {
      total += v
      daysLogged++
    }
  }
  return { total, daysLogged, avg: daysLogged ? total / daysLogged : 0 }
}
