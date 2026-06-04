// Distributes the single useHabits() store to the tree so deep children (a habit
// row's toggle) don't prop-drill. The context object + accessor hook live in
// habits-store.js so this file exports only a component.

import { useEffect } from 'react'
import { useHabits } from '../hooks/useHabits.js'
import { HabitsContext } from './habits-store.js'

export function HabitsProvider({ children }) {
  const store = useHabits()

  // Reflect the persisted theme onto <html data-theme> so CSS tokens switch.
  useEffect(() => {
    const theme = store.meta?.theme || 'dark'
    document.documentElement.setAttribute('data-theme', theme)
  }, [store.meta?.theme])

  return <HabitsContext.Provider value={store}>{children}</HabitsContext.Provider>
}
