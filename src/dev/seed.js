// Demo + starter data. STARTERS feeds the wizard's "Start fresh" grid; buildDemoData()
// produces a freshly RANDOMIZED year of history — per-habit seeded profiles re-salted every
// call, so no two habits (or two generations) look alike — for the wizard's "Example data"
// and the Appearance "Reset demo data". The RNG (hashStr/mulberry32/profileFor/stateFor/
// loggedValue) is ported verbatim from the Claude Design reference (data.jsx).
//
// maybeSeedDemo() additionally honours `?demo` (write a demo set) / `?reset` (clear) URL
// params for showing the app off on a fresh device; a no-op otherwise, safe in production.

import { createHabit } from '../lib/factories.js'
import { todayKey, addDays } from '../lib/dates.js'

const DAYS = 364

// Starter habits (prototype shape: flat name/iconName/color/tod/cue/type/goal/unit).
export const STARTERS = [
  { id: 's_read', name: 'Read', iconName: 'BookOpen', color: '#7e9c6c', tod: 'evening', cue: 'dinner', type: 'binary' },
  { id: 's_water', name: 'Drink water', iconName: 'Droplet', color: '#5f97a0', tod: 'morning', cue: 'each meal', type: 'count', goal: 8, unit: 'glasses' },
  { id: 's_walk', name: 'Walk', iconName: 'Footprints', color: '#bf8052', tod: 'afternoon', cue: 'lunch', type: 'duration', goal: 20, unit: 'min' },
  { id: 's_meditate', name: 'Meditate', iconName: 'Sparkles', color: '#8a7ba2', tod: 'morning', cue: 'I wake up', type: 'binary' },
  { id: 's_stretch', name: 'Stretch', iconName: 'PersonStanding', color: '#c2a052', tod: 'morning', cue: 'morning coffee', type: 'binary' },
  { id: 's_journal', name: 'Journal', iconName: 'PenLine', color: '#c07f93', tod: 'evening', cue: 'I get in bed', type: 'binary' },
]

// starter → addHabit payload (createHabit normalizes the rest); count → our 'quantitative'.
export function toStarterPayload(s) {
  return {
    name: s.name,
    color: s.color,
    iconName: s.iconName,
    tod: s.tod,
    type: s.type === 'count' ? 'quantitative' : s.type,
    target: s.goal ? { amount: s.goal, unit: s.unit || (s.type === 'duration' ? 'min' : 'units') } : null,
    schedule: { kind: 'daily' },
    plan: { cue: s.cue, time: '', place: '' },
  }
}

// The demo set (our field shape: type binary | quantitative | duration, target {amount,unit}).
const DEMO = [
  { name: 'Meditate', iconName: 'Sparkles', color: '#8a7ba2', tod: 'morning', cue: 'I wake up', type: 'binary' },
  { name: 'Strength training', iconName: 'Dumbbell', color: '#6e88ac', tod: 'morning', cue: 'morning coffee', type: 'binary' },
  { name: 'Drink water', iconName: 'Droplet', color: '#5f97a0', tod: 'morning', cue: 'each meal', type: 'quantitative', goal: 8, unit: 'glasses' },
  { name: 'Walk', iconName: 'Footprints', color: '#bf8052', tod: 'afternoon', cue: 'lunch', type: 'duration', goal: 30, unit: 'min' },
  { name: 'Read 10 pages', iconName: 'BookOpen', color: '#7e9c6c', tod: 'evening', cue: 'dinner', type: 'binary' },
]

