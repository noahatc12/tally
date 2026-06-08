// Capture the ported Today screen at a tall viewport (content scrolls inside .screen, so a
// normal fullPage shot clips it). Seeds realistic localStorage, one shot per Look.
import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'

const BASE = 'http://localhost:4173/tally/'
const OUT = 'screenshots'
mkdirSync(OUT, { recursive: true })

const pad = (n) => String(n).padStart(2, '0')
const offsetKey = (off) => { const d = new Date(); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() - off); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` }
const HABITS = [
  { id: 'h_meditate', name: 'Meditate', iconName: 'Sparkles', color: '#8a7ba2', tod: 'morning', cue: 'I wake up', phase: 1 },
  { id: 'h_workout', name: 'Strength training', iconName: 'Dumbbell', color: '#6e88ac', tod: 'morning', cue: 'morning coffee', phase: 3 },
  { id: 'h_water', name: 'Drink water', iconName: 'Droplet', color: '#5f97a0', tod: 'morning', cue: 'each meal', type: 'quantitative', goal: 8, unit: 'glasses', phase: 6 },
  { id: 'h_walk', name: 'Walk', iconName: 'Footprints', color: '#bf8052', tod: 'afternoon', cue: 'lunch', type: 'duration', goal: 30, phase: 0 },
  { id: 'h_read', name: 'Read 10 pages', iconName: 'BookOpen', color: '#7e9c6c', tod: 'evening', cue: 'dinner', phase: 4 },
]
const DAYS = 364
function stateFor(off, phase) {
  if (off === 0) return null
  if (off >= 40 + phase && off <= 52 + phase) return off % 3 === 0 ? 'done' : 'missed'
  if (off >= 150 + phase && off <= 165 + phase) return off % 2 === 0 ? 'done' : 'missed'
  if (off % 23 === 0) return 'skip'
  if (off % 14 === 0) return 'missed'
  return 'done'
}
function seed(theme, direction) {
  const createdAt = `${offsetKey(DAYS)}T08:00:00.000Z`
  const habits = HABITS.map((h) => ({
    id: h.id, name: h.name, color: h.color, iconName: h.iconName, tod: h.tod || null,
    type: h.type || 'binary', target: h.goal ? { amount: h.goal, unit: h.unit || 'min' } : null,
    schedule: { kind: 'daily' }, minimumVersion: '', plan: { cue: h.cue, time: '', place: '' },
    anchor: null, createdAt, archived: false,
  }))
  const completions = {}
  for (let off = DAYS; off >= 1; off--) {
    const key = offsetKey(off)
    for (const h of HABITS) {
      const st = stateFor(off, h.phase)
      if (!st) continue
      completions[key] = completions[key] || {}
      completions[key][h.id] = st === 'done' && h.goal ? { state: 'done', value: h.type === 'duration' ? 22 : 6 } : { state: st }
    }
  }
  const tk = offsetKey(0)
  completions[tk] = { h_walk: { state: 'done', value: 22 }, h_meditate: { state: 'done' } }
  const meta = { schemaVersion: 2, points: 0, level: 0, badges: [], freezes: 0, theme, direction, customThemes: [], font: 'default' }
  return { habits, completions, meta }
}

const browser = await chromium.launch()
const shots = [
  { theme: 'light', direction: 'A', label: 'port-today-ledger' },
  { theme: 'dark', direction: 'C', label: 'port-today-nocturne' },
  { theme: 'bloom', direction: 'B', label: 'port-today-bloom' },
]
for (const s of shots) {
  const ctx = await browser.newContext({ viewport: { width: 402, height: 1700 }, deviceScaleFactor: 2 })
  const data = seed(s.theme, s.direction)
  await ctx.addInitScript((d) => {
    localStorage.setItem('habits', JSON.stringify(d.habits))
    localStorage.setItem('completions', JSON.stringify(d.completions))
    localStorage.setItem('meta', JSON.stringify(d.meta))
  }, data)
  const page = await ctx.newPage()
  await page.goto(BASE, { waitUntil: 'networkidle' })
  await page.waitForTimeout(700)
  await page.screenshot({ path: `${OUT}/${s.label}.png` })
  console.log(`saved ${s.label}`)
  await ctx.close()
}
await browser.close()
