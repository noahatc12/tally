import { useState } from 'react'
import { useHabitsContext } from '../context/habits-store.js'
import { todayKey, fromKey } from '../lib/dates.js'
import ThemeModal from './ThemeModal.jsx'

const DATE_FMT = { weekday: 'long', month: 'long', day: 'numeric' }

export default function Header({ onAdd, onHelp }) {
  const { habits } = useHabitsContext()
  const [themeOpen, setThemeOpen] = useState(false)
  const today = todayKey()
  const dateLabel = fromKey(today).toLocaleDateString(undefined, DATE_FMT)
  const activeCount = habits.filter((h) => !h.archived).length
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'

  return (
    <header className="header">
      <div className="header__top">
        <div>
          <p className="header__greeting">{greeting}</p>
          <h1 className="header__title">tally</h1>
          <p className="header__date">{dateLabel}</p>
        </div>
        <div className="header__actions">
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
      {activeCount > 0 && <p className="header__sub">{activeCount} active</p>}
      {themeOpen && <ThemeModal onClose={() => setThemeOpen(false)} />}
    </header>
  )
}
