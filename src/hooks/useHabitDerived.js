// Memoized derived values for one habit. Keeps the pure logic out of components
// while recomputing only when the habit or completions change.

import { useMemo } from 'react'
import { useHabitsContext } from '../context/habits-store.js'
import { todayKey } from '../lib/dates.js'
import { computeStreaks, streakEvents } from '../lib/streaks.js'
import { computeStrength } from '../lib/strength.js'
import { rateForWindow } from '../lib/stats.js'
import { getState } from '../lib/scheduling.js'

export function useHabitDerived(habit) {
  const { completions } = useHabitsContext()
  const today = todayKey()

  return useMemo(() => {
    const streaks = computeStreaks(habit, completions, today)
    const strength = computeStrength(habit, completions, today)
    const week = rateForWindow(habit, completions, 'week', today)
    const todayState = getState(completions, today, habit.id) || null

    // "Never miss twice": count consecutive misses ending just before today.
    const events = streakEvents(habit, completions, today)
    const resolved = events[events.length - 1] === 'pending' ? events.slice(0, -1) : events
    let trailingMisses = 0
    for (let i = resolved.length - 1; i >= 0 && resolved[i] === 'miss'; i--) trailingMisses++

    return { streaks, strength, week, today, todayState, trailingMisses }
    // habit fields and the completion entries we read are covered by these deps.
  }, [habit, completions, today])
}
