// Generic GitHub-style year grid: 53 week-columns x 7 day-rows for the trailing 12
// months, with month labels. Rendered as a single SVG scaled to the container width
// (viewBox + preserveAspectRatio, width:100%) so it never needs a horizontal scrollbar
// — the cells shrink to fit. Callers supply how each day is colored/labelled, so both the
// per-habit heatmap and the all-habits aggregate heatmap share this one renderer.
//
//   fillFor(dateKey)  -> CSS color string for that day's cell (only called for days
//                        on/before today; future days render transparent).
//   titleFor(dateKey) -> tooltip text for the cell.

import { useMemo } from 'react'
import { addDays, startOfWeek, diffDays, fromKey } from '../lib/dates.js'

const CELL = 12
const GAP = 3
const STEP = CELL + GAP
const TOP = 16 // room for month labels
const WEEKS = 53
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const HEIGHT = TOP + 7 * STEP
const WIDTH = WEEKS * STEP

// The Sunday ~12 months back that the grid starts on.
const gridStart = (today) => startOfWeek(addDays(today, -(WEEKS - 1) * 7))

export default function YearGrid({ today, fillFor, titleFor, legend, accent = 'var(--text-muted)' }) {
  const { weeks, months } = useMemo(() => {
    const start = gridStart(today)
    const cols = []
    const monthLabels = []
    let prevMonth = -1
    for (let w = 0; w < WEEKS; w++) {
      const weekStart = addDays(start, w * 7)
      const cells = []
      for (let dow = 0; dow < 7; dow++) {
        const date = addDays(weekStart, dow)
        cells.push({ date, dow, future: diffDays(date, today) < 0, isToday: date === today })
      }
      cols.push({ w, cells })
      const m = fromKey(weekStart).getMonth()
      if (m !== prevMonth) {
        monthLabels.push({ x: w * STEP, label: MONTHS[m] })
        prevMonth = m
      }
    }
    return { weeks: cols, months: monthLabels }
  }, [today])

  return (
    <div className="heatmap">
      <svg
        className="heatmap__svg"
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        width="100%"
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label="Activity over the last year"
      >
        {months.map((m) => (
          <text key={`${m.label}-${m.x}`} x={m.x} y={11} className="heatmap__month">
            {m.label}
          </text>
        ))}
        {weeks.map((col) =>
          col.cells.map((cell) => (
            <rect
              key={cell.date}
              x={col.w * STEP}
              y={TOP + cell.dow * STEP}
              width={CELL}
              height={CELL}
              rx="2.5"
              fill={cell.future ? 'transparent' : fillFor(cell.date)}
              stroke={cell.isToday ? accent : 'none'}
              strokeWidth={cell.isToday ? 1.5 : 0}
            >
              <title>{titleFor ? titleFor(cell.date) : cell.date}</title>
            </rect>
          )),
        )}
      </svg>
      {legend}
    </div>
  )
}
