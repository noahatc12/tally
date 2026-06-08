// All-habits dashboard: today's completion across every habit, an aggregate year
// heatmap, and a per-habit list (strength sparkline + value) that links to each
// habit's detail.

import { useMemo } from 'react'
import { useHabitsContext } from '../context/habits-store.js'
import { todayKey } from '../lib/dates.js'
import { isDue, getState } from '../lib/scheduling.js'
import { computeStrength, strengthSeries } from '../lib/strength.js'
import { todaySummary } from '../lib/stats.js'
import AggregateHeatmap from './AggregateHeatmap.jsx'
import Sparkline from './Sparkline.jsx'
import HabitIcon from './HabitIcon.jsx'

export default function OverviewScreen({ onBack, onOpenHabit }) {
  const { habits, completions } = useHabitsContext()
  const today = todayKey()

  const active = useMemo(() => habits.filter((h) => !h.archived), [habits])
  const summary = useMemo(() => todaySummary(habits, completions, today), [habits, completions, today])

  const dueToday = useMemo(
    () => active.filter((h) => getState(completions, today, h.id) === 'done' || isDue(h, today, completions, today)),
    [active, completions, today],
  )

  const rows = useMemo(
    () =>
      active.map((h) => ({
        habit: h,
        strength: computeStrength(h, completions, today),
        series: strengthSeries(h, completions, today),
        doneToday: getState(completions, today, h.id) === 'done',
      })),
    [active, completions, today],
  )

  return (
    <section className="overview">
      <div className="detail__bar">
        <button type="button" className="btn btn--ghost btn--icon" onClick={onBack} aria-label="Back">
          ←
        </button>
        <span className="overview__heading">Overview</span>
        <span className="overview__count">{active.length} active</span>
      </div>

      <div className="overview__today">
        <div className="overview__pct">{summary.pct == null ? '—' : `${summary.pct}%`}</div>
        <div className="overview__today-meta">
          <span className="overview__today-label">
            {summary.pct == null ? 'Nothing due today' : `${summary.done} of ${summary.due} done today`}
          </span>
          {dueToday.length > 0 && (
            <div className="overview__dots">
              {dueToday.map((h) => (
                <span
                  key={h.id}
                  className={`overview__dot${getState(completions, today, h.id) === 'done' ? ' is-done' : ''}`}
                  style={{ '--row-accent': h.color }}
                  title={h.name}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="detail__section">
        <h2 className="detail__section-title">All habits · last 12 months</h2>
        <AggregateHeatmap habits={habits} completions={completions} today={today} />
      </div>

      <div className="detail__section">
        <h2 className="detail__section-title">Habits</h2>
        <ul className="overview__list">
          {rows.map(({ habit, strength, series, doneToday }) => (
            <li key={habit.id}>
              <button
                type="button"
                className={`overview__row${doneToday ? ' is-done' : ''}`}
                style={{ '--row-accent': habit.color }}
                onClick={() => onOpenHabit(habit.id)}
              >
                <span className="overview__row-icon" aria-hidden="true">
                  <HabitIcon habit={habit} size={18} />
                </span>
                <span className="overview__row-name">{habit.name}</span>
                <Sparkline series={series} color={habit.color} />
                <span className="overview__row-strength">{strength}</span>
                <span className="overview__row-chevron" aria-hidden="true">
                  ›
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
