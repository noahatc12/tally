// Formatting for time-based (duration) habits. A duration habit stores its logged
// time as MINUTES in the completion `value` (a number, possibly fractional because
// the stopwatch accumulates seconds). Display always rounds to whole minutes.

// Minutes -> "45 min" / "1h 05m" (or long form "1 hr 5 min").
export function formatDuration(min, { long = false } = {}) {
  const total = Math.max(0, Math.round(min || 0))
  const h = Math.floor(total / 60)
  const m = total % 60
  if (h === 0) return long ? `${m} min` : `${m} min`
  if (m === 0) return long ? `${h} hr` : `${h}h`
  return long ? `${h} hr ${m} min` : `${h}h ${String(m).padStart(2, '0')}m`
}

// Elapsed milliseconds -> live stopwatch "MM:SS" (or "H:MM:SS" past an hour).
export function formatClock(ms) {
  const total = Math.max(0, Math.floor((ms || 0) / 1000))
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  const mm = String(m).padStart(2, '0')
  const ss = String(s).padStart(2, '0')
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`
}
