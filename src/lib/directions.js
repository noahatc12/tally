// The token engine, ported verbatim from the Claude Design handoff (directions.jsx).
// Three "Looks" (Directions) as complete token bundles + a resolver that folds the finer
// tweaks (palette / accent / ink / density / radius / typeface / motion / heatmap / card)
// on top. resolveTweaks(t) returns { vars, attrs } applied to the .tally root: `vars` is the
// inline CSS-variable map, `attrs` the data-* attributes that drive tally.css personality.
// Math/structure copied as-is so the look matches the prototype exactly.

import { luminance } from './theme.js'

export const DIRECTIONS = {
  A: {
    id: 'A', name: 'Ledger',
    tagline: 'Editorial calm. Paper, ink, hairlines; your year as a personal almanac.',
    dark: false, habitColor: true, radius: 4, motif: 'tally',
    tokens: {
      '--bg': '#f3ede1', '--surface': '#faf7ef', '--surface-2': '#ece2cf',
      '--text': '#211c14', '--text-muted': '#75694f', '--border': '#dccdb1',
      '--accent': '#9e3b2d', '--accent-contrast': '#faf7ef', '--danger': '#a8432f',
      '--font-display': "'Newsreader', Georgia, serif", '--font-body': "'Inter', system-ui, sans-serif",
      '--font-mono': "'Inter', system-ui, sans-serif", '--font-num': "'Newsreader', Georgia, serif",
      '--card-shadow': 'none', '--card-border': '1px solid var(--border)',
    },
    heat: ['#e7dcc6', '#d6b393', '#c4855f', '#a85740', '#86322a'],
  },
  B: {
    id: 'B', name: 'Bloom',
    tagline: 'Soft and organic. The forgiving model made physical; strength grows like a seed.',
    dark: true, habitColor: true, radius: 20, motif: 'bloom',
    tokens: {
      '--bg': '#171121', '--surface': '#221a2e', '--surface-2': '#2c2339',
      '--text': '#f4eef7', '--text-muted': '#b0a2bd', '--border': '#372d46',
      '--accent': '#ef9079', '--accent-contrast': '#2a1620', '--danger': '#e57a6c',
      '--font-display': "'Bricolage Grotesque', system-ui, sans-serif", '--font-body': "'Inter', system-ui, sans-serif",
      '--font-mono': "'Inter', system-ui, sans-serif", '--font-num': "'Bricolage Grotesque', system-ui, sans-serif",
      '--card-shadow': '0 12px 34px rgba(0,0,0,0.42)', '--card-border': '1px solid var(--border)',
    },
    heat: ['#241b30', '#4d3a4a', '#84525a', '#bd6a62', '#ef9079'],
  },
  C: {
    id: 'C', name: 'Nocturne',
    tagline: 'The night edition of Ledger. Hand-set serif inked on warm dark with a muted ember accent; matte and quiet.',
    dark: true, habitColor: true, radius: 4, motif: 'tally',
    tokens: {
      '--bg': '#16110d', '--surface': '#1f1812', '--surface-2': '#2a2019',
      '--text': '#efe6d5', '--text-muted': '#a8967e', '--border': '#352a20',
      '--accent': '#d98c5f', '--accent-contrast': '#16110d', '--danger': '#d4705f',
      '--font-display': "'Newsreader', Georgia, serif", '--font-body': "'Inter', system-ui, sans-serif",
      '--font-mono': "'Inter', system-ui, sans-serif", '--font-num': "'Newsreader', Georgia, serif",
      '--card-shadow': 'none', '--card-border': '1px solid var(--border)',
    },
    heat: ['#221a12', '#4a3320', '#7a4a2a', '#ab6238', '#d98c5f'],
  },
}

export const ACCENT_SWATCHES = [
  { id: 'auto', label: 'Auto' },
  { id: '#e2725b', label: 'Terracotta' },
  { id: '#6f9c6a', label: 'Sage' },
  { id: '#5a8bd6', label: 'Slate blue' },
  { id: '#b8862f', label: 'Ochre' },
]

