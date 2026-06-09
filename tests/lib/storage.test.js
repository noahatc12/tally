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
    expect(s.meta.theme).toBe('light')
    expect(s.meta.direction).toBe('A')
    expect(s.meta.customThemes).toEqual([])
    expect(s.meta.font).toBe('default')
  })

  it('v1->v2 migration maps a dark-theme user to the Nocturne Look (C)', () => {
    const out = migrate({ habits: [], completions: {}, meta: { schemaVersion: 1, theme: 'dark' } })
    expect(out.meta.schemaVersion).toBe(SCHEMA_VERSION)
    expect(out.meta.direction).toBe('C')
    expect(out.meta.theme).toBe('dark')
  })

  it('v1->v2 migration lands a light/curated user on the Ledger Look (A)', () => {
    const out = migrate({ habits: [], completions: {}, meta: { schemaVersion: 1, theme: 'sand' } })
    expect(out.meta.direction).toBe('A')
    expect(out.meta.theme).toBe('sand')
  })

  it('backfills customThemes for pre-existing meta missing the field', () => {
    localStorage.setItem(KEYS.meta, JSON.stringify({ schemaVersion: 1, theme: 'light', points: 0 }))
    const s = loadAll()
    expect(s.meta.customThemes).toEqual([])
    expect(s.meta.theme).toBe('light')
  })

  it('v2->v3 backfills iconName from the legacy emoji (and tod defaults to null)', () => {
    const out = migrate({ habits: [{ id: 'a', name: 'Lift', icon: '💪' }], completions: {}, meta: { schemaVersion: 2 } })
    expect(out.habits[0].iconName).toBe('Dumbbell')
    expect(out.habits[0].tod).toBeNull()
  })

  it('v2->v3 keeps an explicit iconName over the emoji map', () => {
    const out = migrate({ habits: [{ id: 'a', name: 'Lift', icon: '💪', iconName: 'Flame' }], completions: {}, meta: { schemaVersion: 2 } })
    expect(out.habits[0].iconName).toBe('Flame')
  })

  it('v2->v3 converts an anchor stored by habit id to the referenced name', () => {
    const out = migrate({
      habits: [{ id: 'a', name: 'Coffee' }, { id: 'b', name: 'Stretch', anchor: 'a' }],
      completions: {}, meta: { schemaVersion: 2 },
    })
    expect(out.habits[1].anchor).toBe('Coffee')
  })

  it('v2->v3 leaves an anchor that is already a name untouched', () => {
    const out = migrate({ habits: [{ id: 'b', name: 'Stretch', anchor: 'morning coffee' }], completions: {}, meta: { schemaVersion: 2 } })
    expect(out.habits[0].anchor).toBe('morning coffee')
  })

  it('v2->v3 remaps a dropped theme id to its closest survivor', () => {
    expect(migrate({ habits: [], completions: {}, meta: { schemaVersion: 2, theme: 'forest' } }).meta.theme).toBe('pine')
    expect(migrate({ habits: [], completions: {}, meta: { schemaVersion: 2, theme: 'steel' } }).meta.theme).toBe('slatemono')
  })

  it('v2->v3 leaves a surviving theme id unchanged', () => {
    expect(migrate({ habits: [], completions: {}, meta: { schemaVersion: 2, theme: 'sand' } }).meta.theme).toBe('sand')
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
