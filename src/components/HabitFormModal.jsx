import { useState } from 'react'
import { useHabitsContext } from '../context/habits-store.js'
import { HABIT_ICONS } from '../lib/factories.js'
import { resolvePalette } from '../lib/theme.js'

const WEEKDAYS = [
  { v: 0, l: 'Su' },
  { v: 1, l: 'Mo' },
  { v: 2, l: 'Tu' },
  { v: 3, l: 'We' },
  { v: 4, l: 'Th' },
  { v: 5, l: 'Fr' },
  { v: 6, l: 'Sa' },
]

function initialForm(habit, palette) {
  const s = habit?.schedule || {}
  return {
    name: habit?.name || '',
    color: habit?.color || palette[0],
    icon: habit?.icon || HABIT_ICONS[0],
    type: habit?.type || 'binary',
    targetAmount: habit?.target?.amount || '',
    targetUnit: habit?.target?.unit || '',
    scheduleKind: s.kind || 'daily',
    weekdays: s.weekdays || [1, 2, 3, 4, 5],
    timesPerWeek: s.timesPerWeek || 3,
    everyN: s.everyN || 2,
    cue: habit?.plan?.cue || '',
    time: habit?.plan?.time || '',
    place: habit?.plan?.place || '',
    minimumVersion: habit?.minimumVersion || '',
    anchor: habit?.anchor || '',
  }
}

