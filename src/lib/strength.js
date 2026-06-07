// Habit strength: a 0-100 exponentially-weighted moving average of completions —
// the same exponential smoothing used for volatility/returns in finance. It is a
// more honest progress signal than a fragile streak count.
//
//   S_0 = seed (50)  -> a brand-new habit reads neither failed nor perfect
//   per resolved event i:  S_i = (1 - alpha) * S_{i-1} + alpha * c_i
//     done    -> c = 100
//     missed  -> c = 0   (a past unmarked due day resolves to a miss)
//     skip    -> no update (S carries forward; consistent with skips being neutral)
//     pending -> excluded entirely (today-unmarked / in-progress week)
//
// With alpha = 0.12 the memory is long: a single miss after a ~100 run drops S to
// 0.88*100 + 0.12*0 = 88 — a dip, not a crash. This is the forgiving model.

import { streakEvents, datedStreakEvents } from './streaks.js'

export function computeStrength(habit, completions, today, opts = {}) {
  const alpha = opts.alpha ?? 0.12
  const seed = opts.seed ?? 50

  let s = seed
  for (const e of streakEvents(habit, completions, today)) {
    if (e === 'done') s = (1 - alpha) * s + alpha * 100
    else if (e === 'miss') s = (1 - alpha) * s + alpha * 0
    // 'skip' and 'pending' do not update s.
  }
  return Math.round(s)
}

// The strength trajectory over time, for the trend chart. One point per RESOLVED
// event (done/miss; skip/pending never move strength and emit no point), each tagged
// with the event's date key. A leading seed point (at the habit's creation day) gives
// the curve an honest starting baseline. `s` accumulates unrounded so the final point
// equals computeStrength() exactly; only the displayed `value` is rounded.
export function strengthSeries(habit, completions, today, opts = {}) {
  const alpha = opts.alpha ?? 0.12
  const seed = opts.seed ?? 50

  const events = datedStreakEvents(habit, completions, today)
  if (events.length === 0) return []

  let s = seed
  const points = [{ key: habit.createdAt.slice(0, 10), value: Math.round(s) }]
  for (const { key, event } of events) {
    if (event === 'done') s = (1 - alpha) * s + alpha * 100
    else if (event === 'miss') s = (1 - alpha) * s + alpha * 0
    else continue // 'skip' / 'pending' carry strength forward and emit no point
    points.push({ key, value: Math.round(s) })
  }
  return points
}