export const PALETTES = {
  auto: null,
  sand: { label: 'Sand', dark: false,
    tokens: { '--bg': '#f2ece0', '--surface': '#fbf6ec', '--surface-2': '#eadfca', '--text': '#2a2218', '--text-muted': '#786a54', '--border': '#ddcfb6', '--accent': '#bd6a3c', '--accent-contrast': '#fbf6ec', '--danger': '#b0492f' },
    heat: ['#e7dcc6', '#d8b793', '#c89065', '#b3683f', '#8f4a2c'] },
  birch: { label: 'Birch', dark: false,
    tokens: { '--bg': '#f4f1ea', '--surface': '#fcfaf4', '--surface-2': '#e7e1d4', '--text': '#2b2823', '--text-muted': '#7c7568', '--border': '#e0d9ca', '--accent': '#a98b5e', '--accent-contrast': '#fcfaf4', '--danger': '#ad5a40' },
    heat: ['#e9e1d0', '#d8cbb0', '#c2ad86', '#a98b5e', '#876c43'] },
  stone: { label: 'Stone', dark: false,
    tokens: { '--bg': '#eceae5', '--surface': '#f6f5f1', '--surface-2': '#dddad2', '--text': '#2c2b29', '--text-muted': '#76746e', '--border': '#d2cfc7', '--accent': '#5f6f6a', '--accent-contrast': '#f6f5f1', '--danger': '#a05544' },
    heat: ['#dedbd3', '#b9bdb2', '#8e9a8c', '#647568', '#3f4f44'] },
  fog: { label: 'Fog', dark: false,
    tokens: { '--bg': '#e7ebee', '--surface': '#f4f6f8', '--surface-2': '#d6dde2', '--text': '#262c30', '--text-muted': '#6c757b', '--border': '#cdd5db', '--accent': '#5b7f93', '--accent-contrast': '#f4f6f8', '--danger': '#a85c4e' },
    heat: ['#dde3e8', '#bcc9d2', '#94aab8', '#6a8a9c', '#48697d'] },
  clay: { label: 'Clay', dark: false,
    tokens: { '--bg': '#f0e7df', '--surface': '#faf3ec', '--surface-2': '#e6d6c8', '--text': '#2c2017', '--text-muted': '#7d6555', '--border': '#dcc7b4', '--accent': '#b25a3e', '--accent-contrast': '#faf3ec', '--danger': '#9e3f2c' },
    heat: ['#e6d6c8', '#d3a98e', '#c07e5e', '#a85a3e', '#823f29'] },
  sage: { label: 'Sage', dark: false,
    tokens: { '--bg': '#e9ece3', '--surface': '#f4f6ef', '--surface-2': '#d9ded0', '--text': '#272b24', '--text-muted': '#6e7568', '--border': '#cfd5c5', '--accent': '#6f8a5b', '--accent-contrast': '#f4f6ef', '--danger': '#a3573f' },
    heat: ['#dde2d4', '#c0c9ad', '#9aac80', '#7a8f5b', '#5a6e3f'] },
  charcoal: { label: 'Charcoal', dark: true,
    tokens: { '--bg': '#18181a', '--surface': '#212123', '--surface-2': '#2b2b2e', '--text': '#e9e7e3', '--text-muted': '#9a978f', '--border': '#34343a', '--accent': '#c89060', '--accent-contrast': '#18181a', '--danger': '#d4705f' },
    heat: ['#222225', '#46403a', '#6e5b46', '#9a7a52', '#c89060'] },
  slate: { label: 'Slate', dark: true,
    tokens: { '--bg': '#14181d', '--surface': '#1d232b', '--surface-2': '#272f39', '--text': '#e4e8ed', '--text-muted': '#909aa6', '--border': '#2c343f', '--accent': '#7c93b0', '--accent-contrast': '#14181d', '--danger': '#d67a6c' },
    heat: ['#1c222b', '#2f3b49', '#45576b', '#5f7790', '#7c93b0'] },
  ocean: { label: 'Ocean', dark: true,
    tokens: { '--bg': '#0e1820', '--surface': '#15222c', '--surface-2': '#1d2d38', '--text': '#e3ecf0', '--text-muted': '#8aa0ab', '--border': '#263844', '--accent': '#5fb0bb', '--accent-contrast': '#0e1820', '--danger': '#d77a6a' },
    heat: ['#16242e', '#274350', '#356c79', '#499aa3', '#62c2c7'] },
  pine: { label: 'Pine', dark: true,
    tokens: { '--bg': '#101813', '--surface': '#16211a', '--surface-2': '#1e2c23', '--text': '#e3ece4', '--text-muted': '#8ba093', '--border': '#26342b', '--accent': '#5fa372', '--accent-contrast': '#101813', '--danger': '#d57a64' },
    heat: ['#16201a', '#23362a', '#345040', '#477059', '#5fa372'] },
  ember: { label: 'Ember', dark: true,
    tokens: { '--bg': '#1a1310', '--surface': '#231a15', '--surface-2': '#2e221b', '--text': '#efe4da', '--text-muted': '#a8907f', '--border': '#372a20', '--accent': '#cf7f4f', '--accent-contrast': '#1a1310', '--danger': '#d96a55' },
    heat: ['#241912', '#43291a', '#6e3f23', '#9c5b30', '#cf7f4f'] },
  heather: { label: 'Heather', dark: true,
    tokens: { '--bg': '#16141c', '--surface': '#1f1c27', '--surface-2': '#282431', '--text': '#ebe7f0', '--text-muted': '#a39db0', '--border': '#332e3f', '--accent': '#9a86b8', '--accent-contrast': '#16141c', '--danger': '#d27a86' },
    heat: ['#1f1b27', '#352e44', '#4f4564', '#6f6090', '#9a86b8'] },
  bark: { label: 'Bark', dark: true,
    tokens: { '--bg': '#181210', '--surface': '#211915', '--surface-2': '#2c211b', '--text': '#efe5da', '--text-muted': '#a89381', '--border': '#382a20', '--accent': '#b08152', '--accent-contrast': '#181210', '--danger': '#d27358' },
    heat: ['#231914', '#3d2a1d', '#5e4129', '#855b38', '#b08152'] },
  ash: { label: 'Ash', dark: false,
    tokens: { '--bg': '#eceae7', '--surface': '#f6f5f3', '--surface-2': '#dededa', '--text': '#2a2a28', '--text-muted': '#76746f', '--border': '#d4d2cd', '--accent': '#4a4a46', '--accent-contrast': '#f6f5f3', '--danger': '#9a5444' },
    heat: ['#dedcd7', '#bcbab4', '#929089', '#65635d', '#3c3a35'] },
  sepia: { label: 'Sepia', dark: false,
    tokens: { '--bg': '#efe8dd', '--surface': '#f8f2e8', '--surface-2': '#e3d8c6', '--text': '#2b231a', '--text-muted': '#7c6f5d', '--border': '#dccdb4', '--accent': '#6b5436', '--accent-contrast': '#f8f2e8', '--danger': '#9a5a3f' },
    heat: ['#e6dcc8', '#cdb999', '#b0926a', '#8a6c45', '#5e472a'] },
  graphite: { label: 'Graphite', dark: true,
    tokens: { '--bg': '#161616', '--surface': '#1e1e1e', '--surface-2': '#282828', '--text': '#e8e8e6', '--text-muted': '#9a9a96', '--border': '#333333', '--accent': '#cfcfca', '--accent-contrast': '#161616', '--danger': '#c77a6a' },
    heat: ['#222222', '#3c3c3c', '#5e5e5e', '#8c8c8a', '#cfcfca'] },
  carbon: { label: 'Carbon', dark: true,
    tokens: { '--bg': '#0e0e0f', '--surface': '#161617', '--surface-2': '#1f1f21', '--text': '#e6e6e8', '--text-muted': '#8c8c90', '--border': '#28282b', '--accent': '#a8a8ae', '--accent-contrast': '#0e0e0f', '--danger': '#cf6f60' },
    heat: ['#1c1c1e', '#3a3a3d', '#5c5c60', '#828287', '#a8a8ae'] },
  slatemono: { label: 'Steel', dark: true,
    tokens: { '--bg': '#121518', '--surface': '#1a1e22', '--surface-2': '#242a30', '--text': '#e3e7ea', '--text-muted': '#8a939b', '--border': '#2c333a', '--accent': '#9fb0bd', '--accent-contrast': '#121518', '--danger': '#cf7d6e' },
    heat: ['#1d2227', '#333d45', '#4f5e69', '#71848f', '#9fb0bd'] },
  custom: { label: 'Custom', dark: false },
}

