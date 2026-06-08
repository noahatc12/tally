// Single source of truth bridging pure logic + storage to React. It owns the three
// state slices, persists each on change, and exposes mutation actions. It never
// computes derived values (streaks/strength/stats) — components call src/lib/* for that.

import { useState, useEffect, useCallback, useRef } from 'react'
import { loadAll, saveHabits, saveCompletions, saveMeta, saveTimers } from '../lib/storage.js'
import { createHabit, emptyMeta } from '../lib/factories.js'
import { createCustomTheme, DIRECTIONS } from '../lib/theme.js'

export function useHabits() {
  // Load once via a lazy initializer (loadAll is called a single time at mount).
  const [store] = useState(loadAll)
  const [habits, setHabits] = useState(store.habits)
  const [completions, setCompletions] = useState(store.completions)
  const [meta, setMeta] = useState(store.meta)
  // Running stopwatch sessions for duration habits: { [habitId]: { startedAt } }.
  const [timers, setTimers] = useState(store.timers || {})
  // { habitId, ts } pushed when a habit is marked done — drives the celebration.
  const [celebration, setCelebration] = useState(null)

  // Live refs so timer/value actions can read current state without re-creating
  // callbacks (and without running side effects inside a setState updater).
  const completionsRef = useRef(completions)
  const timersRef = useRef(timers)
  useEffect(() => {
    completionsRef.current = completions
  }, [completions])
  useEffect(() => {
    timersRef.current = timers
  }, [timers])

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
    if (first.current) return
    saveTimers(timers)
  }, [timers])
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
    setTimers((t) => {
      if (!(id in t)) return t
      const next = { ...t }
      delete next[id]
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

  // --- measured / duration value logging ---------------------------------------
  // Set today's value to an exact amount (minutes for duration habits). value<=0
  // clears the day. Marking done is forgiving: any value secures the streak, and
  // crossing the goal (from under) fires the celebration.
  const setValue = useCallback(
    (habitId, dateKey, value, goal = 0) => {
      const prev = completionsRef.current[dateKey]?.[habitId]?.value || 0
      const nv = Math.max(0, value)
      if (nv <= 0) {
        clearCompletion(habitId, dateKey)
        return
      }
      const crossed = goal > 0 && prev < goal && nv >= goal
      setCompletion(habitId, dateKey, 'done', nv, crossed)
    },
    [setCompletion, clearCompletion],
  )

  // Add a delta (can be negative) to today's value.
  const logValue = useCallback(
    (habitId, dateKey, delta, goal = 0) => {
      const prev = completionsRef.current[dateKey]?.[habitId]?.value || 0
      setValue(habitId, dateKey, prev + delta, goal)
    },
    [setValue],
  )

  // --- duration stopwatch ------------------------------------------------------
  const startTimer = useCallback((habitId) => {
    setTimers((t) => ({ ...t, [habitId]: { startedAt: Date.now() } }))
  }, [])

  // Stop the running session, adding its elapsed minutes to today's value. Returns
  // the minutes logged (0 if there was no running timer).
  const stopTimer = useCallback(
    (habitId, dateKey, goal = 0) => {
      const session = timersRef.current[habitId]
      setTimers((t) => {
        if (!(habitId in t)) return t
        const next = { ...t }
        delete next[habitId]
        return next
      })
      if (!session) return 0
      const minutes = (Date.now() - session.startedAt) / 60000
      if (minutes > 0) logValue(habitId, dateKey, minutes, goal)
      return minutes
    },
    [logValue],
  )

  const setTheme = useCallback((theme) => {
    setMeta((m) => ({ ...(m || emptyMeta()), theme }))
  }, [])

  // Switching Look sets the structure (direction) AND seeds its signature palette; the user
  // can recolor afterward via setTheme. Picking "Bloom" should look like Bloom out of the box.
  const setLook = useCallback((direction) => {
    const dir = DIRECTIONS.find((d) => d.id === direction) || DIRECTIONS[0]
    setMeta((m) => ({ ...(m || emptyMeta()), direction: dir.id, theme: dir.defaultTheme }))
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

  const setFont = useCallback((font) => {
    setMeta((m) => ({ ...(m || emptyMeta()), font }))
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
    timers,
    celebration,
    addHabit,
    updateHabit,
    archiveHabit,
    deleteHabit,
    setCompletion,
    clearCompletion,
    setValue,
    logValue,
    startTimer,
    stopTimer,
    setTheme,
    setLook,
    setFont,
    addCustomTheme,
    updateCustomTheme,
    deleteCustomTheme,
  }
}
