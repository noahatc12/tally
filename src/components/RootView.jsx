// Tiny in-app router: today, the all-habits overview, or one habit's detail. Kept as
// local state (no URL routing) since the app is a single-column PWA shell. If the open
// habit is deleted or archived from its detail view, we fall back to today.

import { useState } from 'react'
import { useHabitsContext } from '../context/habits-store.js'
import TallyShell from './tally/TallyShell.jsx'
import TallyToday from './tally/TallyToday.jsx'
import TallyDetail from './tally/TallyDetail.jsx'
import TallyOverview from './tally/TallyOverview.jsx'

export default function RootView() {
  const { habits } = useHabitsContext()
  const [route, setRoute] = useState({ name: 'today' })

  const goToday = () => setRoute({ name: 'today' })
  const openHabit = (id) => setRoute({ name: 'detail', id })

  if (route.name === 'detail') {
    const habit = habits.find((h) => h.id === route.id && !h.archived)
    // onShare → ShareCard is ported in step 5; the button stays for layout parity until then.
    if (habit) {
      return (
        <TallyShell>
          <TallyDetail habit={habit} onBack={goToday} onShare={() => {}} />
        </TallyShell>
      )
    }
  }

  if (route.name === 'overview') {
    // onShare → ShareCard is ported in step 5; the button stays for layout parity until then.
    return (
      <TallyShell>
        <TallyOverview onBack={goToday} onOpenHabit={openHabit} onShare={() => {}} />
      </TallyShell>
    )
  }

  return (
    <TallyShell>
      <TallyToday onOpenHabit={openHabit} onOpenOverview={() => setRoute({ name: 'overview' })} />
    </TallyShell>
  )
}
