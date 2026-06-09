// First-run setup wizard, ported from the Claude Design reference (wizard.jsx). An animated
// 5-6 step flow (Welcome -> Look -> Theme(Light/Dark/Auto) -> Forgiving demo -> Preferences ->
// Starters) that previews appearance live by writing the same meta the Appearance sheet uses
// (direction/palette/accent), then hands name/reminders/data choices to onFinish. Gated in
// RootView on first run (no habits AND !meta.onboarded). Styled by tally.css `.wiz*`.

import { useState, useEffect, createElement } from 'react'
import { useHabitsContext } from '../context/habits-store.js'
import { DIRECTIONS, PALETTES, ACCENT_SWATCHES } from '../lib/directions.js'
import { iconComponent } from '../lib/icons.js'
import { STARTERS } from '../dev/seed.js'
import { TallyMark } from './tally/widgets.jsx'

const palIsDark = (dir, id) => (id === 'auto' ? DIRECTIONS[dir].dark : PALETTES[id] ? PALETTES[id].dark : false)
const palSwatch = (dir, id) => {
  if (id === 'auto') { const k = DIRECTIONS[dir].tokens; return { bg: k['--bg'], surf: k['--surface'], acc: k['--accent'], text: k['--text'] } }
  const p = PALETTES[id].tokens
  return { bg: p['--bg'], surf: p['--surface'], acc: p['--accent'], text: p['--text'] }
}

function LookCard({ id, active, onPick }) {
  const d = DIRECTIONS[id]
  const k = d.tokens
  return (
    <button type="button" className={'wiz-look' + (active ? ' is-on' : '')} onClick={() => onPick(id)}>
      <div className="wiz-look__demo" style={{ background: k['--bg'], borderColor: k['--border'] }}>
        <div className="wiz-look__card" style={{ background: k['--surface'], border: '1px solid ' + k['--border'], color: k['--text'], fontFamily: k['--font-display'] }}>
          <span>Aa</span>
          <span className="wiz-look__bar" style={{ background: k['--surface-2'] || k['--border'] }}><i style={{ background: k['--accent'] }} /></span>
        </div>
      </div>
      <span className="wiz-look__name">{d.name}</span>
      <span className="wiz-look__tag">{d.dark ? 'dark · ' : 'light · '}{id === 'B' ? 'soft' : 'serif'}</span>
    </button>
  )
}

// The teaching demo: a strength bar that climbs on done, holds on skip, and only dips on a
// miss (never to zero).
const DEMO_STEPS = [
  { g: '✓', label: 'Done. Strength climbs.', val: 94, cls: 'done' },
  { g: '✓', label: 'Another day. It compounds.', val: 96, cls: 'done' },
  { g: '–', label: 'A miss only dips it, never to zero.', val: 88, cls: 'miss' },
  { g: '↷', label: 'A skip is free. Your streak holds.', val: 88, cls: 'skip' },
  { g: '✓', label: 'Back on track. Never miss twice.', val: 91, cls: 'done' },
]
function ForgivingDemo() {
  const [i, setI] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setI((x) => (x + 1) % DEMO_STEPS.length), 1600)
    return () => clearInterval(id)
  }, [])
  const step = DEMO_STEPS[i]
  return (
    <div className="wiz-demo">
      <div className="wiz-demo__row">
        <span className={'wiz-demo__glyph ' + step.cls}>{step.g}</span>
        <div className="wiz-demo__meter"><span className="wiz-demo__fill" style={{ width: step.val + '%' }} /></div>
        <span className="wiz-demo__val">{step.val}</span>
      </div>
      <p className="wiz-demo__label">{step.label}</p>
    </div>
  )
}

function StarterIcon({ name, fallback }) {
  const Icon = iconComponent(name)
  return Icon ? createElement(Icon, { size: 18 }) : fallback
}

