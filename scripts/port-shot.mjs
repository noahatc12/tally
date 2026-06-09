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
  { theme: 'light', direction: 'A', label: 'ledger', width: 402 },
  { theme: 'dark', direction: 'C', label: 'nocturne', width: 402 },
  { theme: 'bloom', direction: 'B', label: 'bloom', width: 402 },
  { theme: 'light', direction: 'A', label: 'ledger-360', width: 360 }, // narrowest-width overflow check
]
for (const s of shots) {
  const ctx = await browser.newContext({ viewport: { width: s.width, height: 1700 }, deviceScaleFactor: 2 })
  const data = seed(s.theme, s.direction)
  await ctx.addInitScript((d) => {
    localStorage.setItem('habits', JSON.stringify(d.habits))
    localStorage.setItem('completions', JSON.stringify(d.completions))
    localStorage.setItem('meta', JSON.stringify(d.meta))
  }, data)
  const page = await ctx.newPage()
  await page.goto(BASE, { waitUntil: 'networkidle' })
  await page.waitForTimeout(700)
  await page.screenshot({ path: `${OUT}/port-today-${s.label}.png` })

  // Detail: a binary habit (Meditate) then a count habit (Drink water → totals row).
  for (const [name, tag] of [['Meditate', 'detail'], ['Drink water', 'detail-count']]) {
    await page.getByText(name, { exact: true }).first().click()
    await page.waitForTimeout(500)
    const docX = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
    if (docX > 0) throw new Error(`[${s.label} ${tag}] horizontal overflow: ${docX}px`)
    await page.screenshot({ path: `${OUT}/port-${tag}-${s.label}.png` })
    await page.getByText('‹ Today').click()
    await page.waitForTimeout(300)
  }

  // Overview (▦ header button).
  await page.locator('.iconbtn[title="Overview"]').click()
  await page.waitForTimeout(500)
  const ovX = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
  if (ovX > 0) throw new Error(`[${s.label} overview] horizontal overflow: ${ovX}px`)
  await page.screenshot({ path: `${OUT}/port-overview-${s.label}.png` })
  await page.getByText('‹ Today').click()
  await page.waitForTimeout(300)

  // Help sheet (?) and New-habit form (+ New) — body must be scroll-locked while open.
  await page.locator('.iconbtn[title="How it works"]').click()
  await page.waitForTimeout(400)
  await page.screenshot({ path: `${OUT}/port-help-${s.label}.png` })
  await page.locator('.sheet__x').click()
  await page.waitForTimeout(300)
  await page.locator('.iconbtn--accent').click()
  await page.waitForTimeout(400)
  const formX = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
  if (formX > 0) throw new Error(`[${s.label} form] horizontal overflow: ${formX}px`)
  await page.screenshot({ path: `${OUT}/port-form-${s.label}.png` })
  await page.locator('.sheet__x').click()
  await page.waitForTimeout(200)

  // Appearance sheet (◑) — full Look/Theme/Accent/Ink/Completed/Type sheet; scroll-locked.
  await page.locator('.iconbtn[title="Appearance"]').click()
  await page.waitForTimeout(400)
  const themeX = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
  if (themeX > 0) throw new Error(`[${s.label} theme] horizontal overflow: ${themeX}px`)
  await page.locator('.sheet__panel').screenshot({ path: `${OUT}/port-theme-${s.label}.png` })

  // Net-new behaviours: Tonal ink + Collapse, then Drawer — set in the sheet, view Today behind.
  await page.locator('.seg__btn', { hasText: 'Tonal' }).click()
  await page.waitForTimeout(150)
  await page.locator('.seg__btn', { hasText: 'Collapse' }).click()
  await page.waitForTimeout(150)
  await page.locator('.sheet__x').click()
  await page.waitForTimeout(400)
  await page.screenshot({ path: `${OUT}/port-today-tonal-collapse-${s.label}.png` })
  await page.locator('.iconbtn[title="Appearance"]').click()
  await page.waitForTimeout(300)
  await page.locator('.seg__btn', { hasText: 'Drawer' }).click()
  await page.waitForTimeout(150)
  await page.locator('.sheet__x').click()
  await page.waitForTimeout(400)
  await page.screenshot({ path: `${OUT}/port-today-drawer-${s.label}.png` })

  console.log(`saved ${s.label} (today + detail + detail-count + overview + help + form + theme + tonal/collapse/drawer, overflow 0)`)
  await ctx.close()
}

// Onboarding / empty state: seed only meta (a Look) with NO habits so RootView shows it.
for (const o of [
  { theme: 'light', direction: 'A', label: 'ledger', width: 402 },
  { theme: 'dark', direction: 'C', label: 'nocturne', width: 402 },
  { theme: 'light', direction: 'A', label: 'ledger-360', width: 360 },
]) {
  const ctx = await browser.newContext({ viewport: { width: o.width, height: 1700 }, deviceScaleFactor: 2 })
  const meta = { schemaVersion: 2, points: 0, level: 0, badges: [], freezes: 0, theme: o.theme, direction: o.direction, customThemes: [], font: 'default' }
  await ctx.addInitScript((m) => {
    localStorage.setItem('habits', JSON.stringify([]))
    localStorage.setItem('completions', JSON.stringify({}))
    localStorage.setItem('meta', JSON.stringify(m))
  }, meta)
  const page = await ctx.newPage()
  await page.goto(BASE, { waitUntil: 'networkidle' })
  await page.waitForTimeout(600)
  const obX = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
  if (obX > 0) throw new Error(`[onboarding ${o.label}] horizontal overflow: ${obX}px`)
  await page.screenshot({ path: `${OUT}/port-onboarding-${o.label}.png` })
  console.log(`saved onboarding ${o.label} (overflow 0)`)
  await ctx.close()
}
await browser.close()
