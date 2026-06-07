// Tiny in-app router: the today screen, or one habit's detail screen. Kept as local
// state (no URL routing) since the app is a single-column PWA shell. If the open
// habit is deleted or archived from its detail view, we fall back to today.

import { useState } from 'react'
import { useHabitsContext } from '../context/habits-store.js'
import TodayScreen from './TodayScreen.jsx'
import HabitDetail from './HabitDetail.jsx'

export default function RootView() {
  const { habits } = useHabitsContext()
  const [detailId, setDetailId] = useState(null)

  const detailHabit = detailId ? habits.find((h) => h.id === detailId && !h.archived) : null

  return detailHabit ? (
    <HabitDetail habit={detailHabit} onBack={() => setDetailId(null)} />
  ) : (
    <TodayScreen onOpenHabit={setDetailId} />
  )
}
