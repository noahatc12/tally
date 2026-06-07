import { useState, useMemo } from 'react'
import { useHabitsContext } from '../context/habits-store.js'
import { todayKey } from '../lib/dates.js'
import { isDue } from '../lib/scheduling.js'
import Header from './Header.jsx'
import HabitList from './HabitList.jsx'
import HabitFormModal from './HabitFormModal.jsx'
import EmptyState from './EmptyState.jsx'
import QuoteBanner from './QuoteBanner.jsx'
import HelpModal from './HelpModal.jsx'

export default function TodayScreen({ onOpenHabit, onOpenOverview }) {
  const { habits, completions } = useHabitsContext()
  const [formOpen, setFormOpen] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)

  const today = todayKey()
  const active = useMemo(() => habits.filter((h) => !h.archived), [habits])

  // Habits due today first, then the rest, so the day's work is at the top.
  const ordered = useMemo(() => {
    const due = []
    const rest = []
    for (const h of active) {
      if (isDue(h, today, completions, today)) due.push(h)
      else rest.push(h)
    }
    return { due, rest }
  }, [active, completions, today])

  const openAdd = () => setFormOpen(true)

  return (
    <>
      <Header onAdd={openAdd} onHelp={() => setHelpOpen(true)} onOverview={active.length > 0 ? onOpenOverview : null} />
      <QuoteBanner />

      {active.length === 0 ? (
        <EmptyState onAdd={openAdd} onHelp={() => setHelpOpen(true)} />
      ) : (
        <main>
          <HabitList title="Today" habits={ordered.due} onOpen={onOpenHabit} emptyHint="Nothing due today. Enjoy it." />
          {ordered.rest.length > 0 && (
            <HabitList title="Other" habits={ordered.rest} onOpen={onOpenHabit} />
          )}
        </main>
      )}

      {formOpen && (
        <HabitFormModal habit={null} existingHabits={active} onClose={() => setFormOpen(false)} />
      )}
      {helpOpen && <HelpModal onClose={() => setHelpOpen(false)} />}
    </>
  )
}
