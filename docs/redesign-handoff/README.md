# Handoff: Tally Redesign ("Ledger / Almanac" identity + feature parity)

## Overview
This package redesigns the **Tally** habit tracker (repo: `noahatc12/tally`, React + Vite,
localStorage-only) with a strong editorial identity and adds the features that close the
gap to the repo's own v1/v2 spec. The lead look is **"Ledger / Almanac"**: a serif,
paper-and-ink, hairline-ruled aesthetic with the **tally mark** as the brand motif —
*bold identity, calm temperament*. Two alternate "Looks" and a large theme library ship
alongside it.

## About the Design Files
The files in this bundle are **design references built in HTML/CSS/vanilla-React-via-Babel**
— they demonstrate the intended look and behavior. They are **not** meant to be dropped into
the repo as-is. Your job is to **re-implement them inside the existing `noahatc12/tally`
codebase** (React 19 + Vite, plain CSS with CSS variables, the existing `src/lib/*` pure
logic, `src/components/*`, `src/styles/*`). The prototype deliberately reuses the repo's own
token names (`--bg`, `--surface`, `--accent`, `--heat-*`, `--font-display`…) and mirrors its
component structure, so most of this is a **token swap + targeted component edits**, not a
rewrite.

> The repo's architecture is excellent and unchanged: keep `src/lib/*` as pure functions of
> `(habits, completions, meta)`, keep `useHabits` as the single source of truth, keep
> components presentational. Nothing below requires changing the data model's core math.

## Fidelity
**High-fidelity.** Final colors, typography, spacing, radii, and interactions are all
specified. Recreate pixel-faithfully using the repo's existing CSS-variable system.

---

## Design system & tokens

### Type
- **Display / numerals:** `Newsreader` (serif). *(The repo currently ships Space Grotesk; the
  redesign moves the display face to Newsreader. Do NOT use Fraunces.)*
- **Body / UI labels:** `Inter`.
- Add to `index.html`:
  `Newsreader:opsz,wght@6..72,400..700` and keep `Inter`. (Space Grotesk + Bricolage Grotesque
  + JetBrains Mono are only needed if you also ship the alternate Looks — see below.)
- Font roles (CSS vars): `--font-display` (serif headings + big numbers), `--font-body`
  (Inter, all small/functional labels), `--font-num` (serif, the hero/stat figures).
  **Important:** tiny functional labels (pills, weekday letters, button captions) use
  `--font-body` (Inter), NOT the serif — reserve serif for headings + numerals.

### Color — the system
Every screen is driven by CSS custom properties on a root element. A **Direction (Look)**
sets type/shape/motif; a **Palette** recolors it; an **Accent** overrides the highlight; an
**Ink mode** controls per-habit colors. All of these are just token presets — exactly the
repo's `data-theme` / `deriveTokens` approach, extended.

**Token set (per theme):**
```
--bg --surface --surface-2 --text --text-muted --border
--accent --accent-contrast --danger
--heat-0 --heat-1 --heat-2 --heat-3 --heat-4   (5-step heatmap ramp, bg→accent)
--radius --density(spacing multiplier) --card-shadow --card-border
```
Derived tokens (when a user makes a CUSTOM theme from 4 colors — same algorithm as the repo's
`deriveTokens`):
```
--surface-2  = color-mix(in srgb, var(--text) 9%,  var(--surface))
--text-muted = color-mix(in srgb, var(--text) 50%, var(--bg))
--border     = color-mix(in srgb, var(--text) 16%, var(--bg))
--accent-contrast = (dark ? bg : #ffffff)
heat ramp    = color-mix(accent 8/30/52/76/100%, bg)
```

### The three "Looks" (Directions)
Add these as a top-level appearance choice. Each is a complete token bundle + a few
structural CSS rules keyed on a `data-dir` attribute.

