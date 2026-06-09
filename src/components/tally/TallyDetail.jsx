// Detail screen, ported 1:1 from the handoff (screens.jsx DetailScreen) so tally.css styles
// it exactly: back/edit/share bar, head, the big /100 hero + 6-week delta, stat grids,
// strength-trend plate, year heatmap, and the 7-day backfill row. Data + mutations come from
// our store via proto-adapters; Edit opens the (transitional) HabitFormModal; Share is the
// ShareCard, ported in step 5.

import { useMemo, useState } from 'react'
import { useHabitsContext } from '../../context/habits-store.js'
import {
  todayKey, dateFromKey, toUiHabit, strengthOf, streakOf, longestStreak, weekRate,
  weekStates, yearGrid, trendSeries, valueTotals, formatDuration, schedLabel,
} from '../../lib/proto-adapters.js'
import { buildInkMap } from '../../lib/directions.js'
import { Glyph, TrendChart, YearHeatmap } from './widgets.jsx'
import HabitFormModal from '../HabitFormModal.jsx'

// backfill cycle: done → skip → missed → clear; an untouched day starts at done.
const NEXT = { done: 'skip', skip: 'missed', missed: null }

export default function TallyDetail({ habit, onBack, onShare }) {
  const { habits, completions, meta, setCompletion, clearCompletion } = useHabitsContext()
  const [editing, setEditing] = useState(false)
  const today = todayKey()
  const ui = toUiHabit(habit)
  const ink = buildInkMap(habits, meta?.ink)[habit.id] || habit.color

  const strength = strengthOf(habit, completions, today)
  const streak = streakOf(habit, completions, today)
  const best = longestStreak(habit, completions, today)
  const rate = weekRate(habit, completions, today)
  const grid = useMemo(() => yearGrid(habit, completions, today), [habit, completions, today])
  const series = useMemo(() => trendSeries(habit, completions, today), [habit, completions, today])
  const totals = (ui.type === 'count' || ui.type === 'duration') ? valueTotals(habit, completions, today) : null
  const delta = series.length > 6 ? strength - series[series.length - 6] : 0

  const schedBase = schedLabel(habit)
  const schedText = ui.type === 'duration' ? `${schedBase} · ${ui.goal} ${ui.unit} goal`
    : ui.type === 'count' ? `${schedBase} · ${ui.goal} ${ui.unit}` : schedBase
  const planBits = [
    habit.anchor && `after ${habit.anchor}`,
    habit.plan?.time && `at ${habit.plan.time}`,
    habit.plan?.place && `@ ${habit.plan.place}`,
    habit.minimumVersion && `min: ${habit.minimumVersion}`,
  ].filter(Boolean)

  const week = weekStates(habit, completions, today)
  const cycle = (key, state) => {
    const next = state in NEXT ? NEXT[state] : 'done'
    if (next == null) clearCompletion(habit.id, key)
    else setCompletion(habit.id, key, next)
  }

  const activeHabits = habits.filter((h) => !h.archived)

  return (
    <div className="screen detail" style={{ '--habit': ink }}>
      <div className="detail__bar rise">
        <button className="backbtn" type="button" onClick={onBack}>‹ Today</button>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="iconbtn" type="button" onClick={() => setEditing(true)} title="Edit habit" aria-label="Edit habit">✎</button>
          <button className="iconbtn" type="button" onClick={onShare} title="Share" aria-label="Share">✦</button>
        </div>
      </div>

      <div className="detail__head rise">
        <span className="detail__icon" aria-hidden="true"><Glyph habit={habit} size={26} /></span>
        <div>
          <div className="detail__name">{habit.name}</div>
          <p className="detail__sched">{schedText}{ui.cue ? <> · after <b>{ui.cue}</b></> : null}</p>
          {planBits.length > 0 && <p className="detail__plan">{planBits.join('  ·  ')}</p>}
        </div>
      </div>

      <div className="hero rise" style={{ animationDelay: '40ms' }}>
        <div className="hero__big">{strength}<small> /100</small></div>
        <div className="hero__cap">
          <span className="hero__caplabel">Habit strength</span>
          <span className="hero__delta">{delta >= 0 ? '▲' : '▼'} <b>{Math.abs(delta)}</b> over 6 wks</span>
        </div>
      </div>

      <div className="statgrid rise" style={{ animationDelay: '80ms' }}>
        <div className="stat"><span className="stat__v">{streak}<small>d</small></span><span className="stat__l">Current streak</span></div>
        <div className="stat"><span className="stat__v">{best}<small>d</small></span><span className="stat__l">Best ever</span></div>
        <div className="stat"><span className="stat__v">{rate == null ? '—' : rate}<small>%</small></span><span className="stat__l">This week</span></div>
      </div>

      {totals && (
        <div className="statgrid rise" style={{ animationDelay: '100ms' }}>
          {ui.type === 'duration' ? (
            <>
              <div className="stat"><span className="stat__v">{formatDuration(totals.total)}</span><span className="stat__l">Total time</span></div>
              <div className="stat"><span className="stat__v">{formatDuration(totals.avg)}</span><span className="stat__l">Per active day</span></div>
              <div className="stat"><span className="stat__v">{formatDuration(totals.week)}</span><span className="stat__l">This week</span></div>
            </>
          ) : (
            <>
              <div className="stat"><span className="stat__v">{Math.round(totals.total)}</span><span className="stat__l">Total {ui.unit}</span></div>
              <div className="stat"><span className="stat__v">{totals.avg.toFixed(1)}</span><span className="stat__l">Per active day</span></div>
              <div className="stat"><span className="stat__v">{Math.round(totals.week)}</span><span className="stat__l">This week</span></div>
            </>
          )}
        </div>
      )}

      <section className="section">
        <div className="section__title">Strength trend</div>
        <TrendChart series={series} />
      </section>

      <section className="section">
        <div className="section__title">This year<span className="group__count" style={{ fontFamily: 'var(--font-mono)' }}>{grid.cols} weeks</span></div>
        <YearHeatmap grid={grid} />
      </section>

      <section className="section">
        <div className="section__title">Backfill: tap a day you forgot to log</div>
        <div className="backfill">
          {week.map((c) => (
            <div className="bf" key={c.key}>
              <button className={`bf__dot${c.isToday ? '' : ' is-' + c.state}`} type="button"
                onClick={() => cycle(c.key, c.state)}>
                {c.state === 'done' ? '✓' : c.state === 'skip' ? '↷' : c.state === 'missed' ? '–' : ''}
              </button>
              <span className="bf__lbl"><b>{dateFromKey(c.key).getDate()}</b>{c.dow}</span>
            </div>
          ))}
        </div>
        <p className="backfill__hint">Forgiving by design. A <b>skip</b> never breaks your streak, only a real miss does.</p>
      </section>

      {editing && (
        <HabitFormModal habit={habit} existingHabits={activeHabits} onClose={() => setEditing(false)} />
      )}
    </div>
  )
}
