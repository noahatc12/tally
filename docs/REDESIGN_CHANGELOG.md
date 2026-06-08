# Tally Redesign — Change Log

**Author of the redesign:** Claude Design (Anthropic) — interactive design tool.
**Date received:** 2026-06-08
**Source bundle:** `Tally.zip → tally-redesign/design_handoff_tally_redesign/` (README spec + HTML/CSS/Babel-React prototype).
**Status:** Design handoff — **specified, NOT yet implemented in this repo.** This document logs everything the redesign changes or adds versus the app currently shipped at `noahatc12.github.io/tally`. It is the implementation worklist.
**Fidelity:** High — final colors, type, spacing, radii, and interactions are all specified in the bundle's `tally.css` + `directions.jsx`.
**Identity:** New lead look **"Ledger / Almanac"** — serif, paper-and-ink, hairline-ruled, tally-mark motif. Philosophy held from our brief: *bold identity, calm temperament.*

> **Provenance note:** the visual identity, the three "Looks," the palette library, and the screen/feature spec below were produced by **Claude Design** from a brief I (JARVIS) prepared with Noah. The bundle is a prototype + written spec; the production implementation in this React/Vite codebase is still to be done.

> **Verification note:** deltas marked ✓-verified were checked against the live repo on 2026-06-08, not taken from the README on faith. Two README assumptions were corrected against actual code (see *Corrections* at the bottom).

---

## 1. Typography  `[CHANGED]`

| | Current (shipped) | Redesign |
|---|---|---|
| Display / numerals | **Space Grotesk** ✓ | **Newsreader** (serif) |
| Body / UI labels | Inter | Inter (unchanged) |
| Numeral/hero figures | Space Grotesk | Newsreader serif (`--font-num`) |
| Font presets | 5: Grotesk / Editorial(Fraunces) / Rounded(Quicksand) / Classic(Poppins) / Mono(Space Mono) ✓ | Type role becomes Look-driven; **explicitly do NOT use Fraunces** for the serif — use Newsreader |

- **`[CHANGED]`** `index.html` Google Fonts: add `Newsreader:opsz,wght@6..72,400..700`; keep Inter. (Space Grotesk / Bricolage Grotesque / JetBrains Mono only needed if the alternate Looks ship.)
- **`[NEW]` rule:** tiny functional labels (pills, weekday letters, button captions) stay on `--font-body` (Inter); serif is reserved for headings + numerals only.

## 2. Color & theme system  `[CHANGED / EXPANDED]`

- **`[NEW]` Three "Looks" (Directions)** — a top-level appearance axis above palettes, keyed on a `data-dir` attribute. Each is a full token bundle + a few structural CSS rules:
  - **A — Ledger** (default, light): serif, paper + oxblood ink (`--accent #9e3b2d`), hairline rules, 3–4px radius, flat cards, paper-grain texture, masthead tally-rule, framed/"engraved" heatmap & trend plates, small-caps labels.
  - **B — Bloom** (dark, soft): Bricolage Grotesque, dusk plum + coral (`--accent #ef9079`), 20px radius, elevated soft shadows, springy.
  - **C — Nocturne** (dark): the night edition of Ledger — same serif + tally motif, warm dark, muted ember accent (`--accent #d98c5f`), matte/flat, 4px radius.
- **`[CHANGED]` Palette library replaced & expanded** — current 13 curated themes (`midnight, forest, plum, ember, slate, charcoal, mocha, stone, clay, sand, mint, sky, rose`) ✓ are superseded by **18 palettes** in a Nature family + a new **Monochrome family**:
  - Light: Sand, Birch, Stone, Fog, Clay, Sage
  - Dark: Charcoal, Slate, Ocean, Pine, Ember, Heather, Bark
  - Mono: Ash, Sepia (light) · Graphite, Carbon, Steel (dark)
  - Exact token + heat-ramp values live in `directions.jsx` `PALETTES` — copy verbatim.
- **`[CHANGED]` Token set per theme** standardized to: `--bg --surface --surface-2 --text --text-muted --border --accent --accent-contrast --danger`, a **5-step heat ramp** `--heat-0…--heat-4` (bg→accent), plus `--radius --density --card-shadow --card-border`.
- **`[KEPT]` Custom-theme derivation** — same `deriveTokens` algorithm (4 user colors → surface-2/text-muted/border/accent-contrast/heat ramp via `color-mix`). Multiple saved named custom themes stay supported.
- **`[NEW]` Accent override axis** — `accent` = `auto|hex`, with swatches + a custom color picker, independent of palette.
- **`[NEW]` Habit "ink" mode** — `ink = color|tonal`. **Tonal**: every per-habit color becomes a shade of the theme accent (`color-mix(accent X%, surface)` by index) instead of its own hue. Requires routing every per-habit color through one `--habit` var.

## 3. Shape & spacing  `[CHANGED]`