- **A — Ledger (default, light).** Serif, paper + oxblood ink, hairline rules, 3px radius,
  flat cards, paper-grain texture (light only), masthead tally-rule, framed/"engraved"
  heatmap & trend plates, small-caps labels.
  Tokens: `--bg #f3ede1 · --surface #faf7ef · --surface-2 #ece2cf · --text #211c14 ·
  --text-muted #75694f · --border #dccdb1 · --accent #9e3b2d · --accent-contrast #faf7ef ·
  --danger #a8432f`. Heat: `#e7dcc6 #d6b393 #c4855f #a85740 #86322a`. Fonts: Newsreader +
  Inter. Radius 4. dark=false.
- **B — Bloom (dark, soft).** Bricolage Grotesque, dusk plum + coral, 20px radius, elevated
  soft shadows, springy. `--bg #171121 · --surface #221a2e · --surface-2 #2c2339 ·
  --text #f4eef7 · --text-muted #b0a2bd · --border #372d46 · --accent #ef9079 ·
  --accent-contrast #2a1620 · --danger #e57a6c`. Heat: `#241b30 #4d3a4a #84525a #bd6a62 #ef9079`.
  Radius 20. dark=true.
- **C — Nocturne (dark, the "night edition" of Ledger).** Same Newsreader serif + tally motif,
  inked on warm dark with a muted ember accent; matte, flat, 4px radius.
  `--bg #16110d · --surface #1f1812 · --surface-2 #2a2019 · --text #efe6d5 ·
  --text-muted #a8967e · --border #352a20 · --accent #d98c5f · --accent-contrast #16110d ·
  --danger #d4705f`. Heat: `#221a12 #4a3320 #7a4a2a #ab6238 #d98c5f`. Radius 4. dark=true.

`data-dir="A|B|C"` drives personality CSS (smcp labels + masthead + framed plates for A & C;
pill chrome for B). `data-dark="on|off"` gates the paper grain to light themes only.

### Palettes (recolor any Look) — add to the repo's `CURATED_THEMES`
Each is `{bg, surface, surface-2, text, text-muted, border, accent, accent-contrast, danger}` +
a 5-step heat ramp + a `dark` flag. Nature family then monochrome family:

| name | dark | bg | surface | text | accent |
|---|---|---|---|---|---|
| Sand | no | #f2ece0 | #fbf6ec | #2a2218 | #bd6a3c |
| Birch | no | #f4f1ea | #fcfaf4 | #2b2823 | #a98b5e |
| Stone | no | #eceae5 | #f6f5f1 | #2c2b29 | #5f6f6a |
| Fog | no | #e7ebee | #f4f6f8 | #262c30 | #5b7f93 |
| Clay | no | #f0e7df | #faf3ec | #2c2017 | #b25a3e |
| Sage | no | #e9ece3 | #f4f6ef | #272b24 | #6f8a5b |
| Charcoal | yes | #18181a | #212123 | #e9e7e3 | #c89060 |
| Slate | yes | #14181d | #1d232b | #e4e8ed | #7c93b0 |
| Ocean | yes | #0e1820 | #15222c | #e3ecf0 | #5fb0bb |
| Pine | yes | #101813 | #16211a | #e3ece4 | #5fa372 |
| Ember | yes | #1a1310 | #231a15 | #efe4da | #cf7f4f |
| Heather | yes | #16141c | #1f1c27 | #ebe7f0 | #9a86b8 |
| Bark | yes | #181210 | #211915 | #efe5da | #b08152 |
| **Ash** (mono) | no | #eceae7 | #f6f5f3 | #2a2a28 | #4a4a46 |
| **Sepia** (mono) | no | #efe8dd | #f8f2e8 | #2b231a | #6b5436 |
| **Graphite** (mono) | yes | #161616 | #1e1e1e | #e8e8e6 | #cfcfca |
| **Carbon** (mono) | yes | #0e0e0f | #161617 | #e6e6e8 | #a8a8ae |
| **Steel** (mono) | yes | #121518 | #1a1e22 | #e3e7ea | #9fb0bd |

Full surface-2/text-muted/border/danger/heat values for every palette are in
`directions.jsx` (the `PALETTES` object) — copy them verbatim.