// ---- seeded RNG (ported verbatim from reference/data.jsx) -------------------
function hashStr(s) { let h = 2166136261 >>> 0; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) } return h >>> 0 }
function mulberry32(seed) {
  let t = seed >>> 0
  return () => {
    t = (t + 0x6d2b79f5) >>> 0
    let x = Math.imul(t ^ (t >>> 15), 1 | t)
    x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296
  }
}
function profileFor(seed) {
  const r = mulberry32(seed)
  return {
    doneProb: 0.6 + r() * 0.36,
    skipProb: 0.015 + r() * 0.085,
    rough1: 24 + Math.floor(r() * 130),
    rlen1: 6 + Math.floor(r() * 16),
    rough2: 150 + Math.floor(r() * 150),
    rlen2: 6 + Math.floor(r() * 18),
    roughMiss: 0.38 + r() * 0.34,
    hasRough2: r() > 0.35,
  }
}
function stateFor(off, seed, p) {
  if (off === 0) return null
  const u = mulberry32((seed ^ Math.imul(off, 2654435761)) >>> 0)()
  const inRough = (off >= p.rough1 && off <= p.rough1 + p.rlen1) || (p.hasRough2 && off >= p.rough2 && off <= p.rough2 + p.rlen2)
  if (inRough) return u < p.roughMiss ? 'missed' : u < p.roughMiss + p.skipProb ? 'skip' : 'done'
  if (u < p.skipProb) return 'skip'
  if (u < p.skipProb + (1 - p.doneProb)) return 'missed'
  return 'done'
}
function loggedValue(seed, off, base, spread) {
  const u = mulberry32((seed ^ Math.imul(off + 7, 40503)) >>> 0)()
  return Math.round(base + u * spread)
}

function buildCompletions(habits) {
  const c = {}
  const salt = (Math.random() * 4294967296) >>> 0 // fresh every generation
  const today = todayKey()
  for (const h of habits) {
    const seed = (hashStr(h.id) ^ salt) >>> 0
    const p = profileFor(seed)
    const goal = h.target?.amount || (h.type === 'duration' ? 30 : 8)
    for (let off = DAYS; off >= 1; off--) {
      const st = stateFor(off, seed, p)
      if (!st) continue
      const key = addDays(today, -off)
      c[key] = c[key] || {}
      if (st === 'done' && h.type === 'duration') c[key][h.id] = { state: 'done', value: loggedValue(seed, off, goal * 0.6, goal * 0.8) }
      else if (st === 'done' && h.type === 'quantitative') c[key][h.id] = { state: 'done', value: loggedValue(seed, off, goal * 0.55, goal * 0.7) }
      else c[key][h.id] = { state: st }
    }
  }
  // a partial today, so the day-progress band has life
  const tk = todayKey()
  c[tk] = { ...(c[tk] || {}) }
  const walk = habits.find((h) => h.type === 'duration')
  const water = habits.find((h) => h.type === 'quantitative')
  if (walk) c[tk][walk.id] = { state: 'done', value: 22 }
  if (water) c[tk][water.id] = { state: 'in', value: 5 }
  return c
}

// A fresh demo: 5 normalized habits created ~a year ago + a randomized year of history.
export function buildDemoData() {
  const createdAt = `${addDays(todayKey(), -DAYS)}T08:00:00.000Z`
  const habits = DEMO.map((d) =>
    createHabit(
      {
        name: d.name, color: d.color, iconName: d.iconName, tod: d.tod, type: d.type,
        target: d.goal ? { amount: d.goal, unit: d.unit } : null,
        schedule: { kind: 'daily' }, plan: { cue: d.cue, time: '', place: '' },
      },
      { createdAt },
    ),
  )
  return { habits, completions: buildCompletions(habits) }
}

function stripParam(name) {
  const params = new URLSearchParams(location.search)
  params.delete(name)
  const qs = params.toString()
  history.replaceState(null, '', location.pathname + (qs ? `?${qs}` : '') + location.hash)
}

// `?demo` seeds a demo set (onboarded, so it skips the wizard); `?reset` clears all data.
export function maybeSeedDemo() {
  const params = new URLSearchParams(location.search)
  if (params.has('reset')) {
    localStorage.removeItem('habits')
    localStorage.removeItem('completions')
    localStorage.removeItem('meta')
    stripParam('reset')
    return
  }
  if (!params.has('demo')) return
  const { habits, completions } = buildDemoData()
  localStorage.setItem('habits', JSON.stringify(habits))
  localStorage.setItem('completions', JSON.stringify(completions))
  localStorage.setItem('meta', JSON.stringify({ schemaVersion: 3, theme: 'dark', direction: 'C', customThemes: [], font: 'default', onboarded: true }))
  stripParam('demo')
}
