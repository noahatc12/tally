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

// Seed colors used as the starting point when creating a theme "from" a preset.
export const PRESET_SEED = {
  dark: { bg: '#0e0f12', surface: '#16181d', text: '#e8e8ea', accent: '#474747' },
  light: { bg: '#faf7f2', surface: '#ffffff', text: '#1f1b16', accent: '#e2725b' },
}

// Curated preset palettes (researched for contrast + cohesion). Each defines the four
// base colors PLUS a matching set of habit colors that look good on that theme. The
// rest of the token set is derived. Applied like custom themes (inline vars) but
// built-in: not editable or deletable.
export const CURATED_THEMES = [
  // Dark
  { id: 'midnight', name: 'Midnight', bg: '#0b1020', surface: '#141b2e', text: '#e6eaf2', accent: '#6aa9ff',
    palette: ['#6aa9ff', '#7cd6f9', '#9ae25b', '#c792ea', '#ff8a5b', '#5fd08a'] },
  { id: 'forest', name: 'Forest', bg: '#0e1410', surface: '#16201a', text: '#e7efe8', accent: '#5fd08a',
    palette: ['#5fd08a', '#9ae25b', '#e2b85b', '#7cd6f9', '#cf9b5b', '#e28c5b'] },
  { id: 'plum', name: 'Plum', bg: '#140f1a', surface: '#1e1726', text: '#ece6f2', accent: '#c792ea',
    palette: ['#c792ea', '#e28cc9', '#9aa9ff', '#7cd6f9', '#e2b85b', '#5fd08a'] },
  { id: 'ember', name: 'Ember', bg: '#140f0d', surface: '#211915', text: '#f1e9e3', accent: '#ff8a5b',
    palette: ['#ff8a5b', '#f9c14b', '#e2b85b', '#e2725b', '#c792ea', '#5fd08a'] },
  { id: 'slate', name: 'Slate', bg: '#0f1417', surface: '#192026', text: '#e4eaee', accent: '#3fb6c9',
    palette: ['#3fb6c9', '#6aa9ff', '#5fd08a', '#c792ea', '#e2b85b', '#e2725b'] },
  // Dark — muted / neutral
  { id: 'charcoal', name: 'Charcoal', bg: '#121212', surface: '#1c1c1c', text: '#e6e6e6', accent: '#9a948a',
    palette: ['#b3a895', '#9a948a', '#8f9e92', '#b0937a', '#8a93a3', '#c2bcae'] },
  { id: 'mocha', name: 'Mocha', bg: '#16110d', surface: '#211913', text: '#efe6da', accent: '#b08968',
    palette: ['#b08968', '#a89270', '#8f9e7e', '#9a8a76', '#7e8a9a', '#c2b39a'] },
  // Light — muted / neutral
  { id: 'stone', name: 'Stone', bg: '#f4f4f2', surface: '#ffffff', text: '#232323', accent: '#6f6f6f',
    palette: ['#7d7d7d', '#a8997f', '#7e8f7e', '#8a7c69', '#7d8a9a', '#9c8a8a'] },
  { id: 'clay', name: 'Clay', bg: '#f2ece1', surface: '#fffdf9', text: '#2a241c', accent: '#a87f54',
    palette: ['#a87f54', '#8a9a7d', '#7d8a9a', '#b07d6b', '#9a8aa8', '#6f6f6f'] },
  { id: 'sand', name: 'Sand', bg: '#f6f1e7', surface: '#ffffff', text: '#2a2722', accent: '#c8763c',
    palette: ['#c8763c', '#a8843c', '#7aa95b', '#3f94b6', '#b5638c', '#c95b5b'] },
  { id: 'mint', name: 'Mint', bg: '#f1f7f4', surface: '#ffffff', text: '#1e2622', accent: '#2e9e6b',
    palette: ['#2e9e6b', '#3f94b6', '#7aa95b', '#c8763c', '#9a6bcb', '#c95b7a'] },
  { id: 'sky', name: 'Sky', bg: '#eef4fb', surface: '#ffffff', text: '#1b2430', accent: '#2f6fed',
    palette: ['#2f6fed', '#3f94b6', '#2e9e6b', '#c8763c', '#9a6bcb', '#c95b7a'] },
  { id: 'rose', name: 'Rose', bg: '#fbf1f3', surface: '#ffffff', text: '#2a1f23', accent: '#d5577e',
    palette: ['#d5577e', '#c95b5b', '#9a6bcb', '#3f94b6', '#2e9e6b', '#c8763c'] },
]

// Habit-color palettes for the two built-in base themes.
const BASE_PALETTES = {
  dark: ['#5ba8e2', '#7aa95b', '#e2725b', '#b98ce2', '#a89f94', '#8a8a8a', '#c2bcae', '#e2b85b'],
  light: ['#5ba8e2', '#7aa95b', '#c8763c', '#b98ce2', '#a8997f', '#7d7d7d', '#8a7c69', '#d5577e'],
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
    '--heat-empty': mix(surface, text, 0.06),
  }
}

// Selectable font pairings (loaded in index.html). Each sets the display + body vars.
export const FONT_OPTIONS = [
  { id: 'default', name: 'Grotesk', display: "'Space Grotesk', system-ui, sans-serif", body: "'Inter', system-ui, sans-serif" },
  { id: 'serif', name: 'Editorial', display: "'Fraunces', Georgia, serif", body: "'Inter', system-ui, sans-serif" },
  { id: 'rounded', name: 'Rounded', display: "'Quicksand', system-ui, sans-serif", body: "'Nunito Sans', system-ui, sans-serif" },
  { id: 'classic', name: 'Classic', display: "'Poppins', system-ui, sans-serif", body: "'Inter', system-ui, sans-serif" },
  { id: 'mono', name: 'Mono', display: "'Space Mono', ui-monospace, monospace", body: "'Inter', system-ui, sans-serif" },
]

export function applyFont(meta, root = document.documentElement) {
  const opt = FONT_OPTIONS.find((f) => f.id === (meta?.font || 'default')) || FONT_OPTIONS[0]
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
  const tokens = deriveTokens(t)
  for (const [k, val] of Object.entries(tokens)) root.style.setProperty(k, val)
}