### Spacing / shape
- `--density` multiplier (compact .84 / regular 1 / roomy 1.2) scales `--pad`(16px×d) and
  `--gap`(12px×d).
- `--radius` per Look; tweakable sharp(3) / soft(22).
- Cards: `border: 1px solid var(--border)`; flat by default, elevated = soft shadow.
  **No colored `border-left` accent on cards** (intentionally removed — it reads as a tired
  pattern). Habit identity comes from the icon, week dots, and strength bar.

---

## Screens / Views

> Mobile-first, single 480px column (the repo's `--maxw`). All shown inside an iPhone frame in
> the prototype — in the repo it's just the normal responsive app.

### 1. Today (the identity carrier) — maps to `TodayScreen` / `Header` / `HabitRow`
- **Masthead header:** kicker "GOOD MORNING" (accent, small-caps, tracked), wordmark `tally`
  in big Newsreader, date below. A **tally-mark rule** divider sits beneath (two hairlines
  flanking a small 5-stroke tally mark in accent). Header actions, left→right:
  `▦ Overview` · `? Help` · `◑ Appearance` · `+ New` (accent button).
  **Do not** put the tally marks glued to the wordmark — they live only in the rule/onboarding/
  share card.
- **Daily quote:** a borderless italic Newsreader pull-quote + author (NOT a boxed card).
  Hidden if no habits. Deterministic by date (`pickQuote`).
- **Day-progress band:** a circular progress ring (`pct`) + "N of M done today" + a row of
  per-habit dots. **Hidden entirely when there are 0 habits** (guard `due.length>0`; never
  render `NaN%` — guard `total ? round(done/total*100) : 0`).
- **Time-of-day groups:** habits grouped **Morning / Afternoon / Evening** (a `tod` field on
  each habit), only showing habits **due today** (`isDue`). A separate muted **"Not due today"**
  group at the bottom for the rest.
- **Habit card (`.hcard`):** icon tile (44px) · name (serif) + "After <cue>" · chevron ·
  streak badge (`▴ 13 d`). Then a **strength meter** (0–100 bar + value), a **week-dots** row
  (last 7 days, today ringed), and a footer with a **completion pill** (`% this week`) + the
  type-specific control:
  - binary → **three-state toggle** Done(✓)/Skip(↷)/Miss(–) — tap selected again to clear.
  - count → **counter** −/value/+ with `/goal unit`; reaching goal sets `done`.
  - duration → **timer** (see Interactions).
  - A one-miss **nudge** line appears after a single miss ("never miss twice"); the streak is
    only de-emphasized after two misses. **Never** guilt/HP-loss.

### 2. Habit Detail — maps to `HabitDetail`
Back bar (`‹ Today`) + `✎ Edit` + `✦ Share`. Head: icon + name + schedule label
(`schedLabel`: Daily / weekday list / Every N days / N× per week) + plan line
(after-anchor · time · place · two-minute min). Then:
- **Hero:** huge serif strength number `95 /100` + "Habit strength" + a `▲ N over 6 wks` delta.
- **Stat trio:** Current streak · Best ever · This week %.
- **Value-totals trio (count/duration only):** for duration → *Total time · Per active day ·
  This week* (formatted `179h 17m`, `34m`); for count → *Total <unit> · Per active day ·
  This week* (numbers). Maps to the repo's `valueTotals` + `formatDuration`.
- **Strength trend:** hand-rolled SVG area+line (no chart lib), framed plate in Ledger/Nocturne.
- **Year heatmap:** GitHub-style, **scaled to fit width (no horizontal scrollbar)** — render the
  SVG at `width:100%` + `viewBox` + `preserveAspectRatio`, do not use an overflow-x scroller.
- **Backfill week:** the last 7 days as tappable cells that cycle done→skip→missed→clear, so a
  forgotten day can be logged. *(Bonus over the repo.)*

### 3. Onboarding / first-run — maps to `EmptyState`
Brand row (`tally` + tally marks) + "Daily edition · vol. 1" rule. Lede "Build habits that
survive a **bad day**." + sub. Three **promise rows** explaining Done / Skip / Miss. A
**starter grid** (tap to add). CTA "Start tracking N habits" (disabled until ≥1) and a
"Skip. I'll add my own" link. **Bug to avoid:** skipping with nothing chosen must land on an
**empty** Today, NOT auto-load demo habits.

### 4. Overview — maps to `OverviewScreen`
Back + `✦`. Big aggregate today %, all-habits **aggregate year heatmap** (shaded by share of
that day's due habits done; same fit-to-width rule), and a per-habit list (monogram/icon ·
name · **strength sparkline** · strength value · chevron) linking to Detail.

### 5. Year-in-Review share card — overlay (`✦`)
A gradient card: brand + "<year> IN REVIEW", a headline ("You showed up <activeDays> days this
year, and got back up every time."), the strongest habit's heatmap, and 3 stats (check-ins ·
best streak · perfect days). Close + a (decorative) "Share image" button.

### 6. Appearance sheet — maps to `ThemeModal`
Bottom sheet: **Look** (Ledger/Nocturne/Bloom) · **Theme** grid (Native + all palettes + a
**Custom** card) · **Accent** swatches incl. a **custom color picker** · **Habit ink**
(Colourful / Tonal) · **Completed habits** (Soften/Collapse/Drawer/Keep) · **Type** (font) ·
**Reset demo data**. The **Custom** card reveals 4 color pickers (Background/Surface/Text/Accent)
+ a Light/Dark toggle; everything else derives. *(The repo already supports multiple saved
named custom themes — keep that; the prototype shows a single live custom for brevity.)*

### 7. Habit form — maps to `HabitFormModal`
Bottom sheet, fields: **Name** · **Ink** (7 theme-derived shades + custom color picker, all in
one aligned grid row) · **Icon** (a grid of **Lucide outline icons** + a "monogram" first cell)
· **When of day** · **Track as** (Yes-no / Count / Timer, with goal+unit for the latter two) ·
**Schedule** (Every day / Weekdays[day-chip picker] / Every N[number] / ×per week[number]) ·
**After-cue** (habit stacking) · **Anchor to an existing habit** (dropdown) · **Time & place** ·
**Two-minute version**. Footer: **Archive** (keep history) + **Delete** + **Save**.

---

## Interactions & Behavior
- **Check-ins** update `completions`; derived strength/streak/rate recompute (all from
  `src/lib/*`). Done→streak+1 & strength rises; Skip is neutral (streak unchanged); Miss breaks
  the streak and **dips** strength (~−8), never to 0 (the forgiving EWMA).
- **Counter:** −/+ adjust today's value; crossing the goal marks `done` and fires the
  celebration (once).
- **Timer (real stopwatch — important):** **Start** records `startedAt = Date.now()`. While
  running, show a live `m:ss` *session* readout and the running total = `value + (now-startedAt)`.
  **Pausing must NOT reset** — on **Pause/Stop**, commit `value += elapsedMinutes`; **Resume**
  starts a new session that adds on top. **Reset** is the only thing that zeroes. (`+5/+15` add
  minutes directly.) *(Recommend labeling the button "Pause" not "Stop".)* Maps to the repo's
  `startTimer`/`stopTimer` which already work this way.
- **Completed-task treatment** (`Completed habits` setting, persisted): **Soften** (default) —
  done cards fade, get a small ✓ seal on the icon, and **sink to the bottom of their group**;
  **Collapse** — done cards become a slim one-line row; **Drawer** — done cards move into a
  collapsible "Done today (n)" section; **Keep** — unchanged.
- **Tonal ink:** when on, each habit's color becomes a distinct **shade of the theme accent**
  (`color-mix(accent X%, surface)` per index) instead of its own hue — calmest with monochrome
  themes. Route every per-habit color through one `--habit` var so this is a single switch.
- **Entrance motion:** transform-only (`translateY`), **never opacity-based** — so print/PDF/
  screenshots never catch a blank frame. Theme changes are **instant** (do NOT put a CSS
  `transition` on the root background/color — it causes a half-applied look).
- **No visible scrollbars** anywhere (scrollbar-width:none + ::-webkit-scrollbar{width:0}).

## State Management
Unchanged from the repo: `useHabits` owns `habits`, `completions`, `meta`, `timers`,
`celebration` and persists each slice to localStorage. New **meta** fields to add for the new
prefs (all simple, persisted in `meta`): `direction` (A/B/C), `palette` (id|custom),
`accent` (auto|hex), `ink` (color|tonal), `completed` (soften|collapse|drawer|none), plus the
existing `theme`, `font`, `customThemes`.

## Design Tokens
All exact values are in `directions.jsx` (`DIRECTIONS`, `PALETTES`, `ACCENT_SWATCHES`,
`resolveTweaks`, `tokensToCSS`) and `tally.css` (every component class + the per-`data-dir`
personality rules). `tokensToCSS(t)` shows how to emit a shippable `:root{}` block for any
configuration.

## Assets
- **Icons:** [Lucide](https://lucide.dev) outline icons (MIT). The repo currently uses emoji;
  the redesign swaps to Lucide outline glyphs rendered with `stroke: currentColor` so they take
  the habit ink. Add `lucide-react` (or the icon font) to the repo. A habit stores an `iconName`
  (Lucide PascalCase, e.g. `Dumbbell`, `Droplet`, `BookOpen`, `Footprints`, `Sparkles`); when
  absent, fall back to a **serif monogram** (the habit's first initial in the ink color).
- **No raster assets / no hand-drawn SVG.** The tally-mark motif is CSS (vertical bars + a
  diagonal strike); the paper grain is an inline `feTurbulence` SVG data-URI at low opacity.
- **Fonts:** Newsreader + Inter from Google Fonts (+ Bricolage Grotesque / Space Grotesk /
  JetBrains Mono only if shipping the alternate Looks).

## Files (design references in this bundle)
- `Tally.html` — entry; loads React 18 + Babel + Lucide + the modules below.
- `tally.css` — the full design system (all classes, tokens, per-Look personality). **The spec.**
- `directions.jsx` — `DIRECTIONS`, `PALETTES`, accent swatches, `resolveTweaks`, `tokensToCSS`.
- `data.jsx` — seed data + the pure derived math mirroring `src/lib/*` (strength EWMA, streak,
  weekRate, yearGrid, trendSeries, aggregateYearGrid, isDue/schedLabel, valueTotals,
  formatDuration, pickQuote, persistence).
- `components.jsx` — TallyMark, ProgressRing, StrengthMeter, StreakBadge, WeekDots, ThreeState,
  CountControl, **TimerControl** (real stopwatch), TrendChart, YearHeatmap (fit-to-width),
  Sparkline, **LucideIcon** + the curated `ICONS` list.
- `screens.jsx` — Today, Detail, Onboarding, ShareCard, Overview.
- `modals.jsx` — Appearance sheet, Habit form, Help guide.
- `app.jsx` — root state machine + the Tweaks/Appearance wiring + token export.
- `ios-frame.jsx`, `tweaks-panel.jsx` — prototype scaffolding only; **ignore for the repo**
  (the iPhone frame and the designer Tweaks panel are not part of the product).

## Suggested implementation order
1. **Tokens & type:** add Newsreader, set the Ledger token values as the default theme in
   `tokens.css`; verify the existing app still works recolored.
2. **Palettes:** add all palettes to `CURATED_THEMES` (+ the monochrome ones); wire the
   Appearance "Theme" grid.
3. **Looks (Directions):** add the `data-dir` attribute + the per-Look CSS (serif/masthead/
   framed plates for A&C; pill chrome for B) and the Look selector.
4. **Component polish:** borderless quote, monogram→Lucide icons, fit-to-width heatmaps, remove
   card `border-left`, masthead rule, time-of-day grouping.
5. **New behaviors:** completed-task modes, tonal ink, value-totals row, custom theme/accent
   pickers; confirm the real-stopwatch timer is labeled "Pause".
6. **Bug guards:** NaN-safe day-progress (hide at 0 habits), first-run "skip" → empty.
