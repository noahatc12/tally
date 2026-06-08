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
await browser.close()
