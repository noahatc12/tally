// Opt-in demo seeder. Loading the app with `?demo` writes a realistic example
// dataset (3 habits, ~150 days of history with a deliberate rough patch) into
// localStorage so the heatmap and strength trend are populated on any device —
// handy for showing the app off or testing on a phone with no history yet.
// `?reset` clears all Tally data. The query param is stripped afterward so a
// refresh keeps any edits you make. It is a no-op unless one of those params is
// present, so it is safe to run on every load (including production).

const pad = (n) => String(n).padStart(2, '0')
function offsetKey(off) {
  const d = new Date()
  d.setHours(12, 0, 0, 0)
  d.setDate(d.getDate() - off)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

// Mostly done, periodic skips/misses, and two rough patches (one early, one ~8
// weeks back) so the strength curve has texture and visibly dips and recovers.
function stateFor(off, phase) {
  if (off === 0) return null // today unmarked
  if (off >= 52 + phase && off <= 64 + phase) return off % 3 === 0 ? 'done' : 'missed'
  if (off >= 208 + phase && off <= 222 + phase) return off % 2 === 0 ? 'done' : 'missed'
  if (off % 19 === 0) return 'skip'
  if (off % 13 === 0) return 'missed'
  return 'done'
}

const DEMO = [
  { id: 'demo_walk', name: 'Walk', iconName: 'Footprints', color: '#ff8a5b', phase: 0, cue: 'lunch', type: 'duration', goal: 30 },
  { id: 'demo_workout', name: 'Strength training', iconName: 'Dumbbell', color: '#6aa9ff', phase: 2, cue: 'morning coffee' },
  { id: 'demo_read', name: 'Read 10 pages', iconName: 'BookOpen', color: '#5fd08a', phase: 4, cue: 'lunch' },
  { id: 'demo_water', name: 'Drink water', iconName: 'Droplet', color: '#7cd6f9', phase: 6, cue: 'waking up' },
]
const DAYS = 371 // a full year so the whole heatmap is populated

// Minutes logged on a done day for the timed habit — varies 20..54 so the heatmap
// ramps and some days fall under / over the 30-min goal.
const walkMinutes = (off) => 20 + ((off * 7) % 35)

function buildDemo() {
  const createdAt = `${offsetKey(DAYS)}T08:00:00.000Z`
  const habits = DEMO.map((h) => ({
    id: h.id,
    name: h.name,
    color: h.color,
    iconName: h.iconName,
    type: h.type || 'binary',
    target: h.type === 'duration' ? { amount: h.goal, unit: 'min' } : null,
    schedule: { kind: 'daily', weekdays: [1, 2, 3, 4, 5], timesPerWeek: 3, everyN: 2 },
    minimumVersion: h.type === 'duration' ? '5 minutes' : 'one rep',
    plan: { cue: h.cue, time: '', place: '' },
    anchor: null,
    createdAt,
    archived: false,
  }))
  const completions = {}
  for (let off = DAYS - 1; off >= 0; off--) {
    const key = offsetKey(off)
    for (const h of DEMO) {
      const st = stateFor(off, h.phase)
      if (!st) continue
      completions[key] = completions[key] || {}
      completions[key][h.id] =
        st === 'done' && h.type === 'duration' ? { state: 'done', value: walkMinutes(off) } : { state: st }
    }
  }
  // Make today partially complete for a livelier demo (rest stay pending).
  const t = offsetKey(0)
  completions[t] = { ...(completions[t] || {}), demo_walk: { state: 'done', value: 22 }, demo_read: { state: 'done' } }
  const meta = { schemaVersion: 1, points: 0, level: 0, badges: [], freezes: 0, theme: 'dark', customThemes: [], font: 'default' }
  return { habits, completions, meta }
}

function stripParam(name) {
  const params = new URLSearchParams(location.search)
  params.delete(name)
  const qs = params.toString()
  history.replaceState(null, '', location.pathname + (qs ? `?${qs}` : '') + location.hash)
}

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
  const { habits, completions, meta } = buildDemo()
  localStorage.setItem('habits', JSON.stringify(habits))
  localStorage.setItem('completions', JSON.stringify(completions))
  localStorage.setItem('meta', JSON.stringify(meta))
  stripParam('demo') // so a refresh keeps any check-ins you make
}
