import { useHabitsContext } from '../context/habits-store.js'

// A small, friendly starter set. The timeline copy is honest: ~66 days, not 21.
const EXAMPLES = [
  { name: 'Strength training', icon: '💪', color: '#C7F94B', schedule: { kind: 'timesPerWeek', timesPerWeek: 3 }, minimumVersion: '1 set', plan: { cue: 'morning coffee', time: '', place: '' } },
  { name: 'Read', icon: '📖', color: '#5BA8E2', schedule: { kind: 'daily' }, minimumVersion: 'one page', plan: { cue: 'getting into bed', time: '', place: '' } },
  { name: 'Drink water', icon: '💧', color: '#5BE2A8', type: 'quantitative', target: { amount: 8, unit: 'glasses' }, schedule: { kind: 'daily' } },
]

export default function EmptyState({ onAdd }) {
  const { addHabit } = useHabitsContext()

  const seed = () => EXAMPLES.forEach((e) => addHabit(e))

  return (
    <div className="empty">
      <div className="empty__art" aria-hidden="true">
        ◇
      </div>
      <h2 className="empty__title">Start one small habit</h2>
      <p className="empty__body">
        Habits build on an asymptotic curve — a median of about <strong>66 days</strong> (it
        varies widely). Missing a day won&apos;t derail you. Showing up at the minimum will.
      </p>
      <div className="empty__actions">
        <button type="button" className="btn btn--accent" onClick={onAdd}>
          Create a habit
        </button>
        <button type="button" className="btn btn--ghost" onClick={seed}>
          Add a few examples
        </button>
      </div>
    </div>
  )
}
