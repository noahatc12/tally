// The core interaction: done / skip / missed. One tap. Tapping the active state
// again clears it. Skip is framed neutrally (a rest day), never as a failure.

const STATES = [
  { key: 'done', label: 'Done', glyph: '✓' },
  { key: 'skip', label: 'Skip', glyph: '~' },
  { key: 'missed', label: 'Miss', glyph: '✕' },
]

export default function ThreeStateToggle({ value, onSelect }) {
  return (
    <div className="toggle" role="group" aria-label="Mark today">
      {STATES.map((s) => {
        const active = value === s.key
        return (
          <button
            key={s.key}
            type="button"
            className={`toggle__btn toggle__btn--${s.key}${active ? ' is-active' : ''}`}
            aria-pressed={active}
            onClick={() => onSelect(s.key)}
          >
            <span className="toggle__glyph" aria-hidden="true">
              {s.glyph}
            </span>
            {s.label}
          </button>
        )
      })}
    </div>
  )
}
