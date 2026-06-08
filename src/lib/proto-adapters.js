// Adapters: expose the data shapes the ported prototype components expect, backed by the
// repo's real (tested, frozen) src/lib math. The prototype's components read flat habit
// fields (goal/unit/cue) and helper fns (strengthOf/streakOf/weekStates/...); this module
// bridges them to our habit shape (target.{amount,unit}/plan.cue) and our lib functions.

import { todayKey, fromKey, addDays, diffDays, startOfWeek } from './dates.js'
import { getState, isDue as libIsDue } from './scheduling.js'
import { computeStreaks } from './streaks.js'
import { computeStrength, strengthSeries } from './strength.js'
import { completionRate, valueTotals as libValueTotals } from './stats.js'
import { formatDuration as libFormatDuration } from './duration.js'

const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export { todayKey }
export const dateFromKey = fromKey

// Flatten our habit to the field names the prototype components read.
export function toUiHabit(h) {
  const type = h.type === 'quantitative' ? 'count' : h.type // binary | count | duration
  return {
    ...h,
    type,
    goal: h.target?.amount ?? 0,
    unit: h.target?.unit ?? '',
    cue: h.plan?.cue ?? '',
  }
}

export function recordOf(completions, habitId, key) {
  return completions[key]?.[habitId] || null
}

export function strengthOf(habit, completions, today = todayKey()) {
  return computeStrength(habit, completions, today)
}
export function streakOf(habit, completions, today = todayKey()) {
  return computeStreaks(habit, completions, today).current
}
export function longestStreak(habit, completions, today = todayKey()) {
  return computeStreaks(habit, completions, today).longest
}

// Trailing consecutive misses (skips transparent), over the recent due window.
export function trailingMisses(habit, completions, today = todayKey()) {
  let n = 0
  for (let off = 1; off <= 21; off++) {
    const key = addDays(today, -off)
    if (!libIsDue(habit, key, completions, today)) continue
    const st = getState(completions, key, habit.id)
    if (st === 'missed' || (st == null && diffDays(key, today) > 0)) n++
    else if (st === 'skip') continue
    else break
    if (off > 14) break
  }
  return n
}

// Last 7 calendar days as week dots: { key, state, isToday, dow(initial) }.
export function weekStates(habit, completions, today = todayKey()) {
  const out = []
  for (let off = 6; off >= 0; off--) {
    const key = addDays(today, -off)
    const st = getState(completions, key, habit.id)
    out.push({
      key,
      state: st || (off === 0 ? 'today' : 'off'),
      isToday: off === 0,
      dow: DOW[fromKey(key).getDay()][0],
    })
  }
  return out
}

// This-week completion rate (done / due), 0..100 or null when nothing was due.
export function weekRate(habit, completions, today = todayKey()) {
  const r = completionRate(habit, completions, startOfWeek(today), today, today)
  return r.rate == null ? null : Math.round(r.rate * 100)
}

// Today's aggregate across the given habits: ring %, done/total, per-habit dots.
export function aggToday(habits, completions, today = todayKey()) {
  let done = 0
  const items = habits.map((h) => {
    const st = getState(completions, today, h.id)
    const isDone = st === 'done'
    if (isDone) done++
    return { habit: h, state: st, isDone, isMiss: st === 'missed' }
  })
  return { items, done, total: habits.length, pct: habits.length ? Math.round((done / habits.length) * 100) : 0 }
}

// Strength trend as a plain number series (our strengthSeries yields {key,value}).
export function trendSeries(habit, completions, today = todayKey()) {
  return strengthSeries(habit, completions, today).map((p) => Math.round(p.value))
}

// Heat level 0..4 for a day's record, ramping measured/timed by value/goal.
function heatLevel(rec, habit) {
  if (!rec) return 0
  if (rec.state === 'skip') return 1
  if (rec.state === 'missed') return 0
  if (rec.state === 'done') {
    if ((habit.type === 'duration' || habit.type === 'count') && habit.goal > 0) {
      const v = rec.value || 0
      return v >= habit.goal ? 4 : v >= habit.goal * 0.6 ? 3 : 2
    }
    return 4
  }
  return 0
}

// Year heatmap grid aligned to weeks (cols = weeks, rows = Sun..Sat), today's column last.
export function yearGrid(habit, completions, today = todayKey(), weeks = 53) {
  const cells = []
  const months = []
  let lastMonth = -1
  const totalDays = weeks * 7
  const todayDow = fromKey(today).getDay()
  for (let i = totalDays - 1; i >= 0; i--) {
    const off = i - (6 - todayDow)
    if (off < 0) continue
    const idx = totalDays - 1 - i
    const col = Math.floor(idx / 7)
    const row = idx % 7
    const key = addDays(today, -off)
    const d = fromKey(key)
    const rec = off === 0 ? null : recordOf(completions, habit.id, key)
    cells.push({ col, row, off, key, level: heatLevel(rec, habit), state: rec?.state, isToday: off === 0 })
    if (row === 0) {
      const m = d.getMonth()
      if (m !== lastMonth) { months.push({ col, label: MON[m] }); lastMonth = m }
    }
  }
  return { cells, months, cols: weeks }
}

// Aggregate year grid: each day shaded by share of that day's habits completed.
export function aggregateYearGrid(habits, completions, today = todayKey(), weeks = 53) {
  const base = yearGrid(habits[0] || { id: '__none', type: 'binary' }, completions, today, weeks)
  const cells = base.cells.map((c) => {
    if (c.isToday) return { ...c, level: 0, ratio: 0 }
    let done = 0, due = 0
    for (const h of habits) {
      const st = getState(completions, c.key, h.id)
      if (st === 'done') { done++; due++ }
      else if (st === 'missed') due++
    }
    const ratio = due === 0 ? 0 : done / due
    const level = due === 0 || done === 0 ? 0 : Math.min(4, 1 + Math.round(ratio * 3))
    return { ...c, level, ratio, done, due, state: undefined }
  })
  return { cells, months: base.months, cols: base.cols }
}

export function valueTotals(habit, completions, today = todayKey()) {
  const created = habit.createdAt.slice(0, 10)
  const all = libValueTotals(habit, completions, created, today)
  const week = libValueTotals(habit, completions, startOfWeek(today), today)
  return { total: all.total, daysLogged: all.daysLogged, avg: all.avg, week: week.total }
}

export const formatDuration = libFormatDuration

export function isDue(habit, key = todayKey(), completions = {}) {
  return libIsDue(habit, key, completions, key)
}

export function schedLabel(habit) {
  const s = habit.schedule || { kind: 'daily' }
  if (s.kind === 'weekdays') return (s.weekdays || []).map((d) => DOW[d]).join(' · ') || 'Weekdays'
  if (s.kind === 'everyNDays') return s.everyN === 1 ? 'Every day' : `Every ${s.everyN || 2} days`
  if (s.kind === 'timesPerWeek') return `${s.timesPerWeek || 3}× per week`
  return 'Daily'
}
