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
// intensity: 0 (not done) or 1 (done); quantitative habits can later map value/target.
export function heatmapData(habit, completions, startKey, endKey, today = endKey) {
  return eachDay(startKey, endKey).map((date) => {
    const state = getState(completions, date, habit.id) || 'none'
    const due = isDue(habit, date, completions, today)
    return { date, state, due, intensity: state === 'done' ? 1 : 0 }
  })
}