- **`[CHANGED]` Radius** — current `--radius-sm/md/lg = 8/12/18px` ✓ → per-Look radius (Ledger/Nocturne **3–4px**, Bloom **20px**), user-tweakable sharp(3)/soft(22).
- **`[NEW]` `--density` multiplier** — compact .84 / regular 1 / roomy 1.2, scaling `--pad` (16px×d) and `--gap` (12px×d).
- **`[REMOVED]` Card `border-left: 3px solid var(--row-accent)`** ✓ (currently `app.css:282`) — intentionally dropped ("reads as a tired pattern"). Habit identity now comes from icon + week dots + strength bar.
- **`[CHANGED]` Cards** — `1px solid var(--border)`, flat by default; elevated = soft shadow (Bloom).

## 4. Icons  `[CHANGED]`

- **`[CHANGED]` Emoji → Lucide outline icons.** Current habits store an emoji `icon` (`💪📖🧘💧🏃…`) ✓. Redesign stores an `iconName` (Lucide PascalCase, e.g. `Dumbbell`, `Droplet`, `BookOpen`), rendered with `stroke: currentColor` so the glyph takes the habit ink. Add `lucide-react`.
- **`[NEW]` Serif monogram fallback** — when no `iconName`, render the habit's first initial in serif, in the ink color.

## 5. Screens & components

### Today  `[CHANGED]` → `TodayScreen` / `Header` / `HabitRow`
- **`[NEW]` Masthead header** — kicker "GOOD MORNING" (accent small-caps), `tally` wordmark in big Newsreader, date, and a **tally-mark rule** divider (two hairlines flanking a 5-stroke tally mark). Header actions: `▦ Overview · ? Help · ◑ Appearance · + New`.
- **`[CHANGED]` Daily quote** — current boxed `QuoteBanner` → a **borderless italic Newsreader pull-quote** + author; hidden when no habits.
- **`[CHANGED]` Day-progress band** — circular progress ring + "N of M done today" + per-habit dots; **hidden entirely at 0 habits** (NaN-safe).
- **`[NEW]` Time-of-day grouping** — habits grouped **Morning / Afternoon / Evening** via a new `tod` field on each habit (only habits due today), plus a muted **"Not due today"** group at the bottom. *(Current app shows a flat due/not-due list; the Header greeting already varies by hour ✓ but habits are not grouped by tod.)*
- **`[CHANGED]` Habit card** — icon tile (44px) · serif name + "After &lt;cue&gt;" · chevron · streak badge; strength meter; week-dots (today ringed); footer completion pill + type control (three-state / counter / timer). One-miss nudge line; strength only de-emphasized after **two** misses.

### Habit Detail  `[CHANGED]` → `HabitDetail`
- **`[NEW]` Serif hero** — huge `95 /100` strength figure + "Habit strength" + `▲ N over 6 wks` delta.
- **`[KEPT]` Stat trio** — current streak · best ever · this week %.
- **`[NEW]` Value-totals trio** (count/duration only) — duration: Total time · Per active day · This week (`179h 17m`); count: Total &lt;unit&gt; · Per active day · This week. Maps to existing `valueTotals` + `formatDuration`.
- **`[KEPT]` Strength trend** — hand-rolled SVG area+line; now in a framed "engraved" plate for Ledger/Nocturne.
- **`[CHANGED]` Year heatmap** — **scaled to fit width, no horizontal scrollbar** (`width:100%` + `viewBox` + `preserveAspectRatio`), replacing any overflow-x scroller.
- **`[NEW]` Backfill week** — last 7 days as tappable cells cycling done→skip→missed→clear, to log a forgotten day.

### Onboarding / first-run  `[NEW]` → `EmptyState`
- **`[NEW]`** Brand row + "Daily edition · vol. 1" rule, lede "Build habits that survive a **bad day**," three **promise rows** (Done / Skip / Miss), a **starter grid** (tap to add), CTA "Start tracking N habits" (disabled until ≥1), and a "Skip, I'll add my own" link. *(Current `EmptyState` exists but is minimal.)*
- **`[BUG GUARD]`** Skipping with nothing chosen must land on an **empty** Today — must NOT auto-load demo habits.

