import { useHabitsContext } from '../context/habits-store.js'
import { resolvePalette } from '../lib/theme.js'

// A small, friendly starter set. The timeline copy is honest: ~66 days, not 21.
// Colors are assigned from the active theme's palette at seed time.
const EXAMPLES = [
  { name: 'Strength training', icon: '💪', schedule: { kind: 'timesPerWeek', timesPerWeek: 3 }, minimumVersion: '1 set', plan: { cue: 'morning coffee', time: '', place: '' } },
  { name: 'Read', icon: '📖', schedule: { kind: 'daily' }, minimumVersion: 'one page', plan: { cue: 'getting into bed', time: '', place: '' } },
  { name: 'Drink water', icon: '💧', type: 'quantitative', target: { amount: 8, unit: 'glasses' }, schedule: { kind: 'daily' } },
]

export default function EmptyState({ onAdd, onHelp }) {
  const { addHabit, meta } = useHabitsContext()
  const palette = resolvePalette(meta?.theme || 'dark', meta?.customThemes || [])

  const seed = () => EXAMPLES.forEach((e, i) => addHabit({ ...e, color: palette[i % palette.length] }))

  return (
    <div className="empty">
      <div className="empty__art" aria-hidden="true">
        ◇
      </div>
      <h2 className="empty__title">Build momentum, one day at a time</h2>
      <p className="empty__body">
        Small, steady actions compound. Miss a day and nothing is lost. Showing up at the
        minimum is the whole game.
      </p>
      <div className="empty__actions">
        <button type="button" className="btn btn--accent" onClick={onAdd}>
          Create one
        </button>
        <button type="button" className="btn btn--ghost" onClick={seed}>
          Add a few examples
        </button>
        <button type="button" className="btn btn--ghost" onClick={onHelp}>
          How it works
        </button>
      </div>
    </div>
  )
}
