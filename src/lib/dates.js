// Local-calendar date primitives. Every date in this app is a local "YYYY-MM-DD"
// string (a "key"). We NEVER use toISOString() or new Date("YYYY-MM-DD") because
// those are UTC and drift across the day boundary for anyone west of GMT — a habit
// checked off at 9pm local would land on the wrong day. All math is calendar-field
// based so it is also DST-safe.

const PAD = (n) => String(n).padStart(2, '0')

// Date -> local "YYYY-MM-DD"
export function toKey(date) {
  return `${date.getFullYear()}-${PAD(date.getMonth() + 1)}-${PAD(date.getDate())}`
}

// "YYYY-MM-DD" -> Date at LOCAL midnight (multi-arg constructor is local; the
// string constructor would be parsed as UTC).
export function fromKey(key) {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d)
}

// The single place real wall-clock enters the system. Tests pass a fixed `now`.
export function todayKey(now = new Date()) {
  return toKey(now)
}

// 0 = Sunday ... 6 = Saturday (matches Date.getDay() and schedule.weekdays).
export function getWeekday(key) {
  return fromKey(key).getDay()
}

export function isSameDay(a, b) {
  return a === b
}

// Shift a key by n calendar days. Uses date fields so DST never causes an
// off-by-one (a 23h or 25h day still advances exactly one calendar day).
export function addDays(key, n) {
  const d = fromKey(key)
  d.setDate(d.getDate() + n)
  return toKey(d)
}

// Whole calendar days from aKey to bKey (b - a). Build UTC timestamps from the
// LOCAL fields of each date: both carry the same fictional offset, which cancels,
// giving an exact day count regardless of any DST transition between them.
export function diffDays(aKey, bKey) {
  const [ay, am, ad] = aKey.split('-').map(Number)
  const [by, bm, bd] = bKey.split('-').map(Number)
  const aUTC = Date.UTC(ay, am - 1, ad)
  const bUTC = Date.UTC(by, bm - 1, bd)
  return Math.round((bUTC - aUTC) / 86400000)
}

// Inclusive ascending range of keys from startKey to endKey.
export function eachDay(startKey, endKey) {
  const out = []
  if (diffDays(startKey, endKey) < 0) return out
  let cur = startKey
  while (diffDays(cur, endKey) >= 0) {
    out.push(cur)
    cur = addDays(cur, 1)
  }
  return out
}

// Back up to the start of the week containing `key` (default Sunday).
export function startOfWeek(key, weekStartsOn = 0) {
  const wd = getWeekday(key)
  const back = (wd - weekStartsOn + 7) % 7
  return addDays(key, -back)
}

export function startOfMonthKey(key) {
  const [y, m] = key.split('-').map(Number)
  return `${y}-${PAD(m)}-01`
}
