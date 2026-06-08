// Theme engine. A user-defined theme stores only four colors (bg, surface, text,
// accent); the rest of the semantic tokens are DERIVED so a custom theme is always
// internally consistent (readable muted text, sensible borders, correct contrast on
// the accent, light/dark-aware shadows). Presets (dark/light) live in tokens.css and
// are applied via the data-theme attribute; custom themes are applied as inline vars.

import { uuid } from './factories.js'

export const PRESETS = [
  { id: 'dark', name: 'Dark' },
  { id: 'light', name: 'Light' },
]

// The three "Looks" (Directions) — the top-level identity axis above palettes. A Look owns
// STRUCTURE (radius + card elevation via the data-dir attribute in tokens.css) and the native
// display face; it also seeds a signature palette. The palette (meta.theme) stays independently
// changeable afterward. A and C share the editorial structure (serif, sharp, flat) and differ
// only by their default palette (light Ledger vs dark Nocturne); B (Bloom) is the soft/elevated
// grotesque outlier. `font` is used by applyFont when meta.font === 'default'.
export const DIRECTIONS = [
  { id: 'A', name: 'Ledger', tagline: 'Paper & ink. Editorial calm.', defaultTheme: 'light',
    font: "'Newsreader', Georgia, serif" },
  { id: 'B', name: 'Bloom', tagline: 'Soft & organic. Strength grows like a seed.', defaultTheme: 'bloom',
    font: "'Bricolage Grotesque', system-ui, sans-serif" },
  { id: 'C', name: 'Nocturne', tagline: 'The night edition of Ledger. Quiet and matte.', defaultTheme: 'dark',
    font: "'Newsreader', Georgia, serif" },
]

// Resolve meta.direction to its Look definition (defaults to Ledger).
export function resolveDirection(meta) {
  return DIRECTIONS.find((d) => d.id === (meta?.direction || 'A')) || DIRECTIONS[0]
}

// Apply the active Look: set data-dir, which drives per-Look radius + card elevation in
// tokens.css. Fonts are handled by applyFont (it reads the Look for the 'default' face).
export function applyDirection(meta, root = document.documentElement) {
  root.setAttribute('data-dir', resolveDirection(meta).id)
}

// Seed colors used as the starting point when creating a theme "from" a preset.
export const PRESET_SEED = {
  // Nocturne (the dark Ledger) and Ledger (light) base colors — must match tokens.css.
  dark: { bg: '#16110d', surface: '#1f1812', text: '#efe6d5', accent: '#d98c5f' },
  light: { bg: '#f3ede1', surface: '#faf7ef', text: '#211c14', accent: '#9e3b2d' },
}

