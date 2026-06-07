// Hand-rolled SVG strength trend. No chart library: we draw a smooth (Catmull-Rom)
// line over the strengthSeries with a soft gradient fill underneath, in the habit's
// own color. Points are spaced evenly by event index (not date) so sparse habits
// stay readable; the first/last dates are annotated below the axis.

import { useMemo } from 'react'
import { fromKey } from '../lib/dates.js'

const W = 320
const H = 132
const PAD = { top: 10, right: 10, bottom: 8, left: 10 }
const GRAD_ID = 'trend-fill'

// Include a 2-digit year: the trend can span a full year, so "Jun 1 -> Jun 6" alone
// reads like days rather than a year apart.
const DATE_FMT = { month: 'short', day: 'numeric', year: '2-digit' }
const shortDate = (key) => fromKey(key).toLocaleDateString(undefined, DATE_FMT)

// Catmull-Rom -> cubic bezier for a smooth line through every point (tension 1/6).
function smoothPath(pts) {
  let d = `M ${pts[0].x.toFixed(2)},${pts[0].y.toFixed(2)}`
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i]
    const p1 = pts[i]
    const p2 = pts[i + 1]
    const p3 = pts[i + 2] || p2
    const c1x = p1.x + (p2.x - p0.x) / 6
    const c1y = p1.y + (p2.y - p0.y) / 6
    const c2x = p2.x - (p3.x - p1.x) / 6
    const c2y = p2.y - (p3.y - p1.y) / 6
    d += ` C ${c1x.toFixed(2)},${c1y.toFixed(2)} ${c2x.toFixed(2)},${c2y.toFixed(2)} ${p2.x.toFixed(2)},${p2.y.toFixed(2)}`
  }
  return d
}

export default function TrendChart({ series, color }) {
  const geom = useMemo(() => {
    if (!series || series.length < 2) return null
    const innerW = W - PAD.left - PAD.right
    const innerH = H - PAD.top - PAD.bottom
    const n = series.length
    const x = (i) => PAD.left + (n === 1 ? innerW / 2 : (i / (n - 1)) * innerW)
    const y = (v) => PAD.top + (1 - Math.max(0, Math.min(100, v)) / 100) * innerH
    const pts = series.map((p, i) => ({ x: x(i), y: y(p.value) }))
    const line = smoothPath(pts)
    const last = pts[pts.length - 1]
    const area = `${line} L ${last.x.toFixed(2)},${(H - PAD.bottom).toFixed(2)} L ${pts[0].x.toFixed(2)},${(H - PAD.bottom).toFixed(2)} Z`
    return { line, area, last, mid: y(50), top: y(100), bottom: y(0) }
  }, [series])

  if (!geom) {
    return (
      <div className="trend trend--empty">
        <p>Not enough history yet. Check in a few times and your strength trend appears here.</p>
      </div>
    )
  }

  return (
    <div className="trend">
      <svg viewBox={`0 0 ${W} ${H}`} className="trend__svg" role="img" aria-label="Strength over time">
        <defs>
          <linearGradient id={GRAD_ID} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.34" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* faint reference gridlines at 0 / 50 / 100 */}
        <line x1={PAD.left} x2={W - PAD.right} y1={geom.top} y2={geom.top} className="trend__grid" />
        <line x1={PAD.left} x2={W - PAD.right} y1={geom.mid} y2={geom.mid} className="trend__grid" />
        <line x1={PAD.left} x2={W - PAD.right} y1={geom.bottom} y2={geom.bottom} className="trend__grid" />
        <path d={geom.area} fill={`url(#${GRAD_ID})`} />
        <path d={geom.line} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
        <circle cx={geom.last.x} cy={geom.last.y} r="3.5" fill={color} stroke="var(--surface)" strokeWidth="2" vectorEffect="non-scaling-stroke" />
      </svg>
      <div className="trend__axis">
        <span>{shortDate(series[0].key)}</span>
        <span>{shortDate(series[series.length - 1].key)}</span>
      </div>
    </div>
  )
}
