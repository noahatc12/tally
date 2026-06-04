import { useHabitsContext } from '../context/habits-store.js'
import { useHabitDerived } from '../hooks/useHabitDerived.js'
import ThreeStateToggle from './ThreeStateToggle.jsx'
import CountControl from './CountControl.jsx'
import StreakBadge from './StreakBadge.jsx'
import StrengthMeter from './StrengthMeter.jsx'
import CompletionRatePill from './CompletionRatePill.jsx'
import WeekDots from './WeekDots.jsx'

export default function HabitRow({ habit, onEdit }) {
  const { setCompletion, clearCompletion } = useHabitsContext()
  const { streaks, strength, week, today, todayState, todayValue, trailingMisses } = useHabitDerived(habit)
  const isCount = habit.type === 'quantitative'

  // One miss = gentle nudge; two+ misses = de-emphasize the streak number, no guilt.
  const showNudge = todayState !== 'done' && trailingMisses === 1
  const deemphasizeStreak = trailingMisses >= 2

  const onSelect = (state) => {
    if (state === todayState) clearCompletion(habit.id, today)
    else setCompletion(habit.id, today, state)
  }

  const cue = habit.plan?.cue?.trim()

  return (
    <article
      className={`row${todayState === 'done' ? ' is-done-today' : ''}`}
      style={{ '--row-accent': habit.color }}
    >
      <div className="row__main">
        <span className="row__icon" aria-hidden="true">
          {habit.icon}
        </span>
        <button type="button" className="row__identity" onClick={() => onEdit(habit)}>
          <span className="row__name">{habit.name}</span>
          {cue && <span className="row__cue">After {cue}</span>}
        </button>
        <StreakBadge streaks={streaks} dim={deemphasizeStreak} />
      </div>

      <StrengthMeter value={strength} />
      <WeekDots habit={habit} />

      <div className="row__footer">
        <CompletionRatePill week={week} />
        {isCount ? (
          <CountControl habit={habit} today={today} value={todayValue} state={todayState} />
        ) : (
          <ThreeStateToggle value={todayState} onSelect={onSelect} />
        )}
      </div>

      {showNudge && (
        <p className="row__nudge">One miss is an accident. Get back on track today.</p>
      )}
    </article>
  )
}
