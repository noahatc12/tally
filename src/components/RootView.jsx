// Tiny in-app router: today, the all-habits overview, or one habit's detail. Kept as
// local state (no URL routing) since the app is a single-column PWA shell. If the open
// habit is deleted or archived from its detail view, we fall back to today.

import { useState } from 'react'
import { useHabitsContext } from '../context/habits-store.js'
import HabitDetail from './HabitDetail.jsx'
import OverviewScreen from './OverviewScreen.jsx'
import TallyShell from './tally/TallyShell.jsx'
import TallyToday from './tally/TallyToday.jsx'

// Transitional: the Today screen is the faithfully-ported one (under the .tally root);
// detail/overview are still the pre-port screens in the old shell until they're ported too.
function OldShell({ children }) {
  return (
    <div className="app">
      <div className="container">{children}</div>
    </div>
  )
}

export default function RootView() {
  const { habits } = useHabitsContext()
  const [route, setRoute] = useState({ name: 'today' })

  const goToday = () => setRoute({ name: 'today' })
  const openHabit = (id) => setRoute({ name: 'detail', id })

  if (route.name === 'detail') {
    const habit = habits.find((h) => h.id === route.id && !h.archived)
    if (habit) return <OldShell><HabitDetail habit={habit} onBack={goToday} /></OldShell>
  }

  if (route.name === 'overview') {
    return <OldShell><OverviewScreen onBack={goToday} onOpenHabit={openHabit} /></OldShell>
  }

  return (
    <TallyShell>
      <TallyToday onOpenHabit={openHabit} onOpenOverview={() => setRoute({ name: 'overview' })} />
    </TallyShell>
  )
}
