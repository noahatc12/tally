// The .tally root: a viewport-filling, centered mobile column that owns the design tokens.
// resolveTweaks(meta) produces the inline CSS-variable map + data-* attributes that tally.css
// reads, so switching Look/palette repaints everything. Replaces the old documentElement
// theming for ported screens.

import { useHabitsContext } from '../../context/habits-store.js'
import { metaToTweaks, resolveTweaks } from '../../lib/directions.js'

export default function TallyShell({ children }) {
  const { meta } = useHabitsContext()
  const { vars, attrs } = resolveTweaks(metaToTweaks(meta))
  return (
    <div className="tally-frame">
      <div className="tally" style={vars} {...attrs}>
        {children}
      </div>
    </div>
  )
}