// Curated palettes — the Claude Design "Ledger/Almanac" redesign library. Each carries
// the full hand-tuned token set (bg/surface/surface-2/text/text-muted/border/accent/
// accent-contrast/danger) + a 5-step heat ramp (bg -> accent), copied verbatim from the
// handoff's directions.jsx PALETTES. Top-level bg/surface/text/accent are kept for the
// theme grid swatches, resolveColors, and the editor seed; the rest is applied explicitly
// by applyTheme (see curatedTokens). Built-in: not editable or deletable. Habit colors are
// not per-theme here — they fall back to BASE_PALETTES by mode until tonal-ink lands.
export const CURATED_THEMES = [
  // ---- Nature · light ----
  { id: 'sand', name: 'Sand', dark: false, bg: '#f2ece0', surface: '#fbf6ec', text: '#2a2218', accent: '#bd6a3c',
    surface2: '#eadfca', textMuted: '#786a54', border: '#ddcfb6', accentContrast: '#fbf6ec', danger: '#b0492f',
    heat: ['#e7dcc6', '#d8b793', '#c89065', '#b3683f', '#8f4a2c'] },
  { id: 'birch', name: 'Birch', dark: false, bg: '#f4f1ea', surface: '#fcfaf4', text: '#2b2823', accent: '#a98b5e',
    surface2: '#e7e1d4', textMuted: '#7c7568', border: '#e0d9ca', accentContrast: '#fcfaf4', danger: '#ad5a40',
    heat: ['#e9e1d0', '#d8cbb0', '#c2ad86', '#a98b5e', '#876c43'] },
  { id: 'stone', name: 'Stone', dark: false, bg: '#eceae5', surface: '#f6f5f1', text: '#2c2b29', accent: '#5f6f6a',
    surface2: '#dddad2', textMuted: '#76746e', border: '#d2cfc7', accentContrast: '#f6f5f1', danger: '#a05544',
    heat: ['#dedbd3', '#b9bdb2', '#8e9a8c', '#647568', '#3f4f44'] },
  { id: 'fog', name: 'Fog', dark: false, bg: '#e7ebee', surface: '#f4f6f8', text: '#262c30', accent: '#5b7f93',
    surface2: '#d6dde2', textMuted: '#6c757b', border: '#cdd5db', accentContrast: '#f4f6f8', danger: '#a85c4e',
    heat: ['#dde3e8', '#bcc9d2', '#94aab8', '#6a8a9c', '#48697d'] },
  { id: 'clay', name: 'Clay', dark: false, bg: '#f0e7df', surface: '#faf3ec', text: '#2c2017', accent: '#b25a3e',
    surface2: '#e6d6c8', textMuted: '#7d6555', border: '#dcc7b4', accentContrast: '#faf3ec', danger: '#9e3f2c',
    heat: ['#e6d6c8', '#d3a98e', '#c07e5e', '#a85a3e', '#823f29'] },
  { id: 'sage', name: 'Sage', dark: false, bg: '#e9ece3', surface: '#f4f6ef', text: '#272b24', accent: '#6f8a5b',
    surface2: '#d9ded0', textMuted: '#6e7568', border: '#cfd5c5', accentContrast: '#f4f6ef', danger: '#a3573f',
    heat: ['#dde2d4', '#c0c9ad', '#9aac80', '#7a8f5b', '#5a6e3f'] },
  // ---- Nature · dark ----
  { id: 'charcoal', name: 'Charcoal', dark: true, bg: '#18181a', surface: '#212123', text: '#e9e7e3', accent: '#c89060',
    surface2: '#2b2b2e', textMuted: '#9a978f', border: '#34343a', accentContrast: '#18181a', danger: '#d4705f',
    heat: ['#222225', '#46403a', '#6e5b46', '#9a7a52', '#c89060'] },
  { id: 'slate', name: 'Slate', dark: true, bg: '#14181d', surface: '#1d232b', text: '#e4e8ed', accent: '#7c93b0',
    surface2: '#272f39', textMuted: '#909aa6', border: '#2c343f', accentContrast: '#14181d', danger: '#d67a6c',
    heat: ['#1c222b', '#2f3b49', '#45576b', '#5f7790', '#7c93b0'] },
  { id: 'ocean', name: 'Ocean', dark: true, bg: '#0e1820', surface: '#15222c', text: '#e3ecf0', accent: '#5fb0bb',
    surface2: '#1d2d38', textMuted: '#8aa0ab', border: '#263844', accentContrast: '#0e1820', danger: '#d77a6a',
    heat: ['#16242e', '#274350', '#356c79', '#499aa3', '#62c2c7'] },
  { id: 'pine', name: 'Pine', dark: true, bg: '#101813', surface: '#16211a', text: '#e3ece4', accent: '#5fa372',
    surface2: '#1e2c23', textMuted: '#8ba093', border: '#26342b', accentContrast: '#101813', danger: '#d57a64',
    heat: ['#16201a', '#23362a', '#345040', '#477059', '#5fa372'] },
  { id: 'ember', name: 'Ember', dark: true, bg: '#1a1310', surface: '#231a15', text: '#efe4da', accent: '#cf7f4f',
    surface2: '#2e221b', textMuted: '#a8907f', border: '#372a20', accentContrast: '#1a1310', danger: '#d96a55',
    heat: ['#241912', '#43291a', '#6e3f23', '#9c5b30', '#cf7f4f'] },
  { id: 'heather', name: 'Heather', dark: true, bg: '#16141c', surface: '#1f1c27', text: '#ebe7f0', accent: '#9a86b8',
    surface2: '#282431', textMuted: '#a39db0', border: '#332e3f', accentContrast: '#16141c', danger: '#d27a86',
    heat: ['#1f1b27', '#352e44', '#4f4564', '#6f6090', '#9a86b8'] },
  { id: 'bark', name: 'Bark', dark: true, bg: '#181210', surface: '#211915', text: '#efe5da', accent: '#b08152',
    surface2: '#2c211b', textMuted: '#a89381', border: '#382a20', accentContrast: '#181210', danger: '#d27358',
    heat: ['#231914', '#3d2a1d', '#5e4129', '#855b38', '#b08152'] },
  // Bloom — the signature palette of the Bloom Look (dusk plum + coral). Selectable on its own too.
  { id: 'bloom', name: 'Bloom', dark: true, bg: '#171121', surface: '#221a2e', text: '#f4eef7', accent: '#ef9079',
    surface2: '#2c2339', textMuted: '#b0a2bd', border: '#372d46', accentContrast: '#2a1620', danger: '#e57a6c',
    heat: ['#241b30', '#4d3a4a', '#84525a', '#bd6a62', '#ef9079'] },
  // ---- Monochrome · light ----
  { id: 'ash', name: 'Ash', dark: false, bg: '#eceae7', surface: '#f6f5f3', text: '#2a2a28', accent: '#4a4a46',
    surface2: '#dededa', textMuted: '#76746f', border: '#d4d2cd', accentContrast: '#f6f5f3', danger: '#9a5444',
    heat: ['#dedcd7', '#bcbab4', '#929089', '#65635d', '#3c3a35'] },
  { id: 'sepia', name: 'Sepia', dark: false, bg: '#efe8dd', surface: '#f8f2e8', text: '#2b231a', accent: '#6b5436',
    surface2: '#e3d8c6', textMuted: '#7c6f5d', border: '#dccdb4', accentContrast: '#f8f2e8', danger: '#9a5a3f',
    heat: ['#e6dcc8', '#cdb999', '#b0926a', '#8a6c45', '#5e472a'] },
  // ---- Monochrome · dark ----
  { id: 'graphite', name: 'Graphite', dark: true, bg: '#161616', surface: '#1e1e1e', text: '#e8e8e6', accent: '#cfcfca',
    surface2: '#282828', textMuted: '#9a9a96', border: '#333333', accentContrast: '#161616', danger: '#c77a6a',
    heat: ['#222222', '#3c3c3c', '#5e5e5e', '#8c8c8a', '#cfcfca'] },
  { id: 'carbon', name: 'Carbon', dark: true, bg: '#0e0e0f', surface: '#161617', text: '#e6e6e8', accent: '#a8a8ae',
    surface2: '#1f1f21', textMuted: '#8c8c90', border: '#28282b', accentContrast: '#0e0e0f', danger: '#cf6f60',
    heat: ['#1c1c1e', '#3a3a3d', '#5c5c60', '#828287', '#a8a8ae'] },
  { id: 'steel', name: 'Steel', dark: true, bg: '#121518', surface: '#1a1e22', text: '#e3e7ea', accent: '#9fb0bd',
    surface2: '#242a30', textMuted: '#8a939b', border: '#2c333a', accentContrast: '#121518', danger: '#cf7d6e',
    heat: ['#1d2227', '#333d45', '#4f5e69', '#71848f', '#9fb0bd'] },
]

