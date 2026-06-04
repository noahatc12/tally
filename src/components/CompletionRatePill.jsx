export default function CompletionRatePill({ week }) {
  const pct = week.rate == null ? '·' : `${Math.round(week.rate * 100)}%`
  return (
    <span className="pill" title="Completion this week (skips excluded)">
      this week {pct}
    </span>
  )
}