export default function HabitFormModal({ habit, existingHabits, onClose }) {
  const { meta, addHabit, updateHabit, archiveHabit, deleteHabit } = useHabitsContext()
  const palette = resolvePalette(meta?.theme || 'dark', meta?.customThemes || [])
  const [f, setF] = useState(() => initialForm(habit, palette))
  const isEdit = Boolean(habit)
  const set = (patch) => setF((prev) => ({ ...prev, ...patch }))

  const toggleWeekday = (v) =>
    set({ weekdays: f.weekdays.includes(v) ? f.weekdays.filter((x) => x !== v) : [...f.weekdays, v].sort() })

  const buildSchedule = () => {
    switch (f.scheduleKind) {
      case 'weekdays':
        return { kind: 'weekdays', weekdays: f.weekdays.length ? f.weekdays : [1, 2, 3, 4, 5] }
      case 'timesPerWeek':
        return { kind: 'timesPerWeek', timesPerWeek: Math.max(1, Number(f.timesPerWeek) || 1) }
      case 'everyNDays':
        return { kind: 'everyNDays', everyN: Math.max(1, Number(f.everyN) || 1) }
      default:
        return { kind: 'daily' }
    }
  }

  const onSubmit = (e) => {
    e.preventDefault()
    if (!f.name.trim()) return
    const payload = {
      name: f.name.trim(),
      color: f.color,
      icon: f.icon,
      type: f.type,
      target:
        f.type === 'quantitative' && f.targetAmount
          ? { amount: Number(f.targetAmount), unit: f.targetUnit.trim() || 'units' }
          : null,
      schedule: buildSchedule(),
      minimumVersion: f.minimumVersion.trim(),
      plan: { cue: f.cue.trim(), time: f.time, place: f.place.trim() },
      anchor: f.anchor || null,
    }
    if (isEdit) updateHabit(habit.id, payload)
    else addHabit(payload)
    onClose()
  }

  const anchorOptions = (existingHabits || []).filter((h) => h.id !== habit?.id)

  return (
    <div className="modal" role="dialog" aria-modal="true" aria-label={isEdit ? 'Edit habit' : 'New habit'}>
      <div className="modal__backdrop" onClick={onClose} />
      <form className="modal__panel" onSubmit={onSubmit}>
        <div className="modal__head">
          <h2>{isEdit ? 'Edit habit' : 'New habit'}</h2>
          <button type="button" className="btn btn--ghost" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <label className="field">
          <span className="field__label">Name</span>
          <input
            className="field__input"
            value={f.name}
            onChange={(e) => set({ name: e.target.value })}
            placeholder="e.g. Strength training"
          />
        </label>

        <div className="field">
          <span className="field__label">Icon</span>
          <div className="chips">
            {HABIT_ICONS.map((ic) => (
              <button
                key={ic}
                type="button"
                className={`chip${f.icon === ic ? ' is-active' : ''}`}
                onClick={() => set({ icon: ic })}
              >
                {ic}
              </button>
            ))}
            <input
              className="chip chip--input"
              value={HABIT_ICONS.includes(f.icon) ? '' : f.icon}
              onChange={(e) => set({ icon: e.target.value.slice(0, 8) || f.icon })}
              placeholder="＋"
              aria-label="Type any emoji"
              inputMode="text"
            />
          </div>
        </div>

        <div className="field">
          <span className="field__label">Color</span>
          <div className="chips">
            {palette.map((c) => (
              <button
                key={c}
                type="button"
                className={`swatch${f.color.toLowerCase() === c.toLowerCase() ? ' is-active' : ''}`}
                style={{ background: c }}
                onClick={() => set({ color: c })}
                aria-label={`Color ${c}`}
              />
            ))}
            <label className="swatch swatch--custom" title="Custom color">
              <input
                type="color"
                value={f.color}
                onChange={(e) => set({ color: e.target.value })}
                aria-label="Custom color"
              />
            </label>
          </div>
        </div>

        <div className="field">
          <span className="field__label">Type</span>
          <div className="segmented">
            <button type="button" className={f.type === 'binary' ? 'is-active' : ''} onClick={() => set({ type: 'binary' })}>
              Yes / no
            </button>
            <button
              type="button"
              className={f.type === 'quantitative' ? 'is-active' : ''}
              onClick={() => set({ type: 'quantitative' })}
            >
              Measured
            </button>
          </div>
        </div>

        {f.type === 'quantitative' && (
          <div className="field--row">
            <label className="field">
              <span className="field__label">Amount</span>
              <input
                className="field__input"
                type="number"
                min="1"
                value={f.targetAmount}
                onChange={(e) => set({ targetAmount: e.target.value })}
                placeholder="8"
              />
            </label>
            <label className="field">
              <span className="field__label">Unit</span>
              <input
                className="field__input"
                value={f.targetUnit}
                onChange={(e) => set({ targetUnit: e.target.value })}
                placeholder="glasses"
              />
            </label>
          </div>
        )}

        <div className="field">
          <span className="field__label">Schedule</span>
          <div className="segmented segmented--wrap">
            {[
              ['daily', 'Daily'],
              ['weekdays', 'Days'],
              ['timesPerWeek', '×/week'],
              ['everyNDays', 'Every N'],
            ].map(([k, l]) => (
              <button key={k} type="button" className={f.scheduleKind === k ? 'is-active' : ''} onClick={() => set({ scheduleKind: k })}>
                {l}
              </button>
            ))}
          </div>
          {f.scheduleKind === 'weekdays' && (
            <div className="chips chips--days">
              {WEEKDAYS.map((d) => (
                <button
                  key={d.v}
                  type="button"
                  className={`chip${f.weekdays.includes(d.v) ? ' is-active' : ''}`}
                  onClick={() => toggleWeekday(d.v)}
                >
                  {d.l}
                </button>
              ))}
            </div>
          )}
          {f.scheduleKind === 'timesPerWeek' && (
            <label className="inline">
              <input type="number" min="1" max="7" value={f.timesPerWeek} onChange={(e) => set({ timesPerWeek: e.target.value })} className="field__input field__input--sm" />
              times per week
            </label>
          )}
          {f.scheduleKind === 'everyNDays' && (
            <label className="inline">
              every
              <input type="number" min="1" value={f.everyN} onChange={(e) => set({ everyN: e.target.value })} className="field__input field__input--sm" />
              days
            </label>
          )}
        </div>

        <div className="plan">
          <p className="plan__legend">Make it stick</p>
          <label className="field">
            <span className="field__label">Minimum version (the 2-minute floor)</span>
            <input className="field__input" value={f.minimumVersion} onChange={(e) => set({ minimumVersion: e.target.value })} placeholder="e.g. one set / one page" />
          </label>
          <label className="field">
            <span className="field__label">Cue — “after …”</span>
            <input className="field__input" value={f.cue} onChange={(e) => set({ cue: e.target.value })} placeholder="morning coffee" />
          </label>
          <label className="field">
            <span className="field__label">Time</span>
            <input className="field__input" type="time" value={f.time} onChange={(e) => set({ time: e.target.value })} />
          </label>
          <label className="field">
            <span className="field__label">Place</span>
            <input className="field__input" value={f.place} onChange={(e) => set({ place: e.target.value })} placeholder="home gym" />
          </label>
          {anchorOptions.length > 0 && (
            <label className="field">
              <span className="field__label">Stack onto (anchor habit)</span>
              <select className="field__input" value={f.anchor} onChange={(e) => set({ anchor: e.target.value })}>
                <option value="">— none —</option>
                {anchorOptions.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.icon} {h.name}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>

        <div className="modal__foot">
          <button type="submit" className="btn btn--accent btn--block">
            {isEdit ? 'Save changes' : 'Add habit'}
          </button>
          {isEdit && (
            <div className="modal__danger">
              <button type="button" className="btn btn--ghost" onClick={() => { archiveHabit(habit.id); onClose() }}>
                Archive
              </button>
              <button
                type="button"
                className="btn btn--danger"
                onClick={() => { if (confirm(`Delete “${habit.name}” and its history?`)) { deleteHabit(habit.id); onClose() } }}
              >
                Delete
              </button>
            </div>
          )}
        </div>
      </form>
    </div>
  )
}
