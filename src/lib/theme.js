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
// base colors; the rest of the token set is derived. Applied like custom themes
// (inline vars) but built-in: not editable or deletable.
export const CURATED_THEMES = [
  // Dark
  { id: 'midnight', name: 'Midnight', bg: '#0b1020', surface: '#141b2e', text: '#e6eaf2', accent: '#6aa9ff' },
  { id: 'forest', name: 'Forest', bg: '#0e1410', surface: '#16201a', text: '#e7efe8', accent: '#5fd08a' },
  { id: 'plum', name: 'Plum', bg: '#140f1a', surface: '#1e1726', text: '#ece6f2', accent: '#c792ea' },
  { id: 'ember', name: 'Ember', bg: '#140f0d', surface: '#211915', text: '#f1e9e3', accent: '#ff8a5b' },
  { id: 'slate', name: 'Slate', bg: '#0f1417', surface: '#192026', text: '#e4eaee', accent: '#3fb6c9' },
  // Light
  { id: 'sand', name: 'Sand', bg: '#f6f1e7', surface: '#ffffff', text: '#2a2722', accent: '#c8763c' },
  { id: 'mint', name: 'Mint', bg: '#f1f7f4', surface: '#ffffff', text: '#1e2622', accent: '#2e9e6b' },
  { id: 'sky', name: 'Sky', bg: '#eef4fb', surface: '#ffffff', text: '#1b2430', accent: '#2f6fed' },
  { id: 'rose', name: 'Rose', bg: '#fbf1f3', surface: '#ffffff', text: '#2a1f23', accent: '#d5577e' },
]

// Resolve any selectable theme id to its base colors (for the editor seed, etc.).
export function resolveColors(id, customThemes = []) {
  if (id === 'light') return PRESET_SEED.light
  if (id === 'dark') return PRESET_SEED.dark
  return [...CURATED_THEMES, ...customThemes].find((t) => t.id === id) || PRESET_SEED.dark
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
