// Tiny in-app router: today, the all-habits overview, or one habit's detail. Kept as
// local state (no URL routing) since the app is a single-column PWA shell. If the open
// habit is deleted or archived from its detail view, we fall back to today.

import { useState } from 'react'
import { useHabitsContext } from '../context/habits-store.js'
import TallyShell from './tally/TallyShell.jsx'
import TallyToday from './tally/TallyToday.jsx'
import TallyDetail from './tally/TallyDetail.jsx'
import TallyOverview from './tally/TallyOverview.jsx'
import TallyOnboarding from './tally/TallyOnboarding.jsx'
import ShareCard from './ShareCard.jsx'

export default function RootView() {
  const { habits } = useHabitsContext()
  const [route, setRoute] = useState({ name: 'today' })
  const [shareOpen, setShareOpen] = useState(false)

  const goToday = () => setRoute({ name: 'today' })
  const openHabit = (id) => setRoute({ name: 'detail', id })
  const openShare = () => setShareOpen(true)
  const share = shareOpen ? <ShareCard onClose={() => setShareOpen(false)} /> : null

  // No habits yet (first run, or all archived/deleted) → the onboarding/empty state.
  if (!habits.some((h) => !h.archived)) {
    return <TallyShell><TallyOnboarding /></TallyShell>
  }

  if (route.name === 'detail') {
    const habit = habits.find((h) => h.id === route.id && !h.archived)
    if (habit) {
      return (
        <TallyShell>
          <TallyDetail habit={habit} onBack={goToday} onShare={openShare} />
          {share}
        </TallyShell>
      )
    }
  }

  if (route.name === 'overview') {
    return (
      <TallyShell>
        <TallyOverview onBack={goToday} onOpenHabit={openHabit} onShare={openShare} />
        {share}
      </TallyShell>
    )
  }

  return (
    <TallyShell>
      <TallyToday onOpenHabit={openHabit} onOpenOverview={() => setRoute({ name: 'overview' })} />
    </TallyShell>
  )
}
