// A tiny strength sparkline (no axis/labels) for compact rows like the overview list.
// Just the line, normalized to a 0-100 y-range and stretched to fill its box.

export default function Sparkline({ series, color, width = 80, height = 26 }) {
  if (!series || series.length < 2) return <span className="spark spark--empty" aria-hidden="true" />

  const last = series.length - 1
  const points = series
    .map((p, i) => {
      const x = (i / last) * width
      const y = height - (Math.max(0, Math.min(100, p.value)) / 100) * height
      return `${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(' ')

  return (
    <svg className="spark" viewBox={`0 0 ${width} ${height}`} width={width} height={height} preserveAspectRatio="none" aria-hidden="true">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  )
}
