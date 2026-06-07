// Per-habit year heatmap. Only DONE days take the habit's color; skips read faint and
// everything else (miss / off-day / future) is empty — a positive record of what you
// did, not a wall of red. Measured/timed habits ramp the done shade by value/goal.
// Rendering is delegated to the shared YearGrid.

import { formatDuration } from '../lib/duration.js'
import YearGrid from './YearGrid.jsx'

export default function HeatmapGrid({ habit, completions, today, color }) {
  const ramp = (habit.type === 'quantitative' || habit.type === 'duration') && (habit.target?.amount || 0) > 0
  const goal = habit.target?.amount || 0
  const isDuration = habit.type === 'duration'

  const fillFor = (date) => {
    const entry = completions[date]?.[habit.id]
    const state = entry?.state
    if (state === 'done') {
      if (ramp) {
        const ratio = Math.min(1, (entry.value || 0) / goal)
        const mixPct = Math.round((0.4 + 0.6 * ratio) * 100)
        return `color-mix(in srgb, ${color} ${mixPct}%, var(--heat-empty))`
      }
      return color
    }
    if (state === 'skip') return `color-mix(in srgb, ${color} 22%, var(--heat-empty))`
    return 'var(--heat-empty)'
  }

  const titleFor = (date) => {
    const entry = completions[date]?.[habit.id]
    if (entry?.state === 'done' && entry.value) {
      return `${date}: ${isDuration ? formatDuration(entry.value) : entry.value}`
    }
    if (entry?.state === 'done') return `${date}: done`
    if (entry?.state === 'skip') return `${date}: skip`
    return date
  }

  const legend = (
    <div className="heatmap__legend">
      <span>Less</span>
      <span className="heatmap__key" style={{ background: 'var(--heat-empty)' }} />
      <span className="heatmap__key" style={{ background: `color-mix(in srgb, ${color} 45%, var(--heat-empty))` }} />
      <span className="heatmap__key" style={{ background: color }} />
      <span>More</span>
    </div>
  )

  return <YearGrid today={today} fillFor={fillFor} titleFor={titleFor} legend={legend} accent={color} />
}