// Habit-color palettes for the two built-in base themes.
const BASE_PALETTES = {
  dark: ['#5ba8e2', '#7cd6f9', '#5fd08a', '#9ae25b', '#e2b85b', '#ff8a5b', '#e2725b', '#e25b8c', '#b98ce2', '#a89f94', '#8a8a8a', '#c2bcae'],
  light: ['#5ba8e2', '#3f94b6', '#2e9e6b', '#7aa95b', '#c8763c', '#a8843c', '#d5577e', '#9a6bcb', '#a8997f', '#8a7c69', '#7e8f7e', '#7d7d7d'],
}

// Resolve any selectable theme id to its base colors (for the editor seed, etc.).
export function resolveColors(id, customThemes = []) {
  if (id === 'light') return PRESET_SEED.light
  if (id === 'dark') return PRESET_SEED.dark
  return [...CURATED_THEMES, ...customThemes].find((t) => t.id === id) || PRESET_SEED.dark
}

// The suggested habit colors that match a theme.
export function resolvePalette(id, customThemes = []) {
  if (id === 'dark') return BASE_PALETTES.dark
  if (id === 'light') return BASE_PALETTES.light
  const t = [...CURATED_THEMES, ...customThemes].find((x) => x.id === id)
  if (t?.palette) return t.palette
  // Custom themes (no palette): suggest the mode-appropriate base set.
  return isDarkTheme(id, customThemes) ? BASE_PALETTES.dark : BASE_PALETTES.light
}

