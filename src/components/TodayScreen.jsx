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

const TOD_GROUPS = [
  ['morning', 'Morning'],
  ['afternoon', 'Afternoon'],
  ['evening', 'Evening'],
  ['anytime', 'Anytime'],
]

export default function TodayScreen({ onOpenHabit, onOpenOverview }) {
  const { habits, completions } = useHabitsContext()
  const [formOpen, setFormOpen] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)

  const today = todayKey()
  const active = useMemo(() => habits.filter((h) => !h.archived), [habits])

  // Group today's due habits by time of day; everything not due falls to a muted group
  // at the bottom. If no habit uses a time-of-day, keep the simple single "Today" list.
  const { groups, rest, grouped } = useMemo(() => {
    const due = { morning: [], afternoon: [], evening: [], anytime: [] }
    const rest = []
    for (const h of active) {
      if (isDue(h, today, completions, today)) due[h.tod || 'anytime'].push(h)
      else rest.push(h)
    }
    const grouped = due.morning.length + due.afternoon.length + due.evening.length > 0
    return { groups: due, rest, grouped }
  }, [active, completions, today])

  const dueCount = groups.morning.length + groups.afternoon.length + groups.evening.length + groups.anytime.length
  const openAdd = () => setFormOpen(true)

  return (
    <>
      <Header onAdd={openAdd} onHelp={() => setHelpOpen(true)} onOverview={active.length > 0 ? onOpenOverview : null} />
      {active.length > 0 && <QuoteBanner />}

      {active.length === 0 ? (
        <EmptyState onAdd={openAdd} onHelp={() => setHelpOpen(true)} />
      ) : (
        <main>
          {dueCount === 0 ? (
            <p className="habit-list__hint habit-list__hint--lead">Nothing due today. Enjoy it.</p>
          ) : grouped ? (
            TOD_GROUPS.map(([key, label]) =>
              groups[key].length > 0 ? (
                <HabitList key={key} title={label} habits={groups[key]} onOpen={onOpenHabit} />
              ) : null,
            )
          ) : (
            <HabitList title="Today" habits={groups.anytime} onOpen={onOpenHabit} />
          )}
          {rest.length > 0 && (
            <HabitList title="Not due today" habits={rest} onOpen={onOpenHabit} muted />
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
