// First-run / empty-state screen, ported 1:1 from the handoff (screens.jsx Onboarding):
// brand + masthead, the lede, the three-state promise, and a starter grid. Picking
// starters and tapping the CTA seeds them via addHabit; once any habit exists, RootView
// swaps back to Today automatically. "Skip" opens the New-habit form. Replaces the old
// EmptyState.

import { useState } from 'react'
import { useHabitsContext } from '../../context/habits-store.js'
import { Glyph, TallyMark } from './widgets.jsx'
import HabitFormModal from '../HabitFormModal.jsx'

// A small starter set (prototype shape: flat name/iconName/color/tod/cue/type/goal/unit).
const STARTERS = [
  { id: 's_read', name: 'Read', iconName: 'BookOpen', color: '#7e9c6c', tod: 'evening', cue: 'dinner', type: 'binary' },
  { id: 's_water', name: 'Drink water', iconName: 'Droplet', color: '#5f97a0', tod: 'morning', cue: 'each meal', type: 'count', goal: 8, unit: 'glasses' },
  { id: 's_walk', name: 'Walk', iconName: 'Footprints', color: '#bf8052', tod: 'afternoon', cue: 'lunch', type: 'duration', goal: 20, unit: 'min' },
  { id: 's_meditate', name: 'Meditate', iconName: 'Sparkles', color: '#8a7ba2', tod: 'morning', cue: 'I wake up', type: 'binary' },
  { id: 's_stretch', name: 'Stretch', iconName: 'PersonStanding', color: '#c2a052', tod: 'morning', cue: 'morning coffee', type: 'binary' },
  { id: 's_journal', name: 'Journal', iconName: 'PenLine', color: '#c07f93', tod: 'evening', cue: 'I get in bed', type: 'binary' },
]

// starter → addHabit payload (createHabit normalizes the rest); count → our 'quantitative'.
function toPayload(s) {
  return {
    name: s.name,
    color: s.color,
    iconName: s.iconName,
    tod: s.tod,
    type: s.type === 'count' ? 'quantitative' : s.type,
    target: s.goal ? { amount: s.goal, unit: s.unit || (s.type === 'duration' ? 'min' : 'units') } : null,
    schedule: { kind: 'daily' },
    plan: { cue: s.cue, time: '', place: '' },
  }
}

export default function TallyOnboarding() {
  const { addHabit } = useHabitsContext()
  const [added, setAdded] = useState([])
  const [formOpen, setFormOpen] = useState(false)

  const toggle = (id) => setAdded((a) => (a.includes(id) ? a.filter((x) => x !== id) : [...a, id]))
  const start = () => STARTERS.filter((s) => added.includes(s.id)).forEach((s) => addHabit(toPayload(s)))

  return (
    <div className="screen onb">
      <div className="onb__brandrow rise">
        <h1 className="onb__word">tally</h1>
        <TallyMark count={5} h={26} w={3} style={{ color: 'var(--accent)' }} />
      </div>
      <div className="masthead rise" aria-hidden="true" style={{ marginTop: 18 }}>
        <span className="masthead__rule" />
        <span className="masthead__edition">Daily edition · vol. 1</span>
        <span className="masthead__rule" />
      </div>

      <p className="onb__lede rise" style={{ animationDelay: '40ms' }}>
        Build habits that survive a <em>bad day</em>.
      </p>
      <p className="onb__sub rise" style={{ animationDelay: '70ms' }}>
        Most trackers reset to zero the moment you slip. Tally doesn&apos;t. One missed day is an
        accident, never a failure.
      </p>

      <div className="promise rise" style={{ animationDelay: '100ms' }}>
        <div className="promise__row">
          <span className="promise__glyph">✓</span>
          <div><div className="promise__t">Done</div><div className="promise__d">Builds your habit strength. A 0–100 signal, not a fragile count.</div></div>
        </div>
        <div className="promise__row">
          <span className="promise__glyph">↷</span>
          <div><div className="promise__t">Skip</div><div className="promise__d">Rest, travel, illness. Neutral. It never breaks your streak.</div></div>
        </div>
        <div className="promise__row">
          <span className="promise__glyph miss">–</span>
          <div><div className="promise__t">Miss</div><div className="promise__d">A gentle nudge, never guilt. The only rule: never miss twice.</div></div>
        </div>
      </div>

      <p className="starter__label rise">Pick a few to start</p>
      <div className="starter__grid rise">
        {STARTERS.map((s) => {
          const on = added.includes(s.id)
          return (
            <button key={s.id} className={'starter' + (on ? ' is-added' : '')} type="button"
              style={{ '--sc': s.color }} onClick={() => toggle(s.id)}>
              <span className="starter__ic" aria-hidden="true"><Glyph habit={s} size={18} /></span>
              <span className="starter__n">{s.name}</span>
              <span className="starter__plus">{on ? '✓' : '+'}</span>
            </button>
          )
        })}
      </div>

      <button className="onb__cta rise" type="button" disabled={added.length === 0} onClick={start}>
        {added.length === 0 ? 'Choose at least one' : `Start tracking ${added.length} habit${added.length > 1 ? 's' : ''}`} →
      </button>
      <button className="onb__skip" type="button" onClick={() => setFormOpen(true)}>Skip. I&apos;ll add my own</button>
      <div style={{ height: 20 }} />

      {formOpen && <HabitFormModal habit={null} existingHabits={[]} onClose={() => setFormOpen(false)} />}
    </div>
  )
}
