import { describe, it, expect, beforeEach } from 'vitest'
import { loadAll, migrate, readRaw, KEYS } from '../../src/lib/storage.js'
import { SCHEMA_VERSION } from '../../src/lib/factories.js'

describe('storage', () => {
  beforeEach(() => localStorage.clear())

  it('loadAll returns sane defaults on empty storage', () => {
    const s = loadAll()
    expect(s.habits).toEqual([])
    expect(s.completions).toEqual({})
    expect(s.meta.schemaVersion).toBe(SCHEMA_VERSION)
    expect(s.meta.theme).toBe('dark')
    expect(s.meta.customThemes).toEqual([])
  })

  it('backfills customThemes for pre-existing meta missing the field', () => {
    localStorage.setItem(KEYS.meta, JSON.stringify({ schemaVersion: 1, theme: 'light', points: 0 }))
    const s = loadAll()
    expect(s.meta.customThemes).toEqual([])
    expect(s.meta.theme).toBe('light')
  })

  it('degrades to null on corrupt JSON rather than throwing', () => {
    localStorage.setItem(KEYS.habits, '{not valid json')
    expect(readRaw(KEYS.habits)).toBeNull()
    expect(() => loadAll()).not.toThrow()
    expect(loadAll().habits).toEqual([])
  })

  it('migrate stamps the current schema version on a versionless state', () => {
    const out = migrate({ habits: [], completions: {}, meta: {} })
    expect(out.meta.schemaVersion).toBe(SCHEMA_VERSION)
  })

  it('migrate preserves existing meta fields', () => {
    const out = migrate({ habits: [], completions: {}, meta: { theme: 'light', points: 12 } })
    expect(out.meta.theme).toBe('light')
    expect(out.meta.points).toBe(12)
  })
})
