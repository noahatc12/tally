// Full-year GitHub-style heatmap for one habit. Columns are weeks (Sun..Sat rows),
// the trailing ~12 months ending today. Only DONE days take the habit's color; skips
// read as a faint neutral and everything else (miss / off-day / future) is empty —
// the heatmap is a positive record of what you did, not a wall of red. The honest
// "how am I doing" signal lives in the strength trend; this stays encouraging.
//
// Weekday labels live in a FIXED left gutter (their own small SVG) so they neither
// scroll away with the grid nor crowd the first column.

import { useEffect, useMemo, useRef } from 'react'
import { addDays, startOfWeek, getWeekday, diffDays, fromKey } from '../lib/dates.js'
import { heatmapData } from '../lib/stats.js'

const CELL = 12
const GAP = 3
const STEP = CELL + GAP
const TOP = 16 // room for month labels
const GUTTER = 30 // fixed weekday-label column width
const WEEKS = 53
const DOW = ['', 'Mon', '', 'Wed', '', 'Fri', '']
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const HEIGHT = TOP + 7 * STEP

export default function HeatmapGrid({ habit, completions, today, color }) {
  const scroller = useRef(null)

  const { weeks, months, gridWidth } = useMemo(() => {
    const start = startOfWeek(addDays(today, -(WEEKS - 1) * 7)) // Sunday, ~12 months back
    const byDate = new Map()
    for (const d of heatmapData(habit, completions, start, today, today)) byDate.set(d.date, d)

    const cols = []
    const monthLabels = []
    let prevMonth = -1
    for (let w = 0; w < WEEKS; w++) {
      const weekStart = addDays(start, w * 7)
      const cells = []
      for (let dow = 0; dow < 7; dow++) {
        const date = addDays(weekStart, dow)
        if (diffDays(date, today) < 0) {
          cells.push({ date, kind: 'future' }) // beyond today -> blank
          continue
        }
        const entry = byDate.get(date)
        let kind = 'empty'
        if (entry) {
          if (entry.state === 'done') kind = 'done'
          else if (entry.state === 'skip') kind = 'skip'
        }
        cells.push({ date, kind, value: entry?.value || 0 })
      }
      cols.push({ w, cells })

      // Month label sits above the first column that lands in a new month.
      const m = fromKey(weekStart).getMonth()
      if (m !== prevMonth) {
        monthLabels.push({ x: w * STEP, label: MONTHS[m] })
        prevMonth = m
      }
    }

    return { weeks: cols, months: monthLabels, gridWidth: WEEKS * STEP }
  }, [habit, completions, today])

  // Open scrolled to the right so the most recent weeks (incl. today) are visible.
  useEffect(() => {
    const el = scroller.current
    if (el) el.scrollLeft = el.scrollWidth
  }, [gridWidth])

  // Measured/timed habits ramp the done shade by how close the day got to its goal
  // (with a floor so even a small log stays visible); binary habits are full color.
  const ramp = (habit.type === 'quantitative' || habit.type === 'duration') && (habit.target?.amount || 0) > 0
  const goal = habit.target?.amount || 0
  const fillFor = (cell) => {
    if (cell.kind === 'done') {
      if (ramp) {
        const ratio = Math.min(1, cell.value / goal)
        const mixPct = Math.round((0.4 + 0.6 * ratio) * 100)
        return `color-mix(in srgb, ${color} ${mixPct}%, var(--heat-empty))`
      }
      return color
    }
    if (cell.kind === 'skip') return `color-mix(in srgb, ${color} 22%, var(--heat-empty))`
    if (cell.kind === 'future') return 'transparent'
    return 'var(--heat-empty)'
  }

  return (
    <div className="heatmap">
      <div className="heatmap__body">
        <svg className="heatmap__gutter" width={GUTTER} height={HEIGHT} aria-hidden="true">
          {DOW.map((d, i) =>
            d ? (
              <text key={d} x={GUTTER - 6} y={TOP + i * STEP + CELL - 2} textAnchor="end" className="heatmap__dow">
                {d}
              </text>
            ) : null,
          )}
        </svg>
        <div className="heatmap__scroll" ref={scroller}>
          <svg width={gridWidth} height={HEIGHT} className="heatmap__svg" role="img" aria-label="Daily completion over the last year">
            {months.map((m) => (
              <text key={`${m.label}-${m.x}`} x={m.x} y={11} className="heatmap__month">
                {m.label}
              </text>
            ))}
            {weeks.map((col) =>
              col.cells.map((cell) => {
                const dow = getWeekday(cell.date)
                const isToday = cell.date === today
                return (
                  <rect
                    key={cell.date}
                    x={col.w * STEP}
                    y={TOP + dow * STEP}
                    width={CELL}
                    height={CELL}
                    rx="2.5"
                    fill={fillFor(cell)}
                    stroke={isToday ? color : 'none'}
                    strokeWidth={isToday ? 1.5 : 0}
                  >
                    <title>{cell.date}</title>
                  </rect>
                )
              }),
            )}
          </svg>
        </div>
      </div>
      <div className="heatmap__legend">
        <span>Less</span>
        <span className="heatmap__key" style={{ background: 'var(--heat-empty)' }} />
        <span className="heatmap__key" style={{ background: `color-mix(in srgb, ${color} 45%, var(--heat-empty))` }} />
        <span className="heatmap__key" style={{ background: color }} />
        <span>More</span>
      </div>
    </div>
  )
}
