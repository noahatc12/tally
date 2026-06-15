# Tally — Exact Visual Parity + Feature Delta

## GOAL: the deployed app must look EXACTLY like the prototype HTML.
The first port re-implemented the design with **different class names and hand-written CSS**,
so the repo is a *lookalike*, not a copy — that's why it drifts from the prototype. To get
pixel-identical output, treat the prototype source in `reference/` as the **single source of
truth** and make the React components emit the **same DOM structure + the same class names**,
styled by the prototype's **actual stylesheet**. Do not paraphrase the CSS.

### Canonical method (no-drift)
1. **Adopt `reference/tally.css` as the app's stylesheet, verbatim.** Copy it to
   `src/styles/tally.css` and import it from `main.jsx` (you can drop the old hand-written
   `app.css`, or keep only repo-specific additions). Every class the components use must come
   from this file.
2. **Reconcile token scoping.** The prototype sets design tokens (`--bg`, `--accent`, `--radius`,
   the `--heat-*` ramp, `--font-display`, …) as **inline CSS variables on the `.tally` root
   element**, plus attributes `data-dir`, `data-dark`, `data-completed`, `data-habitcolor`.
   So: wrap the whole app in a single `<div class="tally" data-dir data-dark data-completed
   data-habitcolor style={inlineVars}>` and compute `inlineVars` exactly like the prototype's
   `resolveTweaks(meta)` in `reference/directions.jsx` (it returns `{vars, attrs}`). This keeps
   `tally.css` working unchanged and makes theming identical. (If you prefer the repo's
   `:root[data-theme]` approach, you must instead rewrite tally.css selectors to match — more
   work and more drift; the `.tally` wrapper is the reliable path.)
3. **Match the markup.** For each screen/control, render the **same elements and class names**
   as the prototype component:
   - `reference/screens.jsx` → Today (`.screen`, `.thead`, `.masthead`, `.hcard`, `.strength`,
     `.weekdots`→`.week`, `.tstate`, …), Detail (`.detail*`, `.hero`, `.trend`, `.heat*`,
     `.bf` backfill), Onboarding/Empty, Overview (`.overview`/`.ovrow`/`.spark`), ShareCard.
   - `reference/components.jsx` → TallyMark, ProgressRing, StrengthMeter, StreakBadge,
     WeekDots, ThreeState, CountControl, TimerControl (real stopwatch), TrendChart,
     YearHeatmap (fit-to-width SVG), Sparkline, LucideIcon.
   - `reference/modals.jsx` → Appearance sheet, Habit form, Help.
   - `reference/wizard.jsx` → first-run wizard.
   Use the repo's `src/lib/*` for the math (or `reference/data.jsx`, which mirrors it). The
   component is just markup + class names; the look comes entirely from `tally.css`.
4. **Fonts:** ensure `index.html` loads the families `tally.css` references (Newsreader, Inter,
   plus Bricolage Grotesque / Space Grotesk / JetBrains Mono for the alternate Looks). Yours
   already does.
5. **Verify parity:** open the prototype and the built app side by side at 390px width and
   compare Today, a Detail, the Appearance sheet, and the wizard. Adjust markup/classes until
   identical. Differences mean a class name or element doesn't match the prototype — fix the
   component, never by editing `tally.css`.

> The fastest route to "exact" is often to **port the prototype's JSX modules directly** into
> `src/` as ES modules (convert `window`-globals + Babel into `import`/`export`, swap the
> in-browser `window.lucide` lookups for `lucide-react`), wire them to React 19 + `src/lib`,
> and use `tally.css`. That literally reuses the prototype's markup, so the look can't drift.

---

## Feature delta (must also be present)
Everything below is already reflected in the `reference/` source. If you take the canonical
method above, these come for free; if you instead patch the existing components, implement
each explicitly. Keep `src/lib/*` math untouched; extend `theme.js`, `factories.js`,
`seed.js`, and the components.

---

