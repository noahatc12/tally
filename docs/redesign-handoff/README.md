# Tally Redesign — Full Build for Claude Code

This is the complete, current handoff to port the Tally redesign into the real repo
(`noahatc12/tally`, React + Vite, localStorage-only). It contains:

- **`CHANGES.md`** — one checklist of every feature/behavior in the prototype.
- **`DELTA.md`** — how to port (the exact-parity method, deploy fix, per-feature mapping).
- **`reference/`** — the full prototype source = the **source of truth**. Match its markup,
  class names, and CSS exactly.

## Read order for Claude Code
1. `CHANGES.md` — what exists.
2. `DELTA.md` — how to implement it in the repo (start with the deploy fix, then tokens,
   then components).
3. `reference/*` — copy exact values, markup, and `tally.css` verbatim.

## The one rule for pixel-parity
The first port re-built styles with its own class names, which is why the deployed app
drifts from the prototype. To get an exact match: **adopt `reference/tally.css` verbatim**,
wrap the app in a `.tally` root that carries the design tokens as inline CSS vars + the
`data-dir / data-dark / data-completed / data-habitcolor` attributes (computed like
`resolveTweaks` in `reference/directions.jsx`), and make each component render the **same DOM
+ class names** as the matching `reference/*.jsx`. Keep `src/lib/*` math.

## Prototype tech → repo tech
The reference files are vanilla React via in-browser Babel, sharing globals on `window`
(e.g. `Object.assign(window, {...})`) and looking up icons via `window.lucide`. In the repo:
convert each module to an ES module (`import`/`export`), swap `window.lucide[name]` for
`lucide-react`, and wire to React 19 + the existing `src/lib`. The markup/CSS port 1:1.

See `DELTA.md` for the full step list and the newest additions (animated bottom sheets with
drag + overscroll-to-close, the setup wizard, randomized demo data, light/dark theme split).
