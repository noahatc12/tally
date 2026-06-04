// Today control for a "measured" habit done several times a day (e.g. brush teeth 2x,
// 8 glasses of water). Tapping ＋ logs one occurrence toward the target. Per the
// forgiving model, a SINGLE occurrence already secures the day's streak (state=done);
// the target is the aspiration, and hitting it shows a "complete" state + celebration.

import { useHabitsContext } from '../context/habits-store.js'

export default function CountControl({ habit, today, value, state }) {
  const { setCompletion, clearCompletion } = useHabitsContext()
  const target = Math.max(1, habit.target?.amount || 1)
  const unit = habit.target?.unit || 'times'
  const skipped = state === 'skip'
  const v = skipped ? 0 : value || 0
  const counts = !skipped && v >= 1 // already secures the streak
  const complete = !skipped && v >= target

  const inc = () => {
    const nv = v + 1
    // Celebrate only when the full target is reached, not on every tap.
    setCompletion(habit.id, today, 'done', nv, nv >= target)
  }
  const dec = () => {
    if (v <= 1) clearCompletion(habit.id, today)
    else setCompletion(habit.id, today, 'done', v - 1, false)
  }
  const toggleSkip = () => {
    if (skipped) clearCompletion(habit.id, today)
    else setCompletion(habit.id, today, 'skip', undefined, false)
  }

  return (
    // Single compact row (same height as the three-state toggle) so it lines up next
    // to the "this week" pill. Fixed-width readout = no reflow on ＋/−.
    <div className={`count${counts ? ' is-done' : ''}${complete ? ' is-complete' : ''}`}>
      <button type="button" className="count__btn" onClick={dec} disabled={!counts} aria-label="Log one fewer">
        −
      </button>
      <span className="count__readout" aria-live="polite">
        <strong className="count__num">{skipped ? '—' : `${v}/${target}`}</strong>
        <span className="count__unit">{skipped ? 'skipped' : unit}</span>
      </span>
      <button type="button" className="count__btn count__btn--inc" onClick={inc} aria-label={`Log one ${unit}`}>
        ＋
      </button>
      <button
        type="button"
        className={`count__skip${skipped ? ' is-active' : ''}`}
        onClick={toggleSkip}
        aria-label="Skip today"
        title="Skip today"
      >
        ~
      </button>
    </div>
  )
}
