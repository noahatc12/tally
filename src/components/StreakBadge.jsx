export default function StreakBadge({ streaks, dim }) {
  const { current, longest, unit } = streaks
  const label = unit === 'weeks' ? 'wk' : 'd'
  return (
    <div className={`streak${dim ? ' streak--dim' : ''}`} title={`Longest: ${longest}${label}`}>
      <span className="streak__flame" aria-hidden="true">
        🔥
      </span>
      <span className="streak__num">{current}</span>
      <span className="streak__unit">{label}</span>
    </div>
  )
}