export const HEAT_PRESETS = {
  auto: null,
  forge: ['#e7dcc6', '#d6b393', '#c4855f', '#a85740', '#86322a'],
  bloom: ['#241b30', '#4d3a4a', '#84525a', '#bd6a62', '#ef9079'],
  signal: ['#161a1d', '#2c3a1c', '#587623', '#92bf2f', '#c8f25a'],
  github: ['#161b22', '#0e4429', '#006d32', '#26a641', '#39d353'],
  mono: ['#1a1c1f', '#3a3d42', '#6b6f76', '#9aa0a8', '#e7e9ec'],
}

const DENSITY = { compact: 0.84, regular: 1, roomy: 1.2 }
const RADIUS_MODE = { sharp: 3, regular: null, soft: 22 }
const TYPEFACE = {
  auto: null,
  grotesk: "'Space Grotesk', system-ui, sans-serif",
  serif: "'Newsreader', Georgia, serif",
  bricolage: "'Bricolage Grotesque', system-ui, sans-serif",
}

// Map our persisted meta to the tweak object resolveTweaks expects. During the port we
// only persist a subset; the rest take sensible defaults (auto / native).
export function metaToTweaks(meta = {}) {
  const sel = meta.theme || 'auto'
  // A saved custom theme stores only 4 colours; resolve it through the custom path so
  // resolveTweaks derives the rest (surface-2/muted/border/heat), exactly like the
  // prototype's inline "Custom". A named curated palette resolves directly; anything
  // else (auto / light / dark / unknown id) falls back to the Look's native palette.
  const saved = (meta.customThemes || []).find((th) => th.id === sel)
  let palette = 'auto'
  let custom = null
  if (sel === 'custom') palette = 'custom'
  else if (saved) { palette = 'custom'; custom = saved }
  else if (PALETTES[sel] && sel !== 'auto') palette = sel
  return {
    direction: meta.direction || 'A',
    palette,
    accent: meta.accent || 'auto',
    ink: meta.ink || 'color',
    completed: meta.completed || 'soften',
    density: meta.density || 'regular',
    radius: meta.radius || 'regular',
    typeface: meta.typeface || 'auto',
    motion: meta.motion || 'calm',
    heatmap: meta.heatmap || 'auto',
    cardStyle: meta.cardStyle || 'auto',
    customBg: custom?.bg || meta.customBg || '#14181d',
    customSurface: custom?.surface || meta.customSurface || '#1d232b',
    customText: custom?.text || meta.customText || '#e4e8ed',
    customAccent: custom?.accent || meta.customAccent || '#7c93b0',
    customDark: custom ? luminance(custom.bg) < 0.5 : (meta.customDark ?? true),
  }
}

