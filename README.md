# Tally

A mobile-first habit tracker with a **forgiving streak model** — built so a single
missed day doesn't wipe out your progress or your motivation.

**Live:** https://noahatc12.github.io/tally/

Pure client-side: React + Vite, `localStorage` only, no backend, no accounts, no
tracking. Your data never leaves your device.

---

## Why "forgiving" streaks

Most habit apps reset your streak to zero the moment you miss one day. That single
design choice is the category's biggest flaw, and it's backed by the wrong model of
how habits work:

- Habit formation is **not** derailed by occasional misses. In the landmark UCL study
  (Lally et al., 2010), missing one opportunity didn't materially affect habit
  formation. Automaticity builds on a curve over a **median of ~66 days** (individual
  range 18–254) — habits are multi-month projects, not 21-day challenges. (The
  "21 days" figure is a myth from a 1960s plastic-surgery book.)
- All-or-nothing streaks trigger the **abstinence violation effect**: after one slip,
  "I've ruined it" framing makes people *more* likely to quit entirely.
- Forgiveness measurably *increases* engagement — e.g. Duolingo found two streak
  freezes raised daily active users.

So this app is built on James Clear's rule — **"never miss twice"** — from v1:

1. **Three states per day, not two:** `done`, `skip`, `missed`. A **skip** (rest day,
   illness, travel) is neutral — it never breaks a streak and is excluded from
   completion-rate stats. Only a **missed** day affects anything.
2. **Habit strength (0–100):** an exponentially-weighted moving average of completions
   — the same exponential smoothing used for volatility in finance. A long run then
   one miss dips it by ~12 points, not to zero. It's a more honest progress signal
   than a fragile streak count.
3. **A gentle nudge** after a single miss; the streak number is only de-emphasized
   after two. **Never** any punishment, guilt, or HP-loss mechanics — controlling
   extrinsic pressure undermines intrinsic motivation (Deci/Koestner/Ryan, 1999).

It also weaves in cheap, high-leverage behavioral design when you create a habit:
implementation-intention plans ("after [cue], I will…"), habit stacking (anchor a new
habit to an existing one), and a "minimum version" (the two-minute floor).

## Architecture

The point of the design is a clean separation that makes the hard logic testable in
isolation:

- **`src/lib/`** — all domain logic as **pure functions** of `(habits, completions, meta)`.
  No React, no `localStorage`, and "today" is always injected, so every function is
  deterministic and unit-tested.
  - `dates.js` — local-calendar `YYYY-MM-DD` keys (no UTC drift, DST-safe).
  - `scheduling.js` — `isDue` for daily/weekdays/everyNDays, plus the weekly-**quota**
    model for "× per week" (a miss is a whole elapsed week below target, never a day).
  - `streaks.js` — skip-neutral / missed-breaks / today-pending streak logic.
  - `strength.js` — the forgiving EWMA.
  - `stats.js` — completion rate (skips excluded from the denominator).
  - `storage.js` — the only `localStorage` touchpoint, with a schema-migration chain.
- **`src/hooks/useHabits.js`** — the single source of truth bridging pure logic +
  storage to React.
- **`src/components/`** — presentation only.

## Tech

Vite 8 · React 19 · plain CSS (CSS variables, two themes) · Vitest. No UI framework,
no charting library (the v2 charts are hand-rolled SVG). Deployed to GitHub Pages via
GitHub Actions.

## Roadmap

- **v1 — Core loop** *(this release):* habits (binary + quantitative, all schedule
  kinds), one-tap three-state check-in, streak + strength + weekly completion, micro-
  celebration, dark/light themes.
- **v2 — Visual progress:** GitHub-style calendar heatmap + hand-rolled SVG trend chart.
- **v3 — Gamification:** optional, non-punitive points/levels/badges; milestones at
  7/30/66/100 days.
- **v4 — Polish & durability:** installable PWA + offline, streak-freeze grace days,
  JSON/CSV export & import.

## Develop

```bash
npm install
npm run dev       # local dev server
npm run test      # Vitest
npm run build     # production build -> dist/ (also writes 404.html for SPA routing)
npm run lint
```

## Deploy

Pushing to `main` runs the workflow in `.github/workflows/deploy.yml` (test → build →
deploy to Pages). One-time setup: **Settings → Pages → Source → "GitHub Actions."**
The Vite `base` and the PWA scope must match the repo name (`/tally/`).

## Install on iPhone

iOS has no automatic install prompt. In **Safari**, tap **Share → Add to Home Screen**.
(Full offline/installable PWA support lands in v4.)

## Scope & honesty

This is intentionally **local-only and single-device** — there's no sync. Browser
storage can be cleared (iOS Safari may evict it after long inactivity), so v4 adds
JSON/CSV export as the backup story. Stored data is plain habit text; nothing
sensitive, nothing leaves the device.
