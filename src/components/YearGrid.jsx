// Generic GitHub-style year grid: 53 week-columns x 7 day-rows for the trailing 12
// months, a fixed weekday gutter, month labels, and horizontal scroll (opened at the
// most recent week). Callers supply how each day is colored/labelled, so both the
// per-habit heatmap and the all-habits aggregate heatmap share this one renderer.
//
//   fillFor(dateKey)  -> CSS color string for that day's cell (only called for days
//                        on/before today; future days render transparent).
//   titleFor(dateKey) -> tooltip text for the cell.

import { useEffect, useMemo, useRef } from 'react'
import { addDays, startOfWeek, diffDays, fromKey } from '../lib/dates.js'

const CELL = 12
const GAP = 3
const STEP = CELL + GAP
const TOP = 16 // room for month labels
const GUTTER = 30 // fixed weekday-label column width
const WEEKS = 53
const DOW = ['', 'Mon', '', 'Wed', '', 'Fri', '']
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const HEIGHT = TOP + 7 * STEP

// The Sunday ~12 months back that the grid starts on.
const gridStart = (today) => startOfWeek(addDays(today, -(WEEKS - 1) * 7))

export default function YearGrid({ today, fillFor, titleFor, legend, accent = 'var(--text-muted)' }) {
  const scroller = useRef(null)

  const { weeks, months, gridWidth } = useMemo(() => {
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
    return { weeks: cols, months: monthLabels, gridWidth: WEEKS * STEP }
  }, [today])

  // Open scrolled to the right so the most recent weeks (incl. today) are visible.
  useEffect(() => {
    const el = scroller.current
    if (el) el.scrollLeft = el.scrollWidth
  }, [gridWidth])

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
          <svg width={gridWidth} height={HEIGHT} className="heatmap__svg" role="img" aria-label="Activity over the last year">
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
        </div>
      </div>
      {legend}
    </div>
  )
}