// Fold tweaks -> { vars, attrs, dir, dark, heat }
export function resolveTweaks(t) {
  const dir = DIRECTIONS[t.direction] || DIRECTIONS.A
  const vars = { ...dir.tokens }
  let dark = dir.dark

  const customActive = t.palette === 'custom'
  const pal = (!customActive && t.palette && t.palette !== 'auto') ? PALETTES[t.palette] : null
  if (customActive) {
    vars['--bg'] = t.customBg; vars['--surface'] = t.customSurface
    vars['--text'] = t.customText; vars['--accent'] = t.customAccent
    vars['--surface-2'] = 'color-mix(in srgb, var(--text) 9%, var(--surface))'
    vars['--text-muted'] = 'color-mix(in srgb, var(--text) 50%, var(--bg))'
    vars['--border'] = 'color-mix(in srgb, var(--text) 16%, var(--bg))'
    vars['--accent-contrast'] = t.customDark ? t.customBg : '#ffffff'
    vars['--danger'] = '#c85c43'
    dark = !!t.customDark
  } else if (pal) { Object.assign(vars, pal.tokens); dark = pal.dark }

  if (t.accent && t.accent !== 'auto') {
    vars['--accent'] = t.accent
    vars['--accent-contrast'] = dark ? '#15110d' : '#ffffff'
  }

  const rMode = RADIUS_MODE[t.radius]
  const radius = rMode == null ? dir.radius : rMode
  vars['--radius'] = radius + 'px'
  vars['--density'] = String(DENSITY[t.density] ?? 1)

  if (t.typeface && t.typeface !== 'auto' && TYPEFACE[t.typeface]) {
    vars['--font-display'] = TYPEFACE[t.typeface]
    vars['--font-num'] = TYPEFACE[t.typeface]
  }

  if (t.cardStyle === 'elevated') {
    vars['--card-shadow'] = dir.dark ? '0 14px 36px rgba(0,0,0,0.45)' : '0 10px 26px rgba(60,40,20,0.10)'
    vars['--card-border'] = '1px solid color-mix(in srgb, var(--border) 70%, transparent)'
  } else if (t.cardStyle === 'flat') {
    vars['--card-shadow'] = 'none'
    vars['--card-border'] = '1px solid var(--border)'
  }

  const customHeat = ['color-mix(in srgb, var(--accent) 8%, var(--bg))', 'color-mix(in srgb, var(--accent) 30%, var(--bg))', 'color-mix(in srgb, var(--accent) 52%, var(--bg))', 'color-mix(in srgb, var(--accent) 76%, var(--bg))', 'var(--accent)']
  const heat = (t.heatmap && t.heatmap !== 'auto' && HEAT_PRESETS[t.heatmap]) || (customActive ? customHeat : (pal && pal.heat)) || dir.heat
  heat.forEach((c, i) => { vars['--heat-' + i] = c })

  const tdur = t.motion === 'off' ? '0ms' : t.motion === 'lively' ? '150ms' : '200ms'
  vars['--t'] = tdur

  const attrs = {
    'data-dir': dir.id,
    'data-habitcolor': dir.habitColor ? 'on' : 'off',
    'data-motion': t.motion || 'calm',
    'data-dark': dark ? 'on' : 'off',
    'data-completed': t.completed || 'soften',
  }

  return { vars, attrs, dir, dark, heat }
}

// Tonal ink: distinct shades of the live theme accent so every habit matches the active
// palette (resolves per theme via color-mix, like the prototype). buildInkMap returns the
// per-habit ink colour the screens apply as the --habit / --c var; in 'color' mode it's just
// the habit's own stored colour. Index over the FULL habit list so a habit's shade is stable
// across Today / Detail / Overview.
const INK_SH = [100, 74, 56, 42, 32, 24, 18, 14]
export const inkShade = (i) => `color-mix(in srgb, var(--accent) ${INK_SH[i % INK_SH.length]}%, var(--surface))`

export function buildInkMap(habits = [], ink = 'color') {
  const tonal = ink === 'tonal'
  return Object.fromEntries(habits.map((h, i) => [h.id, tonal ? inkShade(i) : h.color]))
}
