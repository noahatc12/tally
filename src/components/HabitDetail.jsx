// Per-habit detail screen: the hero strength number + trend curve, key streak/rate
// stats, and the full-year heatmap. Reached by tapping a habit on the today screen.

import { useMemo, useState } from 'react'
import { useHabitsContext } from '../context/habits-store.js'
import { todayKey } from '../lib/dates.js'
import { computeStreaks } from '../lib/streaks.js'
import { computeStrength, strengthSeries } from '../lib/strength.js'
import { completionRate } from '../lib/stats.js'
import TrendChart from './TrendChart.jsx'
import HeatmapGrid from './HeatmapGrid.jsx'
import HabitFormModal from './HabitFormModal.jsx'

const WD = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function scheduleLabel(habit) {
  const s = habit.schedule || { kind: 'daily' }
  switch (s.kind) {
    case 'weekdays':
      return (s.weekdays || []).map((d) => WD[d]).join(' · ') || 'Selected days'
    case 'timesPerWeek':
      return `${s.timesPerWeek}× per week`
    case 'everyNDays':
      return s.everyN === 1 ? 'Every day' : `Every ${s.everyN} days`
    default:
      return 'Every day'
  }
}

function Stat({ label, value, unit }) {
  return (
    <div className="detail__stat">
      <span className="detail__stat-value">
        {value}
        {unit && <span className="detail__stat-unit">{unit}</span>}
      </span>
      <span className="detail__stat-label">{label}</span>
    </div>
  )
}

export default function HabitDetail({ habit, onBack }) {
  const { completions, habits } = useHabitsContext()
  const [editing, setEditing] = useState(false)
  const today = todayKey()

  const { strength, series, streaks, rate } = useMemo(() => {
    const created = habit.createdAt.slice(0, 10)
    const r = completionRate(habit, completions, created, today, today)
    return {
      strength: computeStrength(habit, completions, today),
      series: strengthSeries(habit, completions, today),
      streaks: computeStreaks(habit, completions, today),
      rate: r.rate == null ? null : Math.round(r.rate * 100),
    }
  }, [habit, completions, today])

  const unit = streaks.unit === 'weeks' ? 'wk' : 'd'
  const activeHabits = habits.filter((h) => !h.archived)

  return (
    <section className="detail" style={{ '--row-accent': habit.color }}>
      <div className="detail__bar">
        <button type="button" className="btn btn--ghost btn--icon" onClick={onBack} aria-label="Back">
          ←
        </button>
        <button type="button" className="btn btn--ghost" onClick={() => setEditing(true)}>
          Edit
        </button>
      </div>

      <div className="detail__head">
        <span className="detail__icon" aria-hidden="true">
          {habit.icon}
        </span>
        <div className="detail__heading">
          <h1 className="detail__name">{habit.name}</h1>
          <p className="detail__sched">{scheduleLabel(habit)}</p>
        </div>
      </div>

      <div className="detail__hero">
        <div className="detail__big">
          {strength}
          <span className="detail__pct">%</span>
        </div>
        <span className="detail__caption">strength</span>
      </div>

      <TrendChart series={series} color={habit.color} />

      <div className="detail__stats">
        <Stat label="Current" value={streaks.current} unit={unit} />
        <Stat label="Best" value={streaks.longest} unit={unit} />
        <Stat label="Completed" value={rate == null ? '—' : rate} unit={rate == null ? '' : '%'} />
      </div>

      <div className="detail__section">
        <h2 className="detail__section-title">Last 12 months</h2>
        <HeatmapGrid habit={habit} completions={completions} today={today} color={habit.color} />
      </div>

      {editing && (
        <HabitFormModal habit={habit} existingHabits={activeHabits} onClose={() => setEditing(false)} />
      )}
    </section>
  )
}
