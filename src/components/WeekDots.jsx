// A compact 7-day strip on each habit card: the last week at a glance. Colored by
// the habit's own color for done days, with skip/miss/off-day variants.

import { useHabitsContext } from '../context/habits-store.js'
import { todayKey, addDays, getWeekday } from '../lib/dates.js'
import { isDue, getState } from '../lib/scheduling.js'

const LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

export default function WeekDots({ habit }) {
  const { completions } = useHabitsContext()
  const today = todayKey()
  const days = []
  for (let i = 6; i >= 0; i--) days.push(addDays(today, -i))

  return (
    <div className="weekdots" role="img" aria-label="Last 7 days">
      {days.map((d) => {
        const st = getState(completions, d, habit.id)
        const due = isDue(habit, d, completions, today)
        let cls = 'weekdots__dot'
        if (st === 'done') cls += ' is-done'
        else if (st === 'skip') cls += ' is-skip'
        else if (st === 'missed') cls += ' is-miss'
        else if (!due) cls += ' is-off'
        if (d === today) cls += ' is-today'
        return (
          <span key={d} className="weekdots__cell">
            <span className={cls} />
            <span className="weekdots__label">{LABELS[getWeekday(d)]}</span>
          </span>
        )
      })}
    </div>
  )
}
