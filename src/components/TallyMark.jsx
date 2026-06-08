// The brand signature: hand-counted tally marks. Each group of five is four vertical
// strokes plus a diagonal strike-through (the ".struck" group). Strokes use currentColor
// so the mark inherits ink from whatever it sits in. Purely decorative (aria-hidden).

export default function TallyMark({ count = 5, height = 18, width = 2, className = '' }) {
  const groups = []
  let remaining = count
  while (remaining > 0) {
    groups.push(Math.min(5, remaining))
    remaining -= 5
  }
  return (
    <span
      className={`tallymark${className ? ` ${className}` : ''}`}
      style={{ '--tm-h': `${height}px`, '--tm-w': `${width}px` }}
      aria-hidden="true"
    >
      {groups.map((g, gi) => (
        <span key={gi} className={`tallymark__grp${g === 5 ? ' struck' : ''}`}>
          {Array.from({ length: Math.min(4, g) }).map((_, i) => (
            <span key={i} className="tallymark__stroke" />
          ))}
        </span>
      ))}
    </span>
  )
}
