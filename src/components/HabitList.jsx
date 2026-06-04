import HabitRow from './HabitRow.jsx'

export default function HabitList({ title, habits, onEdit, emptyHint }) {
  return (
    <section className="habit-list">
      <h2 className="habit-list__title">{title}</h2>
      {habits.length === 0 ? (
        emptyHint ? <p className="habit-list__hint">{emptyHint}</p> : null
      ) : (
        <ul className="habit-list__items">
          {habits.map((h) => (
            <li key={h.id}>
              <HabitRow habit={h} onEdit={onEdit} />
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
