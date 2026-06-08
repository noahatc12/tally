// Visual self-verification harness. Seeds realistic localStorage data, drives a real
// Chromium via Playwright, and captures the today + detail screens at phone (390px)
// and desktop widths in both themes. Read the PNGs in screenshots/ to inspect UI work
// without a human round-trip. Run: `npm run shots` (preview server must be running).
//
//   1) npm run build && npm run preview &   (serves http://localhost:4173/tally/)
//   2) npm run shots

import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const BASE = process.env.SHOT_URL || 'http://localhost:4173/tally/'
const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'screenshots')
mkdirSync(OUT, { recursive: true })

const pad = (n) => String(n).padStart(2, '0')
function offsetKey(off) {
  const d = new Date()
  d.setHours(12, 0, 0, 0)
  d.setDate(d.getDate() - off)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

// A realistic state per "days ago": mostly done, periodic skips/misses, and a
// deliberate rough patch ~8 weeks back so the strength curve dips then recovers.
function stateFor(off, phase) {
  if (off === 0) return null // today unmarked
  if (off >= 52 + phase && off <= 64 + phase) return off % 3 === 0 ? 'done' : 'missed'
  if (off >= 208 + phase && off <= 222 + phase) return off % 2 === 0 ? 'done' : 'missed'
  if (off % 19 === 0) return 'skip'
  if (off % 13 === 0) return 'missed'
  return 'done'
}

const HABITS = [
  { id: 'h_walk', name: 'Walk', icon: '🚶', color: '#ff8a5b', phase: 0, type: 'duration', goal: 30 },
  { id: 'h_workout', name: 'Strength training', icon: '💪', color: '#6aa9ff', phase: 2 },
  { id: 'h_read', name: 'Read 10 pages', icon: '📖', color: '#5fd08a', phase: 4 },
  { id: 'h_water', name: 'Drink water', icon: '💧', color: '#7cd6f9', phase: 6 },
]
const DAYS = 371
const walkMinutes = (off) => 20 + ((off * 7) % 35)

function seed(theme) {
  const createdAt = `${offsetKey(DAYS)}T08:00:00.000Z`
  const habits = HABITS.map((h) => ({
    id: h.id,
    name: h.name,
    color: h.color,
    icon: h.icon,
    type: h.type || 'binary',
    target: h.type === 'duration' ? { amount: h.goal, unit: 'min' } : null,
    schedule: { kind: 'daily', weekdays: [1, 2, 3, 4, 5], timesPerWeek: 3, everyN: 2 },
    minimumVersion: 'one set',
    plan: { cue: 'morning coffee', time: '', place: '' },
    anchor: null,
    createdAt,
    archived: false,
  }))
  const completions = {}
  for (let off = DAYS - 1; off >= 0; off--) {
    const key = offsetKey(off)
    for (const h of HABITS) {
      const st = stateFor(off, h.phase)
      if (!st) continue
      completions[key] = completions[key] || {}
      completions[key][h.id] =
        st === 'done' && h.type === 'duration' ? { state: 'done', value: walkMinutes(off) } : { state: st }
    }
  }
  const t = offsetKey(0)
  completions[t] = { ...(completions[t] || {}), h_walk: { state: 'done', value: 22 }, h_read: { state: 'done' } }
  const meta = { schemaVersion: 1, points: 0, level: 0, badges: [], freezes: 0, theme, customThemes: [], font: 'default' }
  return { habits, completions, meta }
}

async function shoot(browser, { theme, width, height, label, action }) {
  const ctx = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 2 })
  const data = seed(theme)
  await ctx.addInitScript((d) => {
    localStorage.setItem('habits', JSON.stringify(d.habits))
    localStorage.setItem('completions', JSON.stringify(d.completions))
    localStorage.setItem('meta', JSON.stringify(d.meta))
  }, data)
  const page = await ctx.newPage()
  await page.goto(BASE, { waitUntil: 'networkidle' })
  if (action === 'detail') {
    await page.locator('.row__identity').first().click()
    await page.locator('.detail').waitFor()
    await page.locator('.trend__svg, .trend--empty').first().waitFor()
  } else if (action === 'timer') {
    // Start the Walk habit's stopwatch and let it tick a couple seconds.
    await page.locator('.timer__primary').first().click()
    await page.waitForTimeout(2500)
  } else if (action === 'overview') {
    await page.locator('button[aria-label="Overview"]').click()
    await page.locator('.overview').waitFor()
    await page.locator('.heatmap__svg').first().waitFor()
  } else if (action === 'theme') {
    await page.locator('button[aria-label="Themes"]').click()
    await page.locator('.theme-grid').waitFor()
    await page.waitForTimeout(300)
  } else if (action === 'edit') {
    await page.locator('.row__identity').first().click()
    await page.locator('.detail').waitFor()
    await page.getByRole('button', { name: 'Edit' }).click()
    await page.locator('.modal__panel').waitFor()
    await page.waitForTimeout(300)
  } else if (action === 'edit-scrolled') {
    await page.locator('.row__identity').first().click()
    await page.locator('.detail').waitFor()
    await page.getByRole('button', { name: 'Edit' }).click()
    await page.locator('.modal__panel').waitFor()
    await page.locator('.modal__panel').evaluate((el) => el.scrollTo(0, el.scrollHeight))
    await page.waitForTimeout(300)
  }
  await page.waitForTimeout(350) // settle transitions/fonts
  if (action && action.startsWith('edit')) {
    const m = await page.evaluate(() => {
      const panel = document.querySelector('.modal__panel')
      // Try to scroll the page behind the modal; a locked body should not move.
      const before = window.scrollY
      window.scrollTo(0, 800)
      const moved = window.scrollY - before
      return {
        panelX: panel ? panel.scrollWidth - panel.clientWidth : -1,
        docX: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        bodyLocked: document.body.style.position === 'fixed',
        bgMoved: moved,
      }
    })
    console.log(`  ${label}: panelX=${m.panelX}px docX=${m.docX}px bodyLocked=${m.bodyLocked} bgMoved=${m.bgMoved}px`)
  }
  const file = join(OUT, `${label}.png`)
  await page.screenshot({ path: file, fullPage: true })
  console.log(`saved ${file}`)
  await ctx.close()
}

const shots = [
  { theme: 'dark', width: 390, height: 844, label: '01-today-dark-390' },
  { theme: 'light', width: 390, height: 844, label: '02-today-light-390' },
  { theme: 'dark', width: 360, height: 800, label: '03-today-dark-360' },
  { theme: 'dark', width: 390, height: 844, label: '04-timer-running-dark-390', action: 'timer' },
  // Curated redesign palettes (step 2): verify explicit-token application + heat ramp.
  { theme: 'ocean', width: 390, height: 844, label: '05-today-ocean-390' },
  { theme: 'sage', width: 390, height: 844, label: '06-today-sage-390' },
  { theme: 'ocean', width: 390, height: 844, label: '07-detail-ocean-390', action: 'detail' },
  { theme: 'light', width: 390, height: 844, label: '08-theme-grid-light-390', action: 'theme' },
  { theme: 'dark', width: 390, height: 844, label: '09-theme-grid-dark-390', action: 'theme' },
]

const browser = await chromium.launch()
for (const s of shots) await shoot(browser, s)
await browser.close()
console.log('done')
