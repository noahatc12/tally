// Today control for a "duration" (timed) habit. Three ways to log time, per the
// forgiving model where any logged minute already secures the day's streak and the
// goal is the aspiration:
//   1. a live stopwatch (start/stop) that keeps running across reloads/app close,
//   2. quick-add buttons (+5 / +15 min),
//   3. an exact manual entry.

import { useEffect, useState } from 'react'
import { useHabitsContext } from '../context/habits-store.js'
import { formatDuration, formatClock } from '../lib/duration.js'

export default function TimerControl({ habit, today, value, state }) {
  const { timers, startTimer, stopTimer, logValue, setValue, setCompletion, clearCompletion } = useHabitsContext()
  const goal = Math.max(0, habit.target?.amount || 0)
  const session = timers[habit.id]
  const running = Boolean(session)
  const skipped = state === 'skip'

  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  // `now` is held in state (pure to read at render) and advanced once a second by the
  // interval while a session is running, so the live clock ticks up.
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (!running) return
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [running])

  const loggedMin = skipped ? 0 : value || 0
  const runningMs = running ? Math.max(0, now - session.startedAt) : 0
  const liveMin = loggedMin + runningMs / 60000
  const pct = goal > 0 ? Math.min(100, (liveMin / goal) * 100) : liveMin > 0 ? 100 : 0
  const complete = goal > 0 && liveMin >= goal
  const counts = running || loggedMin > 0

  const onStop = () => stopTimer(habit.id, today, goal)
  const add = (mins) => logValue(habit.id, today, mins, goal)
  const toggleSkip = () => {
    if (running) stopTimer(habit.id, today, goal)
    if (skipped) clearCompletion(habit.id, today)
    else setCompletion(habit.id, today, 'skip', undefined, false)
  }
  const openEditor = () => {
    setDraft(loggedMin ? String(Math.round(loggedMin)) : '')
    setEditing(true)
  }
  const saveEditor = () => {
    const n = Number(draft)
    if (Number.isFinite(n)) setValue(habit.id, today, Math.max(0, Math.round(n)), goal)
    setEditing(false)
  }

  return (
    <div className={`timer${counts ? ' is-on' : ''}${complete ? ' is-complete' : ''}`}>
      <div className="timer__head">
        <span className="timer__readout">
          <strong className="timer__num">{skipped ? '·' : formatDuration(liveMin)}</strong>
          {goal > 0 && !skipped && <span className="timer__goal">/ {formatDuration(goal)}</span>}
          {skipped && <span className="timer__goal">skipped</span>}
        </span>
        {running && (
          <span className="timer__live" aria-live="off">
            ⏱ {formatClock(runningMs)}
          </span>
        )}
      </div>

      <div className="timer__bar" aria-hidden="true">
        <div className="timer__fill" style={{ width: `${pct}%` }} />
      </div>

      {editing ? (
        <div className="timer__edit">
          <input
            className="field__input field__input--sm"
            type="number"
            min="0"
            inputMode="numeric"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            autoFocus
            aria-label="Minutes"
          />
          <span className="timer__edit-unit">min</span>
          <button type="button" className="btn btn--accent timer__set" onClick={saveEditor}>
            Set
          </button>
          <button type="button" className="btn btn--ghost timer__set" onClick={() => setEditing(false)}>
            Cancel
          </button>
        </div>
      ) : (
        <div className="timer__actions">
          {running ? (
            <button type="button" className="btn btn--accent timer__primary" onClick={onStop}>
              ⏹ Stop
            </button>
          ) : (
            <button type="button" className="btn btn--accent timer__primary" onClick={() => startTimer(habit.id)}>
              ▶ Start
            </button>
          )}
          <button type="button" className="timer__chip" onClick={() => add(5)}>
            +5
          </button>
          <button type="button" className="timer__chip" onClick={() => add(15)}>
            +15
          </button>
          <button type="button" className="timer__chip" onClick={openEditor} aria-label="Enter minutes">
            ✎
          </button>
          <button
            type="button"
            className={`timer__chip${skipped ? ' is-active' : ''}`}
            onClick={toggleSkip}
            aria-label="Skip today"
            title="Skip today"
          >
            ~
          </button>
        </div>
      )}
    </div>
  )
}
