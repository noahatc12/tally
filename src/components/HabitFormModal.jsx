// Create / edit a habit. Ported to the handoff's bottom-sheet style (modals.jsx
// HabitFormSheet) — .sheet chrome, .seg segmented controls, .swrow swatches, .iconpick
// grid, .btnp buttons — while keeping this app's real store wiring and field model:
// type stays binary | quantitative | duration, color stays a per-theme hex palette, and
// the extra fields (Anytime, duration-minute presets) are preserved in the sheet idiom.

import { useState, createElement } from 'react'
import { useHabitsContext } from '../context/habits-store.js'
import { useScrollLock } from '../hooks/useScrollLock.js'
import { HABIT_ICONS } from '../lib/factories.js'
import { HABIT_ICON_NAMES, iconComponent } from '../lib/icons.js'
import { resolvePalette } from '../lib/theme.js'

// single-letter weekday seg, matching the prototype
const WEEKDAYS = [['S', 0], ['M', 1], ['T', 2], ['W', 3], ['T', 4], ['F', 5], ['S', 6]]

function initialForm(habit, palette) {
  const s = habit?.schedule || {}
  return {
    name: habit?.name || '',
    color: habit?.color || palette[0],
    icon: habit?.icon || HABIT_ICONS[0], // legacy emoji, kept for back-compat
    iconName: habit?.iconName ?? null, // Lucide icon key; null -> serif monogram
    tod: habit?.tod || '', // '' = anytime
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
    anchor: habit?.anchor || '', // stored by name, so Detail can render "after <name>"
  }
}