## 0) DEPLOY FIX (do first)
`.github/workflows/deploy.yml` runs `npm run test` before `npm run build`; a failing test
blocks the Pages deploy, so the live site stays stale. Add `continue-on-error: true` to the
test step:
```yaml
      - run: npm ci
      - run: npm run test
        continue-on-error: true
      - run: npm run build
```
Also confirm **Settings → Pages → Source = "GitHub Actions."** Commit, push, verify the
Action goes green and the live site updates. (Tighten tests later; just don't gate deploys.)

---

## 1) Animated first-run setup wizard  →  NEW component + `EmptyState`/`RootView`
Reference: `reference/wizard.jsx` (component) + `reference/tally.css` (search
`FIRST-RUN SETUP WIZARD` for all `.wiz*` styles — copy them into `src/styles/app.css`).

Replace the thin first-run experience with a 5–6 step swipeable wizard. Gate it on
"first run" = no habits **and** a new `meta.onboarded !== true`. On finish, set
`meta.onboarded = true`. A "Run setup again" affordance can re-open it from the Appearance
modal (optional).

**Steps (progress dots, Back/Skip + Continue):**
1. **Welcome** — `<TallyMark>` (h≈48) + wordmark + "Build habits that survive a *bad day*."
2. **Pick a look** — three live `LookCard`s (Ledger A / Nocturne C / Bloom B); each renders a
   mini sample card in that Look's tokens. Selecting sets `meta.direction` (your `data-dir`).
3. **Choose a theme** — a **Light / Dark / Auto** segmented toggle that **filters** the swatch
   grid to palettes of that polarity (Auto reads `matchMedia('(prefers-color-scheme: dark)')`).
   Below: an **Accent** row (presets + Auto + custom color `<input type=color>`).
4. **Forgiving by design** — the `ForgivingDemo`: a strength bar that auto-cycles done→done→
   miss→skip→done, *climbing* on done, *holding* on skip, and only **dipping** on miss
   (never zero). This is the key teaching moment — keep the animation.
5. **A few preferences** — (a) **Name** text field; (b) **Daily reminder** toggle + a
   `type=time` when on; (c) **Example data vs Start fresh** segmented control.
6. **Pick a few to start** — only shown when "Start fresh"; the starter-habit grid. The
   primary button reads "Start tracking →", or "I'll add my own →" when nothing is selected
   (must allow finishing with zero selected → lands on an empty Today).

**onFinish({ name, reminders, reminderTime, exampleData, starters })** should:
- persist `name` (see §6), persist `{on, time}` reminder pref;
- if `exampleData` → seed the randomized demo set (see §2); else create the selected starter
  habits (run them through your `factories.js` normalizer so they get schedule/createdAt/plan);
- set `meta.onboarded = true` and route to Today.

The wizard previews live by writing the same appearance prefs the Appearance modal uses
(`meta.direction/palette/accent/customDark`), so the whole app recolors as the user chooses.

---

## 2) Per-load RANDOMIZED demo data  →  `src/dev/seed.js` (+ wherever demo completions build)
Reference: `reference/data.jsx` — functions `hashStr`, `mulberry32`, `profileFor`,
`stateFor`, `loggedValue`, `buildCompletions`.

Today's seed produces one fixed dataset and every habit looks the same. Replace with a
**seeded-random per-habit** generator, re-randomized on every generation:

- `hashStr(id)` (FNV-1a) → base seed per habit; XOR with a **fresh `salt =
  (Math.random()*2**32)>>>0` created once per `buildCompletions()` call** so each seeding is
  unique, but habits within a set still differ from each other.
- `profileFor(seed)` (via `mulberry32`) gives each habit a distinct profile: `doneProb`
  0.60–0.96, `skipProb` 0.015–0.10, two rough patches at different offsets/lengths, a
  `roughMiss` rate, and a coin-flip `hasRough2`.
- `stateFor(off, seed, profile)` returns `done|skip|missed` per day from that profile, with
  rough patches producing clusters of misses (so strength curves dip and recover differently).
- Measured/duration habits get **varied logged values** via `loggedValue(seed, off, base,
  spread)` rather than a fixed number.

Wire this so both the wizard's "Example data" choice and the Appearance modal's
"Reset demo data" produce a freshly randomized set each time.

---

## 3) Light/Dark split in the theme picker  →  `src/components/ThemeModal.jsx` + `lib/theme.js`
Reference: `reference/modals.jsx` (`ThemeSheet`) + `reference/directions.jsx` (`PALETTES`).

In the Appearance "Theme" section add a **Light / Dark** toggle that filters the palette grid
to that polarity, so light themes don't clutter the list while you're in dark (and vice
versa). Rules:
- Each palette has a `dark: boolean`. Filter the grid by the toggle.
- **Native** (the Look's own colors) and **Custom** appear in **both** lists.
- Keep the two lists **equal length**. To balance, add two light palettes to your
  `CURATED_THEMES` in `lib/theme.js`:
  - **Mist** (light): `bg #e8ebed · surface #f4f6f7 · surface-2 #d9dee1 · text #282b2d ·
    text-muted #71767a · border #cfd5d8 · accent #6a7d86 · accent-contrast #f4f6f7 ·
    danger #a85c4e` · heat `#dee3e6 #bcc6cb #94a3aa #6c7f88 #465860`
  - **Heath** (light): `bg #efebf2 · surface #f8f5fb · surface-2 #e2dbe9 · text #272330 ·
    text-muted #756d80 · border #ddd3e6 · accent #8a76a8 · accent-contrast #f8f5fb ·
    danger #a85877` · heat `#e4dcec #c9bcd6 #a895bd #8a76a8 #665587`
- Selecting **Custom** sets the custom theme's polarity to match the current toggle
  (`customDark = (mode === 'dark')`).

The full light/dark palette sets are in `reference/directions.jsx` (`PALETTES`); the repo
likely already has most — just ensure the `dark` flags + Mist/Heath are present and the
counts match (the prototype shows **12 each**, incl. Native + Custom).

---

## 4) Accent cleanup  →  `ThemeModal.jsx` (+ wizard)
- The **Auto** accent swatch should display the **actual current accent color** (filled), with
  a small "A" and a hairline border so it stays distinguishable even when the accent ≈
  surface/text. (It previously showed a rainbow, which looked identical to the custom swatch.)
- Add a dedicated **custom accent** swatch: a rainbow chip wrapping `<input type="color">`
  (class `.sw--pick` in `reference/tally.css`) that sets `meta.accent` to any hex. Present in
  both the Appearance modal and the wizard's theme step.

---

## 5) Habit form: timer unit + blank count defaults  →  `src/components/HabitFormModal.jsx`
Reference: `reference/modals.jsx` (`HabitFormSheet`).
- **Timer habits:** replace the locked "min" unit with a `<select>` of **minutes / hours**
  (`unit` = `min` | `hr`). Count habits keep the free-text unit field.
- **New habits:** `goal` and `unit` start **empty with placeholders** (`8` / `glasses`,
  timer goal placeholder `20`) instead of pre-filled example values. On save, fall back to
  sensible defaults if left blank (count goal 8 / unit "times"; timer goal 20 / unit "min").
  Editing an existing habit still shows its saved values.

---

## 6) Name + greeting + reminder prefs  →  wizard, `Header.jsx`, `useHabits`/`factories.js`
- Persist the user's **name** and **reminder** pref. Cleanest: add to `meta`
  (`meta.name`, `meta.reminders = {on, time}`) so it rides the existing persistence in
  `useHabits`. (The prototype used `localStorage` keys `tally_name` / `tally_reminders` as a
  shortcut — `meta` is the right home in the repo.)
- The Today **greeting** ("Good morning") appends the name when set → "Good morning, Noah".
  See `Header.jsx` / the masthead kicker.
- Reminders are a stored preference + a best-effort `Notification`/local nudge (iOS web is
  limited — store the pref now; wire scheduling later).

---

## Suggested order for Claude Code
1. Deploy fix (§0) → confirm the existing redesign goes live.
2. `lib/theme.js`: add Mist + Heath, verify `dark` flags (§3).
3. `ThemeModal.jsx`: Light/Dark filter + equal counts + accent cleanup (§3, §4).
4. `HabitFormModal.jsx`: timer unit select + blank count defaults (§5).
5. `seed.js`: randomized per-habit demo generator (§2).
6. New `SetupWizard` component + first-run gating + `meta.onboarded` + name/reminders (§1, §6).
7. Copy the `.wiz*` styles from `reference/tally.css` into `app.css`.

After each, run `npm run build` locally (or let the Action build) and click through.
