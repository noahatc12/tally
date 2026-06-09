// Overview screen, ported 1:1 from the handoff (screens.jsx OverviewScreen) so tally.css
// styles it exactly: back/share bar, the big today-percent + per-habit dots, the all-habits
// aggregate year heatmap, and the per-habit list (icon + sparkline + strength). Data comes
// from our store via proto-adapters; archived habits are excluded. Share (year-in-review) is
// the ShareCard, ported in step 5.

import { useMemo } from 'react'
import { useHabitsContext } from '../../context/habits-store.js'
import { todayKey, aggToday, aggregateYearGrid, strengthOf, trendSeries } from '../../lib/proto-adapters.js'
import { buildInkMap } from '../../lib/directions.js'
import { Glyph, YearHeatmap, Sparkline } from './widgets.jsx'

export default function TallyOverview({ onBack, onOpenHabit, onShare }) {
  const { habits, completions, meta } = useHabitsContext()
  const today = todayKey()
  const active = useMemo(() => habits.filter((h) => !h.archived), [habits])
  const inkMap = useMemo(() => buildInkMap(habits, meta?.ink), [habits, meta?.ink])

  const agg = useMemo(() => aggToday(active, completions, today), [active, completions, today])
  const grid = useMemo(() => aggregateYearGrid(active, completions, today), [active, completions, today])
  const rows = useMemo(() => active.map((h) => ({
    habit: h,
    strength: strengthOf(h, completions, today),
    series: trendSeries(h, completions, today),
  })), [active, completions, today])

  return (
    <div className="screen">
      <div className="overview__bar rise">
        <button className="backbtn" type="button" onClick={onBack}>‹ Today</button>
        <button className="iconbtn" type="button" onClick={onShare} title="Year in review" aria-label="Year in review">✦</button>
      </div>
      <div className="overview__title rise">Overview</div>

      <div className="overview__today rise" style={{ animationDelay: '40ms' }}>
        <span className="overview__pct">{agg.total ? agg.pct + '%' : '—'}</span>
        <div className="daystat__meta">
          <span className="daystat__label"><b>{agg.done}</b> of <b>{agg.total}</b> done today</span>
          <div className="daystat__dots">
            {agg.items.map((it) => {
              const c = inkMap[it.habit.id] || it.habit.color
              return (
                <span key={it.habit.id} className={'daystat__dot' + (it.isDone ? ' is-done' : it.isMiss ? ' is-miss' : '')}
                  style={{ borderColor: c, background: it.isDone ? c : 'transparent' }} />
              )
            })}
          </div>
        </div>
      </div>

      <section className="section rise" style={{ animationDelay: '80ms' }}>
        <div className="section__title">All habits · last 12 months</div>
        <YearHeatmap grid={grid} />
      </section>

      <section className="section rise" style={{ animationDelay: '110ms' }}>
        <div className="section__title">Habits<span className="overview__count">{active.length}</span></div>
        <ul className="overview__list">
          {rows.map(({ habit, strength, series }) => (
            <li key={habit.id}>
              <button className="ovrow" type="button" style={{ '--c': inkMap[habit.id] || habit.color }} onClick={() => onOpenHabit(habit.id)}>
                <span className="ovrow__ic"><Glyph habit={habit} size={18} /></span>
                <span className="ovrow__name">{habit.name}</span>
                <Sparkline series={series} color={inkMap[habit.id] || habit.color} />
                <span className="ovrow__str">{strength}</span>
                <span className="ovrow__chev">›</span>
              </button>
            </li>
          ))}
        </ul>
      </section>
      <div style={{ height: 8 }} />
    </div>
  )
}