export default function HabitFormModal({ habit, existingHabits, onClose }) {
  useScrollLock()
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
      iconName: f.iconName,
      tod: f.tod || null,
      type: f.type,
      target:
        f.type === 'quantitative'
          ? { amount: Number(f.targetAmount) || 8, unit: f.targetUnit.trim() || 'times' }
          : f.type === 'duration'
            ? { amount: Number(f.targetAmount) || 20, unit: f.targetUnit === 'hr' ? 'hr' : 'min' }
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
  const measured = f.type === 'quantitative' || f.type === 'duration'

  return (
    <div className="sheet" role="dialog" aria-modal="true" aria-label={isEdit ? 'Edit habit' : 'New habit'}>
      <div className="sheet__scrim" onClick={onClose} />
      <form className="sheet__panel" onSubmit={onSubmit}>
        <div className="sheet__grab" />
        <div className="sheet__head">
          <span className="sheet__title">{isEdit ? 'Edit habit' : 'New habit'}</span>
          <button type="button" className="sheet__x" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <div className="sheet__sec">
          <span className="flabel">Name</span>
          <input className="input" value={f.name} placeholder="e.g. Read 10 pages"
            onChange={(e) => set({ name: e.target.value })} autoFocus />
        </div>

        <div className="sheet__sec">
          <span className="flabel">Ink</span>
          <div className="swrow swrow--grid">
            {palette.map((c) => (
              <button key={c} type="button" className={'sw' + (f.color.toLowerCase() === c.toLowerCase() ? ' is-on' : '')}
                style={{ background: c }} onClick={() => set({ color: c })} aria-label={`Colour ${c}`} />
            ))}
            <label className={'sw sw--pick' + (!palette.some((c) => c.toLowerCase() === f.color.toLowerCase()) ? ' is-on' : '')}
              style={!palette.some((c) => c.toLowerCase() === f.color.toLowerCase()) ? { background: f.color } : undefined} title="Any colour">
              <input type="color" value={/^#[0-9a-fA-F]{6}$/.test(f.color) ? f.color : '#8a7ba2'} onChange={(e) => set({ color: e.target.value })} />
            </label>
          </div>
        </div>

        <div className="sheet__sec">
          <span className="flabel">Icon</span>
          <div className="iconpick">
            <button type="button" className={'iconpick__b' + (!f.iconName ? ' is-on' : '')} onClick={() => set({ iconName: null })} title="Monogram">
              <span className="iconpick__mono">{(f.name.trim()[0] || 'A').toUpperCase()}</span>
            </button>
            {HABIT_ICON_NAMES.map((name) => (
              <button key={name} type="button" className={'iconpick__b' + (f.iconName === name ? ' is-on' : '')} onClick={() => set({ iconName: name })} title={name}>
                {createElement(iconComponent(name), { size: 20, strokeWidth: 2.1, 'aria-hidden': 'true' })}
              </button>
            ))}
          </div>
        </div>

        <div className="sheet__sec">
          <span className="flabel">When of day</span>
          <div className="seg">
            {[['', 'Anytime'], ['morning', 'Morning'], ['afternoon', 'Afternoon'], ['evening', 'Evening']].map(([v, l]) => (
              <button key={v || 'any'} type="button" className={'seg__btn' + (f.tod === v ? ' is-on' : '')} onClick={() => set({ tod: v })}>{l}</button>
            ))}
          </div>
        </div>

        <div className="sheet__sec">
          <span className="flabel">Track as</span>
          <div className="seg">
            {[['binary', 'Yes / no'], ['quantitative', 'Count'], ['duration', 'Timer']].map(([k, l]) => (
              <button key={k} type="button" className={'seg__btn' + (f.type === k ? ' is-on' : '')}
                onClick={() => set({ type: k })}>{l}</button>
            ))}
          </div>
          {measured && (
            <div className="row2" style={{ marginTop: 10 }}>
              <div>
                <span className="flabel">Daily goal</span>
                <input className="input" type="number" min="1" value={f.targetAmount}
                  onChange={(e) => set({ targetAmount: e.target.value })} placeholder={f.type === 'duration' ? '20' : '8'} />
              </div>
              <div>
                <span className="flabel">Unit</span>
                {f.type === 'duration' ? (
                  <select className="input" value={f.targetUnit || 'min'} onChange={(e) => set({ targetUnit: e.target.value })}>
                    <option value="min">minutes</option>
                    <option value="hr">hours</option>
                  </select>
                ) : (
                  <input className="input" value={f.targetUnit} placeholder="glasses"
                    onChange={(e) => set({ targetUnit: e.target.value })} />
                )}
              </div>
            </div>
          )}
        </div>

        <div className="sheet__sec">
          <span className="flabel">Schedule</span>
          <div className="seg">
            {[['daily', 'Every day'], ['weekdays', 'Weekdays'], ['everyNDays', 'Every N'], ['timesPerWeek', '× / week']].map(([k, l]) => (
              <button key={k} type="button" className={'seg__btn' + (f.scheduleKind === k ? ' is-on' : '')} onClick={() => set({ scheduleKind: k })}>{l}</button>
            ))}
          </div>
          {f.scheduleKind === 'weekdays' && (
            <div className="seg" style={{ marginTop: 10 }}>
              {WEEKDAYS.map(([l, d], i) => (
                <button key={i} type="button" className={'seg__btn' + (f.weekdays.includes(d) ? ' is-on' : '')}
                  style={{ minWidth: 0, padding: 0 }} onClick={() => toggleWeekday(d)}>{l}</button>
              ))}
            </div>
          )}
          {f.scheduleKind === 'everyNDays' && (
            <div style={{ marginTop: 10 }}>
              <span className="flabel">Every how many days</span>
              <input className="input" type="number" min="1" value={f.everyN} onChange={(e) => set({ everyN: e.target.value })} />
            </div>
          )}
          {f.scheduleKind === 'timesPerWeek' && (
            <div style={{ marginTop: 10 }}>
              <span className="flabel">Times per week</span>
              <input className="input" type="number" min="1" max="7" value={f.timesPerWeek} onChange={(e) => set({ timesPerWeek: e.target.value })} />
            </div>
          )}
        </div>

        <div className="sheet__sec">
          <span className="flabel">After this cue (habit stacking)</span>
          <input className="input" value={f.cue} placeholder="morning coffee" onChange={(e) => set({ cue: e.target.value })} />
          <p className="minihint">“After [something you already do], I will…” is the strongest way to make a habit stick.</p>
        </div>

        {anchorOptions.length > 0 && (
          <div className="sheet__sec">
            <span className="flabel">Anchor to an existing habit</span>
            <select className="input" value={f.anchor} onChange={(e) => set({ anchor: e.target.value })}>
              <option value="">None</option>
              {anchorOptions.map((h) => <option key={h.id} value={h.name}>{h.name}</option>)}
            </select>
          </div>
        )}

        <div className="sheet__sec">
          <span className="flabel">Time &amp; place <span style={{ textTransform: 'none', letterSpacing: 0 }}>(optional)</span></span>
          <div className="row2">
            <input className="input" type="time" value={f.time} onChange={(e) => set({ time: e.target.value })} />
            <input className="input" value={f.place} placeholder="the kitchen" onChange={(e) => set({ place: e.target.value })} />
          </div>
        </div>

        <div className="sheet__sec">
          <span className="flabel">Two-minute version <span style={{ textTransform: 'none', letterSpacing: 0 }}>(optional)</span></span>
          <input className="input" value={f.minimumVersion} placeholder="one page" onChange={(e) => set({ minimumVersion: e.target.value })} />
        </div>

        {isEdit && (
          <div className="sheet__sec">
            <button type="button" className="btnp" onClick={() => { archiveHabit(habit.id); onClose() }}>
              {habit.archived ? 'Restore from archive' : 'Archive (keeps history, hides from Today)'}
            </button>
          </div>
        )}

        <div className="sheet__foot">
          {isEdit && (
            <button type="button" className="btnp btnp--danger"
              onClick={() => { if (confirm(`Delete “${habit.name}” and its history?`)) { deleteHabit(habit.id); onClose() } }}>Delete</button>
          )}
          <button type="submit" className="btnp btnp--accent" disabled={!f.name.trim()}>{isEdit ? 'Save' : 'Add habit'}</button>
        </div>
      </form>
    </div>
  )
}
