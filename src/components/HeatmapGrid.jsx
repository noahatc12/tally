// Full-year GitHub-style heatmap for one habit. Columns are weeks (Sun..Sat rows),
// the trailing ~12 months ending today. Only DONE days take the habit's color; skips
// read as a faint neutral and everything else (miss / off-day / future) is empty —
// the heatmap is a positive record of what you did, not a wall of red. The honest
// "how am I doing" signal lives in the strength trend; this stays encouraging.

import { useEffect, useMemo, useRef } from 'react'
import { addDays, startOfWeek, getWeekday, diffDays, fromKey } from '../lib/dates.js'
import { heatmapData } from '../lib/stats.js'

const CELL = 12
const GAP = 3
const STEP = CELL + GAP
const TOP = 16 // room for month labels
const LEFT = 22 // room for weekday labels
const WEEKS = 53
const DOW = ['', 'Mon', '', 'Wed', '', 'Fri', '']
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export default function HeatmapGrid({ habit, completions, today, color }) {
  const scroller = useRef(null)

  const { weeks, months, width, height } = useMemo(() => {
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
        cells.push({ date, kind })
      }
      cols.push({ w, cells })

      // Month label sits above the first column that lands in a new month.
      const m = fromKey(weekStart).getMonth()
      if (m !== prevMonth && getWeekday(weekStart) <= 6) {
        monthLabels.push({ x: LEFT + w * STEP, label: MONTHS[m] })
        prevMonth = m
      }
    }

    return {
      weeks: cols,
      months: monthLabels,
      width: LEFT + WEEKS * STEP,
      height: TOP + 7 * STEP,
    }
  }, [habit, completions, today])

  // Open scrolled to the right so the most recent weeks (incl. today) are visible.
  useEffect(() => {
    const el = scroller.current
    if (el) el.scrollLeft = el.scrollWidth
  }, [width])

  const fillFor = (kind) => {
    if (kind === 'done') return color
    if (kind === 'skip') return `color-mix(in srgb, ${color} 22%, var(--heat-empty))`
    if (kind === 'future') return 'transparent'
    return 'var(--heat-empty)'
  }

  return (
    <div className="heatmap">
      <div className="heatmap__scroll" ref={scroller}>
        <svg width={width} height={height} className="heatmap__svg" role="img" aria-label="Daily completion over the last year">
          {months.map((m) => (
            <text key={`${m.label}-${m.x}`} x={m.x} y={11} className="heatmap__month">
              {m.label}
            </text>
          ))}
          {DOW.map((d, i) =>
            d ? (
              <text key={d} x={LEFT - 6} y={TOP + i * STEP + CELL - 2} textAnchor="end" className="heatmap__dow">
                {d}
              </text>
            ) : null,
          )}
          {weeks.map((col) =>
            col.cells.map((cell) => {
              const dow = getWeekday(cell.date)
              const isToday = cell.date === today
              return (
                <rect
                  key={cell.date}
                  x={LEFT + col.w * STEP}
                  y={TOP + dow * STEP}
                  width={CELL}
                  height={CELL}
                  rx="2.5"
                  fill={fillFor(cell.kind)}
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
