// Tiny in-app router: today, the all-habits overview, or one habit's detail. Kept as
// local state (no URL routing) since the app is a single-column PWA shell. If the open
// habit is deleted or archived from its detail view, we fall back to today.

import { useState } from 'react'
import { useHabitsContext } from '../context/habits-store.js'
import TallyShell from './tally/TallyShell.jsx'
import TallyToday from './tally/TallyToday.jsx'
import TallyDetail from './tally/TallyDetail.jsx'
import TallyOverview from './tally/TallyOverview.jsx'
import SetupWizard from './SetupWizard.jsx'
import ShareCard from './ShareCard.jsx'
import { buildDemoData, STARTERS, toStarterPayload } from '../dev/seed.js'

export default function RootView() {
  const { habits, meta, addHabit, setName, setReminders, setOnboarded, loadDemo } = useHabitsContext()
  const [route, setRoute] = useState({ name: 'today' })
  const [shareOpen, setShareOpen] = useState(false)

  const goToday = () => setRoute({ name: 'today' })
  const openHabit = (id) => setRoute({ name: 'detail', id })
  const openShare = () => setShareOpen(true)
  const share = shareOpen ? <ShareCard onClose={() => setShareOpen(false)} /> : null

  // Persist the wizard's choices, seed example data or the chosen starters, then mark onboarded
  // (finishing with zero starters is allowed → lands on an empty Today).
  const finishSetup = ({ name, reminders, reminderTime, exampleData, starters }) => {
    if (name) setName(name)
    setReminders({ on: reminders, time: reminderTime })
    if (exampleData) loadDemo(buildDemoData())
    else STARTERS.filter((s) => starters.includes(s.id)).forEach((s) => addHabit(toStarterPayload(s)))
    setOnboarded(true)
  }

  // First run (no habits AND not yet onboarded) → the setup wizard. Once onboarded, an empty
  // habit set just shows Today's empty state instead of re-opening the wizard.
  if (!habits.some((h) => !h.archived) && !meta?.onboarded) {
    return <TallyShell><SetupWizard onFinish={finishSetup} /></TallyShell>
  }

  if (route.name === 'detail') {
    const habit = habits.find((h) => h.id === route.id && !h.archived)
    if (habit) {
      return (
        <TallyShell>
          <TallyDetail habit={habit} onBack={goToday} onShare={openShare} onOpen={openHabit} />
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