### Overview  `[CHANGED]` → `OverviewScreen`
- Big aggregate today %, all-habits **aggregate year heatmap** (shaded by share of that day's due habits done, fit-to-width), per-habit list (monogram/icon · name · **strength sparkline** · value · chevron → Detail).

### Year-in-Review share card  `[NEW]` — overlay (`✦`)
- Gradient card: brand + "&lt;year&gt; IN REVIEW", a headline ("You showed up &lt;N&gt; days this year, and got back up every time."), the strongest habit's heatmap, 3 stats (check-ins · best streak · perfect days), and a decorative "Share image" button.

### Appearance sheet  `[CHANGED]` → `ThemeModal`
- Bottom sheet with: **Look** (Ledger/Nocturne/Bloom) · **Theme** grid (Native + palettes + Custom) · **Accent** swatches + custom picker · **Habit ink** (Colourful/Tonal) · **Completed habits** (Soften/Collapse/Drawer/Keep) · **Type** (font) · **Reset demo data**. Custom card reveals 4 pickers (Background/Surface/Text/Accent) + Light/Dark toggle; rest derives.

### Habit form  `[CHANGED]` → `HabitFormModal`
- Fields: Name · **Ink** (7 theme-derived shades + custom picker) · **Icon** (Lucide grid + monogram cell) · **When of day** (`tod`, NEW) · **Track as** (Yes-no/Count/Timer + goal+unit) · **Schedule** (Every day / Weekdays / Every N / ×per week) · **After-cue** (habit stacking) · **Anchor to existing habit** · Time & place · Two-minute version. Footer: **Archive (keep history)** · Delete · Save.
- *(Note: the **After-cue + Anchor** fields already exist in the current form ✓ — the redesign restyles them and surfaces the cue as "After &lt;cue&gt;" on the Today card. **Archive** and the per-habit **ink picker** are new.)*

## 6. Behaviors  `[NEW / CHANGED]`

- **`[KEPT]` Forgiving model** — Done→streak+1 & strength rises; Skip neutral; Miss breaks streak & dips strength ~−8 (never to 0). All from `src/lib/*`, unchanged math.
- **`[KEPT]` Real-stopwatch timer** — Start records `startedAt`; Pause/Stop commits `value += elapsedMinutes` (never resets); Resume adds on top; Reset zeroes; `+5/+15` add minutes. Maps to existing `startTimer`/`stopTimer`. **Recommendation: label the button "Pause," not "Stop."**
- **`[NEW]` Completed-task treatment** (`completed` pref, persisted): **Soften** (default — done cards fade, get a ✓ seal, sink to group bottom) · **Collapse** (slim one-line row) · **Drawer** (collapsible "Done today (n)") · **Keep** (unchanged).
- **`[CHANGED]` Motion** — entrance is **transform-only** (`translateY`), never opacity-based (so print/PDF/screenshots never catch a blank frame). Theme changes are **instant** — no CSS transition on root bg/color (prevents half-applied flash).
- **`[CHANGED]` No visible scrollbars** anywhere (`scrollbar-width:none` + `::-webkit-scrollbar{width:0}`).

## 7. State / data model additions  `[NEW]`

New persisted `meta` fields (all simple, alongside existing `theme`, `font`, `customThemes`):
`direction` (A/B/C) · `palette` (id|custom) · `accent` (auto|hex) · `ink` (color|tonal) · `completed` (soften|collapse|drawer|none).
New per-habit fields: `tod` (morning/afternoon/evening) · `iconName` (Lucide) · `archived` flag.

> **Architecture is explicitly unchanged:** keep `src/lib/*` as pure functions of `(habits, completions, meta)`; keep `useHabits` the single source of truth; keep components presentational. No change to the core streak/strength/scheduling math.

## 8. Suggested implementation order (from the handoff)
1. Tokens & type — add Newsreader, set Ledger as default theme, verify the app still works recolored.
2. Palettes — add all 18 to `CURATED_THEMES`; wire the Appearance "Theme" grid.
3. Looks — add `data-dir` + per-Look CSS + the Look selector.
4. Component polish — borderless quote, Lucide icons + monogram, fit-to-width heatmaps, remove card `border-left`, masthead rule, time-of-day grouping.
5. New behaviors — completed-task modes, tonal ink, value-totals row, custom theme/accent pickers, "Pause"-labeled timer.
6. Bug guards — NaN-safe day-progress (hide at 0 habits), first-run "skip" → empty.

---

## Corrections to the handoff README (verified against this repo, 2026-06-08)
1. **Habit stacking is NOT net-new.** The README presents "After-cue" + "Anchor to an existing habit" as additions, but `HabitFormModal` already has the `cue` and `anchor` fields ✓. The redesign **restyles and surfaces** them (shows "After &lt;cue&gt;" on the Today card); it does not introduce the data model. Truly new on the form: per-habit **ink picker**, **Archive**, **`tod`**, and the Lucide **icon grid**.
2. **The hourly greeting already exists.** `Header.jsx` already varies "Good morning/afternoon/evening" by hour ✓ — but habits are not grouped by time of day. The **`tod` grouping** of habit cards is the new part, not the greeting.

## Files in the handoff bundle (reference, not drop-in)
`README.md` (spec) · `tally.css` (**the spec** — all classes + per-Look personality) · `directions.jsx` (`DIRECTIONS`, `PALETTES`, accent swatches, `resolveTweaks`, `tokensToCSS`) · `data.jsx` (seed + derived math mirroring `src/lib/*`) · `components.jsx` (TallyMark, ProgressRing, StrengthMeter, StreakBadge, WeekDots, ThreeState, CountControl, TimerControl, TrendChart, YearHeatmap, Sparkline, LucideIcon + `ICONS`) · `screens.jsx` (Today, Detail, Onboarding, ShareCard, Overview) · `modals.jsx` (Appearance, Habit form, Help) · `app.jsx` (root state machine + token export). `ios-frame.jsx` + `tweaks-panel.jsx` are prototype scaffolding — ignore for the repo.
