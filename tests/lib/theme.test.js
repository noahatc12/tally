import { describe, it, expect } from 'vitest'
import {
  deriveTokens,
  contrastText,
  mix,
  applyTheme,
  THEME_VARS,
  createCustomTheme,
} from '../../src/lib/theme.js'

describe('theme — color math', () => {
  it('contrastText picks dark text on light colors and white on dark', () => {
    expect(contrastText('#ffffff')).toBe('#101114')
    expect(contrastText('#000000')).toBe('#ffffff')
    expect(contrastText('#c7f94b')).toBe('#101114') // bright lime -> dark text
  })

  it('mix blends toward the second color', () => {
    expect(mix('#000000', '#ffffff', 0.5).toLowerCase()).toBe('#808080')
  })

  it('deriveTokens returns every theme variable', () => {
    const tokens = deriveTokens({ bg: '#0e0f12', surface: '#16181d', text: '#e8e8ea', accent: '#c7f94b' })
    for (const v of THEME_VARS) expect(tokens[v]).toBeTruthy()
    expect(tokens['--accent']).toBe('#c7f94b')
  })
})

describe('theme — applyTheme', () => {
  it('applies a preset via data-theme and clears inline vars', () => {
    const root = document.documentElement
    root.style.setProperty('--accent', '#123456') // simulate leftover custom var
    applyTheme({ theme: 'light', customThemes: [] }, root)
    expect(root.getAttribute('data-theme')).toBe('light')
    expect(root.style.getPropertyValue('--accent')).toBe('')
  })

  it('applies a custom theme as inline derived vars', () => {
    const root = document.documentElement
    const t = createCustomTheme({ name: 'Mine', accent: '#ff0066', bg: '#101010', surface: '#202020', text: '#fafafa' })
    applyTheme({ theme: t.id, customThemes: [t] }, root)
    expect(root.getAttribute('data-theme')).toBe('custom')
    expect(root.style.getPropertyValue('--accent')).toBe('#ff0066')
    expect(root.style.getPropertyValue('--accent-contrast')).toBe('#ffffff') // dark-ish pink -> white text
  })

  it('falls back to dark when the active custom theme is missing', () => {
    const root = document.documentElement
    applyTheme({ theme: 'theme_missing', customThemes: [] }, root)
    expect(root.getAttribute('data-theme')).toBe('dark')
  })
})
