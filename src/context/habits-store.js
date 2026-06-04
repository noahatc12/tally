// Context object + accessor hook, kept in a non-component module so the Provider
// file can export only a component (clean React Fast Refresh).

import { createContext, useContext } from 'react'

export const HabitsContext = createContext(null)

export function useHabitsContext() {
  const ctx = useContext(HabitsContext)
  if (!ctx) throw new Error('useHabitsContext must be used within <HabitsProvider>')
  return ctx
}
