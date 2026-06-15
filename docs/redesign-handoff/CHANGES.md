# Tally — Complete Change Inventory

One checklist of everything in the prototype, so nothing is missed when porting to the repo.
Two docs sit beside this: **DELTA.md** (how to port + exact-parity method) and **reference/**
(the prototype source = source of truth). Items tagged:
- **[CORE]** = part of the first Claude Code handoff (likely already in the repo).
- **[NEW]** = added after that handoff (the delta — verify these are present).

## Identity & theming
- [CORE] "Ledger / Almanac" identity: Newsreader serif + Inter, paper-and-ink, hairlines,
  tally-mark motif, masthead rule, framed/"engraved" detail plates, paper grain (light only).
- [CORE] Three **Looks**: Ledger (A, light) · Bloom (B, dark soft) · Nocturne (C, dark serif).
- [CORE] Token system driven by inline CSS vars on a `.tally` root + `data-dir/data-dark/
  data-completed/data-habitcolor` (see `reference/directions.jsx` `resolveTweaks`).
- [CORE] Palette library (nature + monochrome) + per-4-color **Custom theme** editor.
- [NEW] **Light/Dark split** in the theme picker (filters palettes by polarity; Native + Custom
  in both; equal counts — 12 each). Added light palettes **Mist** and **Heath** to balance.
- [NEW] **Accent cleanup**: Auto swatch shows the real accent (filled + hairline, small "A");
  separate **custom accent** color picker in both the Appearance sheet and the wizard.
- [CORE] **Tonal ink** mode (each habit a shade of the theme accent) vs Colourful.
- [CORE] Type/font selector.

## Screens
- [CORE] **Today**: masthead header (Overview/Help/Appearance/+New), borderless daily quote,
  day-progress ring + dots, **time-of-day groups** (Morning/Afternoon/Evening), habit cards.
- [NEW] **Greeting personalization**: appends the user's name ("Good morning, Noah").
- [CORE] **Habit Detail**: hero strength number, stat trio, strength trend, fit-to-width year
  heatmap, **backfill week**.
- [NEW] **Value-totals row** on Detail for count/duration (Total / Per active day / This week,
  durations formatted `179h 17m`). *(Added after handoff — verify present.)*
- [CORE] **Overview**: aggregate heatmap + per-habit sparkline rows.
- [CORE] **Year-in-Review share card**.
- [NEW] **Animated first-run setup wizard** (Welcome → Look → Theme(Light/Dark/Auto) →
  Forgiving demo → Preferences(name, reminders, example-vs-fresh) → starters). Replaces the
  thin empty state; gated on `meta.onboarded`.

## Controls & behavior
- [CORE] Three-state check-in (done/skip/miss), counter control.
- [NEW] **Real stopwatch timer** (records timestamps; pause commits elapsed minutes, never
  resets on pause; +5/+15; reset zeroes).
- [NEW] **Habit form**: timer **unit dropdown** (minutes/hours); new count/timer habits start
  with **blank goal/unit + placeholders** (no pre-filled "8 glasses").
- [CORE] **Completed-task modes**: Soften (fade+seal+sink) / Collapse / Drawer / Keep.
- [CORE] Habit **archive** vs delete; outline **Lucide icons** + monogram fallback.
- [NEW] **Randomized demo data**: per-habit seeded profiles, re-randomized every generation
  (used by wizard "Example data" and "Reset demo data"), so no two habits/sets look alike.

## Bug fixes folded in
- [NEW] NaN-safe day-progress (hidden at 0 habits).
- [NEW] First-run "I'll add my own / Skip" lands on an **empty** Today (no auto-demo).
- [NEW] Removed colored card `border-left` (done-card no longer reads as an outline).
- [NEW] Em dashes stripped from rendered copy.
- [NEW] Theme switches are instant (no root background transition that froze mid-apply).

## Bottom sheets (Appearance / Habit form / Help) — gesture + motion
- [NEW] **Smooth open/close animation**: panels slide up from the bottom on open and slide
  down off-screen + fade the scrim on close, then unmount (no instant vanish). Natural ease
  `cubic-bezier(.32,.72,0,1)`. Centralized in a `useSheetDrag(onClose)` hook in
  `reference/modals.jsx` — every close path runs the same animated exit.
- [NEW] **Drag the grab-handle down to dismiss** (pointer events: mouse + touch); panel tracks
  the finger 1:1, releases past a threshold (or a fast flick) to close, else springs back.
- [NEW] **Scroll-to-close**: when the panel content is at the top, a continued downward pull —
  even within the same swipe that scrolled up to the top — takes over and drags the sheet
  closed; pulling back up hands control cleanly back to native scrolling. Implemented with
  non-passive `touchmove` + `preventDefault` (see the `useEffect` in `useSheetDrag`).
- [NEW] **Tap the dimmed scrim** anywhere closes (handler is on the whole `.sheet` wrapper; the
  `.sheet__panel` stops propagation), since the panel fills most of the height.
- Repo mapping: lift `useSheetDrag` into a shared hook and use it in `ThemeModal.jsx` and
  `HabitFormModal.jsx` (and any help/confirm sheet). Markup: `.sheet` wrapper → `.sheet__scrim`
  (styled by `scrimStyle`) + `.sheet__panel` (ref + `panelStyle`) containing a
  `.sheet__draghandle` (the `dragHandlers` grab zone) wrapping `.sheet__grab`.

## Habit Detail — swipe paging + header/stat polish
- [NEW] **Swipe between habits**: on the Detail screen, swipe **left** → next habit, swipe
  **right** → previous habit (right from the FIRST habit → back to Today). Shared-axis X
  motion: current view glides out a short distance + fades, content swaps, incoming view eases
  in from the opposite side + fades (short travel, no full-width hard slide). Direction-locked
  to horizontal (vertical drags scroll; small drags spring back). **Page dots** track position.
  Implemented as `useHSwipe({onPrev,onNext,hasPrev,hasNext})` in `reference/components.jsx`;
  wired in `DetailScreen` (`reference/screens.jsx`) around a `.detail__pager` wrapper.
- [NEW] **Header masthead**: clean toolbar — brand lockup left (tally-mark emblem directly
  beside the "Tally" wordmark, no divider), ghost icon actions right (Overview/Help/Appearance
  + accent "New"), hairline rule, then a serif greeting headline + dateline. No auto-keyboard
  on the new-habit form (name field is not autofocused).
- [NEW] **Check-in glyphs** are Lucide outline icons (Check / ChevronsRight / Minus) that
  inherit the button color; **count read** is center-aligned (44px) so it lines up with −/+;
  **week dots** are evenly distributed full-width with symmetric insets.
- [NEW] **Value-totals as a "ledger strip"**: one hairline-divided row (Total · Per day · This
  week) instead of duplicate stat boxes — fixes the wrap/overlap and reads more refined.
- [NEW] **Trend chart**: smooth Catmull-Rom curve + gradient fill, draw-in animation, a dotted
  "now" guide + end dot; unframed so the line spans full-width to today. Series ends naturally
  at the current day (removed the inconsistent extra end point that spiked the line).
- [NEW] **No text selection** across the app (`user-select:none`; inputs/textareas stay
  selectable) so dragging/swiping never highlights text.

## Reference files (source of truth)
`reference/`: `tally.css` (full stylesheet) · `directions.jsx` (DIRECTIONS, PALETTES,
resolveTweaks, tokensToCSS) · `data.jsx` (derived math + randomized seed) · `components.jsx` ·
`screens.jsx` · `modals.jsx` (sheets + `useSheetDrag`) · `wizard.jsx` · `app.jsx` (root wiring) ·
`Tally.html` (entry) · `ios-frame.jsx` + `tweaks-panel.jsx` (prototype scaffolding only — ignore
for the repo). This is the complete prototype build; it runs by opening `Tally.html`.
