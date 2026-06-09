// One-off: screenshot the Claude Design prototype (docs/redesign-handoff/Tally.html)
// served at :4180, so we can compare the intended design against what shipped.
import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'

const OUT = 'screenshots'
mkdirSync(OUT, { recursive: true })
const browser = await chromium.launch()
const ctx = await browser.newContext({ viewport: { width: 1100, height: 1600 }, deviceScaleFactor: 1 })
const page = await ctx.newPage()
await page.goto('http://localhost:4180/Tally.html', { waitUntil: 'networkidle' })
await page.waitForTimeout(2500) // babel compile + render
await page.screenshot({ path: `${OUT}/proto-full.png`, fullPage: true })
console.log('saved proto-full.png')

// Navigate into a habit's Detail screen (click the first card's identity button) and shoot it.
await page.locator('.hcard__id').first().click()
await page.waitForTimeout(600)
await page.screenshot({ path: `${OUT}/proto-detail.png`, fullPage: true })
console.log('saved proto-detail.png')

// Back to Today, then into the Overview screen (▦ header button) and shoot it.
await page.getByText('‹ Today').click()
await page.waitForTimeout(400)
await page.locator('.iconbtn[title="Overview"]').click()
await page.waitForTimeout(600)
await page.screenshot({ path: `${OUT}/proto-overview.png`, fullPage: true })
console.log('saved proto-overview.png')

// Year-in-review ShareCard (✦ from Overview).
await page.locator('.iconbtn[title="Year in review"]').click()
await page.waitForTimeout(600)
await page.screenshot({ path: `${OUT}/proto-share.png`, fullPage: true })
console.log('saved proto-share.png')
await page.locator('.share__close').click()
await page.waitForTimeout(300)

// Back to Today, then the Help sheet (?) and the New-habit form (+ New).
await page.getByText('‹ Today').click()
await page.waitForTimeout(400)
await page.locator('.iconbtn[title="How it works"]').click()
await page.waitForTimeout(500)
await page.screenshot({ path: `${OUT}/proto-help.png`, fullPage: true })
console.log('saved proto-help.png')
await page.locator('.sheet__x').click()
await page.waitForTimeout(300)
await page.locator('.iconbtn--accent').click()
await page.waitForTimeout(500)
await page.screenshot({ path: `${OUT}/proto-form.png`, fullPage: true })
console.log('saved proto-form.png')

// Appearance sheet (◑) — the full Look/Theme/Accent/Ink/Completed/Type sheet.
await page.locator('.sheet__x').click().catch(() => {})
await page.waitForTimeout(200)
await page.locator('.iconbtn[title="Appearance"]').click()
await page.waitForTimeout(500)
await page.locator('.sheet__panel').screenshot({ path: `${OUT}/proto-theme.png` })
console.log('saved proto-theme.png')

// Net-new behaviours: Tonal ink + Collapse, then Drawer — set in the sheet, view Today behind.
await page.locator('.seg__btn', { hasText: 'Tonal' }).click()
await page.waitForTimeout(150)
await page.locator('.seg__btn', { hasText: 'Collapse' }).click()
await page.waitForTimeout(150)
await page.locator('.sheet__x').click()
await page.waitForTimeout(400)
await page.screenshot({ path: `${OUT}/proto-today-tonal-collapse.png`, fullPage: true })
console.log('saved proto-today-tonal-collapse.png')
await page.locator('.iconbtn[title="Appearance"]').click()
await page.waitForTimeout(300)
await page.locator('.seg__btn', { hasText: 'Drawer' }).click()
await page.waitForTimeout(150)
await page.locator('.sheet__x').click()
await page.waitForTimeout(400)
await page.screenshot({ path: `${OUT}/proto-today-drawer.png`, fullPage: true })
console.log('saved proto-today-drawer.png')

// Onboarding: open the tweaks panel (host activate message) and flip the firstRun switch.
await page.locator('.sheet__x').click().catch(() => {})
await page.waitForTimeout(200)
await page.evaluate(() => window.postMessage({ type: '__activate_edit_mode' }, '*'))
await page.waitForTimeout(400)
await page.locator('.twk-row-h', { hasText: 'Show first-run' }).locator('.twk-toggle').click()
await page.waitForTimeout(600)
await page.screenshot({ path: `${OUT}/proto-onboarding.png`, fullPage: true })
console.log('saved proto-onboarding.png')

await browser.close()