// Is the given theme a dark theme (by background luminance)?
export function isDarkTheme(id, customThemes = []) {
  return luminance(resolveColors(id, customThemes).bg) < 0.5
}

// The inline CSS variables a custom theme sets (and that we clear when switching away).
export const THEME_VARS = [
  '--bg',
  '--surface',
  '--surface-2',
  '--text',
  '--text-muted',
  '--border',
  '--accent',
  '--accent-contrast',
  '--danger',
  '--shadow',
  '--heat-empty',
  '--heat-0',
  '--heat-1',
  '--heat-2',
  '--heat-3',
  '--heat-4',
]

function hexToRgb(hex) {
  let h = String(hex).replace('#', '')
  if (h.length === 3) h = h.split('').map((c) => c + c).join('')
  const n = parseInt(h, 16)
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 }
}

function rgbToHex({ r, g, b }) {
  const to = (x) => Math.max(0, Math.min(255, Math.round(x))).toString(16).padStart(2, '0')
  return `#${to(r)}${to(g)}${to(b)}`
}

// Blend t (0..1) of color b into color a.
export function mix(a, b, t) {
  const A = hexToRgb(a)
  const B = hexToRgb(b)
  return rgbToHex({ r: A.r + (B.r - A.r) * t, g: A.g + (B.g - A.g) * t, b: A.b + (B.b - A.b) * t })
}

// WCAG relative luminance (0 = black, 1 = white).
export function luminance(hex) {
  const { r, g, b } = hexToRgb(hex)
  const f = (c) => {
    const s = c / 255
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
  }
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b)
}

// Black or white text, whichever reads better on the given background.
export function contrastText(hex) {
  return luminance(hex) > 0.45 ? '#101114' : '#ffffff'
}

// Four chosen colors -> the full semantic token map.
export function deriveTokens({ bg, surface, text, accent }) {
  const dark = luminance(bg) < 0.5
  return {
    '--bg': bg,
    '--surface': surface,
    '--surface-2': mix(surface, text, 0.1),
    '--text': text,
    '--text-muted': mix(text, surface, 0.42),
    '--border': mix(surface, text, 0.16),
    '--accent': accent,
    '--accent-contrast': contrastText(accent),
    '--danger': dark ? '#f4796b' : '#c0492f',
    '--shadow': dark ? '0 8px 24px rgba(0,0,0,0.45)' : '0 6px 20px rgba(0,0,0,0.1)',
    // 5-step heat ramp bg -> accent (matches the curated palettes' explicit ramps).
    '--heat-0': mix(bg, accent, 0.08),
    '--heat-1': mix(bg, accent, 0.3),
    '--heat-2': mix(bg, accent, 0.52),
    '--heat-3': mix(bg, accent, 0.76),
    '--heat-4': accent,
    '--heat-empty': mix(bg, accent, 0.08), // = --heat-0, for the existing color-mix heatmap
  }
}

