// Tiny in-app router: today, the all-habits overview, or one habit's detail. Kept as
// local state (no URL routing) since the app is a single-column PWA shell. If the open
// habit is deleted or archived from its detail view, we fall back to today.

import { useState } from 'react'
import { useHabitsContext } from '../context/habits-store.js'
import TodayScreen from './TodayScreen.jsx'
import HabitDetail from './HabitDetail.jsx'
import OverviewScreen from './OverviewScreen.jsx'

export default function RootView() {
  const { habits } = useHabitsContext()
  const [route, setRoute] = useState({ name: 'today' })

  const goToday = () => setRoute({ name: 'today' })
  const openHabit = (id) => setRoute({ name: 'detail', id })

  if (route.name === 'detail') {
    const habit = habits.find((h) => h.id === route.id && !h.archived)
    if (habit) return <HabitDetail habit={habit} onBack={goToday} />
    // Habit was deleted/archived from its detail view — fall back to today.
  }

  if (route.name === 'overview') {
    return <OverviewScreen onBack={goToday} onOpenHabit={openHabit} />
  }

  return <TodayScreen onOpenHabit={openHabit} onOpenOverview={() => setRoute({ name: 'overview' })} />
}
