// All-habits aggregate heatmap for the overview: each day shaded by the share of that
// day's due habits you completed (in the theme accent). Rendering is delegated to the
// shared YearGrid.

import { useMemo } from 'react'
import { addDays, startOfWeek } from '../lib/dates.js'
import { aggregateHeatmapData } from '../lib/stats.js'
import YearGrid from './YearGrid.jsx'

// Matches YearGrid's 53-week window (the Sunday ~12 months back).
const gridStart = (today) => startOfWeek(addDays(today, -52 * 7))

export default function AggregateHeatmap({ habits, completions, today }) {
  const byDate = useMemo(() => {
    const rows = aggregateHeatmapData(habits, completions, gridStart(today), today, today)
    return new Map(rows.map((r) => [r.date, r]))
  }, [habits, completions, today])

  const fillFor = (date) => {
    const r = byDate.get(date)
    if (!r || r.due === 0 || r.done === 0) return 'var(--heat-empty)'
    const mixPct = Math.round((0.35 + 0.65 * r.ratio) * 100)
    return `color-mix(in srgb, var(--accent) ${mixPct}%, var(--heat-empty))`
  }

  const titleFor = (date) => {
    const r = byDate.get(date)
    return r && r.due ? `${date}: ${r.done}/${r.due} done` : date
  }

  const legend = (
    <div className="heatmap__legend">
      <span>Less</span>
      <span className="heatmap__key" style={{ background: 'var(--heat-empty)' }} />
      <span className="heatmap__key" style={{ background: 'color-mix(in srgb, var(--accent) 45%, var(--heat-empty))' }} />
      <span className="heatmap__key" style={{ background: 'var(--accent)' }} />
      <span>More</span>
    </div>
  )

  return <YearGrid today={today} fillFor={fillFor} titleFor={titleFor} legend={legend} accent="var(--accent)" />
}
