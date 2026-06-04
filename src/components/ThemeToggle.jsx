import { useHabitsContext } from '../context/habits-store.js'

export default function ThemeToggle() {
  const { meta, setTheme } = useHabitsContext()
  const theme = meta?.theme || 'dark'
  const next = theme === 'dark' ? 'light' : 'dark'

  return (
    <button
      type="button"
      className="btn btn--ghost"
      onClick={() => setTheme(next)}
      aria-label={`Switch to ${next} theme`}
      title={`Switch to ${next} theme`}
    >
      {theme === 'dark' ? '☀' : '☾'}
    </button>
  )
}
