import { useState, useMemo } from 'react'
import { useHabitsContext } from '../context/habits-store.js'
import { todayKey } from '../lib/dates.js'
import { isDue } from '../lib/scheduling.js'
import Header from './Header.jsx'
import HabitList from './HabitList.jsx'
import HabitFormModal from './HabitFormModal.jsx'
import EmptyState from './EmptyState.jsx'
import QuoteBanner from './QuoteBanner.jsx'

export default function TodayScreen() {
  const { habits, completions } = useHabitsContext()
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState(null)

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

  const openAdd = () => {
    setEditing(null)
    setFormOpen(true)
  }
  const openEdit = (habit) => {
    setEditing(habit)
    setFormOpen(true)
  }

  return (
    <>
      <Header onAdd={openAdd} />
      <QuoteBanner />

      {active.length === 0 ? (
        <EmptyState onAdd={openAdd} />
      ) : (
        <main>
          <HabitList title="Today" habits={ordered.due} onEdit={openEdit} emptyHint="Nothing due today — enjoy it." />
          {ordered.rest.length > 0 && (
            <HabitList title="Other habits" habits={ordered.rest} onEdit={openEdit} />
          )}
        </main>
      )}

      {formOpen && (
        <HabitFormModal habit={editing} existingHabits={active} onClose={() => setFormOpen(false)} />
      )}
    </>
  )
}
