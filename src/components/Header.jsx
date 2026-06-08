import { useState } from 'react'
import { useHabitsContext } from '../context/habits-store.js'
import { todayKey, fromKey } from '../lib/dates.js'
import ThemeModal from './ThemeModal.jsx'
import TallyMark from './TallyMark.jsx'

const DATE_FMT = { weekday: 'long', month: 'long', day: 'numeric' }

export default function Header({ onAdd, onHelp, onOverview }) {
  const { habits } = useHabitsContext()
  const [themeOpen, setThemeOpen] = useState(false)
  const today = todayKey()
  const dateLabel = fromKey(today).toLocaleDateString(undefined, DATE_FMT)
  const activeCount = habits.filter((h) => !h.archived).length
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'

  return (
    <header className="masthead">
      <div className="masthead__top">
        <div className="masthead__brand">
          <p className="masthead__kicker">{greeting}</p>
          <h1 className="masthead__word">tally</h1>
        </div>
        <div className="masthead__actions">
          {onOverview && (
            <button
              type="button"
              className="btn btn--ghost btn--icon"
              onClick={onOverview}
              aria-label="Overview"
              title="Overview"
            >
              📊
            </button>
          )}
          <button
            type="button"
            className="btn btn--ghost btn--icon"
            onClick={onHelp}
            aria-label="How it works"
            title="How it works"
          >
            ?
          </button>
          <button
            type="button"
            className="btn btn--ghost btn--icon"
            onClick={() => setThemeOpen(true)}
            aria-label="Themes"
            title="Themes"
          >
            🎨
          </button>
          <button type="button" className="btn btn--accent" onClick={onAdd} aria-label="Add habit">
            + New
          </button>
        </div>
      </div>

      {/* tally-mark rule: two hairlines flanking the brand's five-stroke mark */}
      <div className="masthead__rule" aria-hidden="true">
        <span className="masthead__hair" />
        <TallyMark count={5} height={16} width={2} />
        <span className="masthead__hair" />
      </div>

      <p className="masthead__meta">
        {dateLabel}
        {activeCount > 0 && <span className="masthead__count"> · {activeCount} active</span>}
      </p>

      {themeOpen && <ThemeModal onClose={() => setThemeOpen(false)} />}
    </header>
  )
}