// The full CSS-variable map for a curated palette (explicit, hand-tuned values + ramp).
export function curatedTokens(t) {
  return {
    '--bg': t.bg,
    '--surface': t.surface,
    '--surface-2': t.surface2,
    '--text': t.text,
    '--text-muted': t.textMuted,
    '--border': t.border,
    '--accent': t.accent,
    '--accent-contrast': t.accentContrast,
    '--danger': t.danger,
    '--shadow': t.dark ? '0 8px 24px rgba(0,0,0,0.45)' : '0 6px 20px rgba(0,0,0,0.1)',
    '--heat-0': t.heat[0],
    '--heat-1': t.heat[1],
    '--heat-2': t.heat[2],
    '--heat-3': t.heat[3],
    '--heat-4': t.heat[4],
    '--heat-empty': t.heat[0],
  }
}

// Selectable font pairings (loaded in index.html). Each sets the display + body vars.
export const FONT_OPTIONS = [
  { id: 'default', name: 'Newsreader', display: "'Newsreader', Georgia, serif", body: "'Inter', system-ui, sans-serif" },
  { id: 'serif', name: 'Editorial', display: "'Fraunces', Georgia, serif", body: "'Inter', system-ui, sans-serif" },
  { id: 'rounded', name: 'Rounded', display: "'Quicksand', system-ui, sans-serif", body: "'Nunito Sans', system-ui, sans-serif" },
  { id: 'classic', name: 'Classic', display: "'Poppins', system-ui, sans-serif", body: "'Inter', system-ui, sans-serif" },
  { id: 'mono', name: 'Mono', display: "'Space Mono', ui-monospace, monospace", body: "'Inter', system-ui, sans-serif" },
]

// Apply the Type picker. 'default' (the first option) means "follow the active Look's native
// display face" — so Bloom reads in Bricolage, Ledger/Nocturne in Newsreader — with Inter body.
// Any explicit choice overrides both. --font-num follows --font-display via tokens.css.
export function applyFont(meta, root = document.documentElement) {
  const fontId = meta?.font || 'default'
  if (fontId === 'default') {
    root.style.setProperty('--font-display', resolveDirection(meta).font)
    root.style.setProperty('--font-body', "'Inter', system-ui, sans-serif")
    return
  }
  const opt = FONT_OPTIONS.find((f) => f.id === fontId) || FONT_OPTIONS[0]
  root.style.setProperty('--font-display', opt.display)
  root.style.setProperty('--font-body', opt.body)
}

export function createCustomTheme(partial = {}) {
  const seed = PRESET_SEED.dark
  return {
    id: `theme_${uuid()}`,
    name: partial.name || 'My theme',
    bg: partial.bg || seed.bg,
    surface: partial.surface || seed.surface,
    text: partial.text || seed.text,
    accent: partial.accent || seed.accent,
  }
}

// Apply meta.theme to the document: preset -> data-theme attribute; custom -> inline
// vars derived from the stored colors. Returns nothing; safe to call in an effect.
export function applyTheme(meta, root = document.documentElement) {
  THEME_VARS.forEach((v) => root.style.removeProperty(v))
  const id = meta?.theme || 'dark'
  if (id === 'dark' || id === 'light') {
    root.setAttribute('data-theme', id)
    return
  }
  const t = [...CURATED_THEMES, ...(meta?.customThemes || [])].find((x) => x.id === id)
  if (!t) {
    root.setAttribute('data-theme', 'dark')
    return
  }
  root.setAttribute('data-theme', 'custom')
  // Curated palettes carry an explicit hand-tuned token set (have a heat ramp);
  // user custom themes store only 4 colors and derive the rest.
  const tokens = t.heat ? curatedTokens(t) : deriveTokens(t)
  for (const [k, val] of Object.entries(tokens)) root.style.setProperty(k, val)
}
