// A brief, affirming micro-celebration within a second of marking a habit done —
// a positive feeling right after the behavior is what wires it in. No guilt, ever.
// Respects prefers-reduced-motion (the CSS animations collapse to ~instant).

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useHabitsContext } from '../context/habits-store.js'

const AFFIRMATIONS = [
  'Nice. That counts.',
  'Showed up.',
  'One more brick.',
  'That’s the rep.',
  'Momentum.',
  'Strength +1.',
]

export default function CelebrationLayer() {
  const { celebration } = useHabitsContext()
  // We derive visibility from celebration vs. the last dismissed timestamp, so the
  // effect only schedules the auto-dismiss (no synchronous setState in the effect).
  const [dismissedTs, setDismissedTs] = useState(0)

  useEffect(() => {
    if (!celebration) return
    const t = setTimeout(() => setDismissedTs(celebration.ts), 900)
    return () => clearTimeout(t)
  }, [celebration])

  if (!celebration || celebration.ts === dismissedTs) return null

  const msg = AFFIRMATIONS[celebration.ts % AFFIRMATIONS.length]
  return createPortal(
    <div className="celebrate" key={celebration.ts} role="status" aria-live="polite">
      <div className="celebrate__pop">
        <span className="celebrate__check" aria-hidden="true">
          ✓
        </span>
        <span className="celebrate__msg">{msg}</span>
      </div>
    </div>,
    document.body,
  )
}
