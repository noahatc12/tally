// Distributes the single useHabits() store to the tree so deep children (a habit
// row's toggle) don't prop-drill. The context object + accessor hook live in
// habits-store.js so this file exports only a component.

import { useEffect } from 'react'
import { useHabits } from '../hooks/useHabits.js'
import { HabitsContext } from './habits-store.js'
import { applyTheme, applyFont, applyDirection } from '../lib/theme.js'

export function HabitsProvider({ children }) {
  const store = useHabits()

  // Apply the active theme: presets via data-theme, custom themes via inline vars.
  // meta's ref only changes when meta changes, and applyTheme is idempotent, so this
  // re-applies exactly when needed (incl. live edits to the active custom theme).
  useEffect(() => {
    applyDirection(store.meta) // the Look (data-dir) — drives radius + card elevation
    applyTheme(store.meta)
    applyFont(store.meta) // 'default' font follows the Look, so run after applyDirection
  }, [store.meta])

  return <HabitsContext.Provider value={store}>{children}</HabitsContext.Provider>
}
