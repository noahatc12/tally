// Single source of truth bridging pure logic + storage to React. It owns the three
// state slices, persists each on change, and exposes mutation actions. It never
// computes derived values (streaks/strength/stats) — components call src/lib/* for that.

import { useState, useEffect, useCallback, useRef } from 'react'
import { loadAll, saveHabits, saveCompletions, saveMeta } from '../lib/storage.js'
import { createHabit, emptyMeta } from '../lib/factories.js'
import { createCustomTheme } from '../lib/theme.js'

export function useHabits() {
  // Load once via a lazy initializer (loadAll is called a single time at mount).
  const [store] = useState(loadAll)
  const [habits, setHabits] = useState(store.habits)
  const [completions, setCompletions] = useState(store.completions)
  const [meta, setMeta] = useState(store.meta)
  // { habitId, ts } pushed when a habit is marked done — drives the celebration.
  const [celebration, setCelebration] = useState(null)

  // Persist each slice independently so a single change writes only what changed.
  const first = useRef(true)
  useEffect(() => {
    if (first.current) return
    saveHabits(habits)
  }, [habits])
  useEffect(() => {
    if (first.current) return
    saveCompletions(completions)
  }, [completions])
  useEffect(() => {
    if (first.current) return
    saveMeta(meta)
  }, [meta])
  useEffect(() => {
    first.current = false
  }, [])

  const addHabit = useCallback((partial) => {
    const habit = createHabit(partial)
    setHabits((hs) => [...hs, habit])
    return habit
  }, [])

  const updateHabit = useCallback((id, patch) => {
    setHabits((hs) => hs.map((h) => (h.id === id ? { ...h, ...patch } : h)))
  }, [])

  const archiveHabit = useCallback((id) => {
    setHabits((hs) => hs.map((h) => (h.id === id ? { ...h, archived: true } : h)))
  }, [])

  const deleteHabit = useCallback((id) => {
    setHabits((hs) => hs.filter((h) => h.id !== id))
    setCompletions((c) => {
      const next = {}
      for (const [date, day] of Object.entries(c)) {
        const rest = { ...day }
        delete rest[id]
        if (Object.keys(rest).length) next[date] = rest
      }
      return next
    })
  }, [])

  // celebrate defaults to "on done"; callers (e.g. counters) can override so they
  // only celebrate when a multi-per-day target is fully reached.
  const setCompletion = useCallback((habitId, dateKey, state, value, celebrate) => {
    setCompletions((c) => {
      const day = { ...(c[dateKey] || {}) }
      if (state == null) {
        delete day[habitId]
      } else {
        day[habitId] = value === undefined ? { state } : { state, value }
      }
      const next = { ...c, [dateKey]: day }
      if (!Object.keys(day).length) delete next[dateKey]
      return next
    })
    const shouldCelebrate = celebrate === undefined ? state === 'done' : celebrate
    if (shouldCelebrate) setCelebration({ habitId, ts: Date.now() })
  }, [])

  const clearCompletion = useCallback(
    (habitId, dateKey) => setCompletion(habitId, dateKey, null),
    [setCompletion],
  )

  const setTheme = useCallback((theme) => {
    setMeta((m) => ({ ...(m || emptyMeta()), theme }))
  }, [])

  const addCustomTheme = useCallback((partial) => {
    const t = createCustomTheme(partial)
    setMeta((m) => ({ ...m, customThemes: [...(m.customThemes || []), t], theme: t.id }))
    return t
  }, [])

  const updateCustomTheme = useCallback((id, patch) => {
    setMeta((m) => ({
      ...m,
      customThemes: (m.customThemes || []).map((t) => (t.id === id ? { ...t, ...patch } : t)),
    }))
  }, [])

  const deleteCustomTheme = useCallback((id) => {
    setMeta((m) => ({
      ...m,
      customThemes: (m.customThemes || []).filter((t) => t.id !== id),
      theme: m.theme === id ? 'dark' : m.theme,
    }))
  }, [])

  return {
    habits,
    completions,
    meta,
    celebration,
    addHabit,
    updateHabit,
    archiveHabit,
    deleteHabit,
    setCompletion,
    clearCompletion,
    setTheme,
    addCustomTheme,
    updateCustomTheme,
    deleteCustomTheme,
  }
}
