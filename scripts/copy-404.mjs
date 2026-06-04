// GitHub Pages serves 404.html for unknown paths. Copying index.html -> 404.html
// makes client-side deep links resolve to the SPA instead of a hard 404.
import { copyFileSync, existsSync } from 'node:fs'

const src = 'dist/index.html'
const dest = 'dist/404.html'

if (!existsSync(src)) {
  console.error(`[copy-404] ${src} not found — did the build run?`)
  process.exit(1)
}
copyFileSync(src, dest)
console.log('[copy-404] dist/index.html -> dist/404.html')