export default function SetupWizard({ onFinish }) {
  const { meta, setLook, setTheme, setAccent } = useHabitsContext()
  const dir = meta?.direction || 'A'
  // The wizard previews against the curated library only; a saved/base selection reads as Native.
  const palette = PALETTES[meta?.theme] && meta?.theme !== 'auto' && meta?.theme !== 'custom' ? meta.theme : 'auto'
  const accent = meta?.accent || 'auto'

  const [step, setStep] = useState(0)
  const [mode, setMode] = useState(DIRECTIONS[dir].dark ? 'dark' : 'light')
  const [name, setName] = useState('')
  const [reminders, setReminders] = useState(false)
  const [reminderTime, setReminderTime] = useState('08:00')
  const [exampleData, setExampleData] = useState(false)
  const [starters, setStarters] = useState([])

  const themeList = ['auto', ...Object.keys(PALETTES)
    .filter((k) => k !== 'auto' && k !== 'custom')
    .filter((id) => palIsDark(dir, id) === (mode === 'dark'))]

  const switchMode = (m) => {
    setMode(m)
    if (palIsDark(dir, palette) !== (m === 'dark')) {
      setTheme(DIRECTIONS[dir].dark === (m === 'dark') ? 'auto' : m === 'dark' ? 'charcoal' : 'sand')
    }
  }
  const toggleStarter = (id) => setStarters((a) => (a.includes(id) ? a.filter((x) => x !== id) : [...a, id]))

  const steps = ['welcome', 'look', 'theme', 'demo', 'about']
  if (!exampleData) steps.push('starters')
  const last = steps.length - 1
  const cur = steps[Math.min(step, last)]
  const finish = () => onFinish({ name: name.trim(), reminders, reminderTime, exampleData, starters })
  const next = () => (step >= last ? finish() : setStep((s) => s + 1))

  const accentIsCustom = accent !== 'auto' && !ACCENT_SWATCHES.some((a) => a.id === accent)

  return (
    <div className="screen wiz">
      <div className="wiz__progress">
        {steps.map((s, idx) => (
          <span key={s} className={'wiz__dot' + (idx === Math.min(step, last) ? ' is-on' : idx < step ? ' is-done' : '')} />
        ))}
      </div>

      <div className="wiz__body">
        {cur === 'welcome' && (
          <div className="wiz__center rise">
            <TallyMark count={5} h={48} w={5} style={{ color: 'var(--accent)' }} />
            <h1 className="wiz__brand">tally</h1>
            <p className="wiz__lede">Build habits that survive a <em>bad day</em>.</p>
            <p className="wiz__sub">Let’s set it up the way you like. Two minutes, tops.</p>
          </div>
        )}

        {cur === 'look' && (
          <div className="rise">
            <h2 className="wiz__title">Pick a look</h2>
            <p className="wiz__sub">You can change this any time in Appearance.</p>
            <div className="wiz-looks">
              {['A', 'C', 'B'].map((id) => (
                <LookCard key={id} id={id} active={dir === id} onPick={(v) => { setLook(v); setMode(DIRECTIONS[v].dark ? 'dark' : 'light') }} />
              ))}
            </div>
          </div>
        )}

        {cur === 'theme' && (
          <div className="rise">
            <h2 className="wiz__title">Choose a theme</h2>
            <div className="seg" style={{ margin: '4px 0 14px' }}>
              {[['light', 'Light'], ['dark', 'Dark'], ['auto', 'Auto']].map(([m, l]) => (
                <button key={m} type="button" className={'seg__btn' + (mode === m ? ' is-on' : '')}
                  onClick={() => {
                    if (m === 'auto') {
                      const d = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
                      switchMode(d ? 'dark' : 'light')
                      setMode('auto')
                    } else switchMode(m)
                  }}>{l}</button>
              ))}
            </div>
            <div className="wiz-swatches">
              {themeList.map((id) => {
                const s = palSwatch(dir, id)
                const on = palette === id
                return (
                  <button key={id} type="button" className={'wiz-sw' + (on ? ' is-on' : '')} title={id} onClick={() => setTheme(id)}
                    style={{ background: s.surf, borderColor: on ? 'var(--text)' : s.bg }}>
                    <span style={{ background: s.bg }}><i style={{ background: s.acc }} /></span>
                  </button>
                )
              })}
            </div>
            <span className="flabel" style={{ marginTop: 16 }}>Accent</span>
            <div className="swrow">
              {ACCENT_SWATCHES.map((a) =>
                a.id === 'auto'
                  ? <button key="auto" type="button" className={'sw sw--auto' + (accent === 'auto' ? ' is-on' : '')} onClick={() => setAccent('auto')}>A</button>
                  : <button key={a.id} type="button" className={'sw' + (accent === a.id ? ' is-on' : '')} style={{ background: a.id }} onClick={() => setAccent(a.id)} title={a.label} />,
              )}
              <label className={'sw sw--pick' + (accentIsCustom ? ' is-on' : '')} style={accentIsCustom ? { background: accent } : undefined} title="Custom accent">
                <input type="color" value={/^#[0-9a-fA-F]{6}$/.test(accent) ? accent : '#9e3b2d'} onChange={(e) => setAccent(e.target.value)} />
              </label>
            </div>
          </div>
        )}

        {cur === 'demo' && (
          <div className="rise">
            <h2 className="wiz__title">Forgiving by design</h2>
            <p className="wiz__sub">Most trackers reset to zero on one slip. Tally doesn’t: your <b>habit strength</b> dips a little and recovers.</p>
            <ForgivingDemo />
            <p className="wiz__sub" style={{ marginTop: 14 }}>Three marks a day: <b>done</b>, <b>skip</b> (a free rest), <b>miss</b>. The only rule is never miss twice.</p>
          </div>
        )}

        {cur === 'about' && (
          <div className="rise">
            <h2 className="wiz__title">A few preferences</h2>
            <div className="sheet__sec">
              <span className="flabel">What should we call you?</span>
              <input className="input" value={name} placeholder="Optional" onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="sheet__sec">
              <div className="wiz-toggle">
                <div><div className="wiz-toggle__t">Daily reminder</div><div className="wiz-toggle__d">A gentle nudge to check in.</div></div>
                <button type="button" className={'wiz-switch' + (reminders ? ' is-on' : '')} onClick={() => setReminders((r) => !r)}><span /></button>
              </div>
              {reminders && <input className="input" type="time" value={reminderTime} onChange={(e) => setReminderTime(e.target.value)} style={{ marginTop: 10 }} />}
            </div>
            <div className="sheet__sec">
              <span className="flabel">Start with…</span>
              <div className="seg">
                <button type="button" className={'seg__btn' + (exampleData ? ' is-on' : '')} onClick={() => setExampleData(true)}>Example data</button>
                <button type="button" className={'seg__btn' + (!exampleData ? ' is-on' : '')} onClick={() => setExampleData(false)}>Start fresh</button>
              </div>
              <p className="minihint">{exampleData ? 'A year of sample habits so the charts look alive. You can reset later.' : 'A clean slate. Pick a few habits next.'}</p>
            </div>
          </div>
        )}

        {cur === 'starters' && (
          <div className="rise">
            <h2 className="wiz__title">Pick a few to start</h2>
            <div className="starter__grid">
              {STARTERS.map((s) => {
                const on = starters.includes(s.id)
                return (
                  <button key={s.id} type="button" className={'starter' + (on ? ' is-added' : '')} style={{ '--sc': s.color }} onClick={() => toggleStarter(s.id)}>
                    <span className="starter__ic" style={{ color: s.color }}><StarterIcon name={s.iconName} fallback={s.name[0]} /></span>
                    <span className="starter__n">{s.name}</span>
                    <span className="starter__plus">{on ? '✓' : '+'}</span>
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>

      <div className="wiz__nav">
        {step > 0
          ? <button type="button" className="wiz__back" onClick={() => setStep((s) => s - 1)}>‹ Back</button>
          : <button type="button" className="wiz__back" onClick={finish}>Skip</button>}
        <button type="button" className="wiz__next" onClick={next}>
          {step < last ? 'Continue' : cur === 'starters' && starters.length === 0 ? 'I’ll add my own →' : 'Start tracking →'}
        </button>
      </div>
    </div>
  )
}
