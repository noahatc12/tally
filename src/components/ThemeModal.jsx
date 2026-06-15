// Appearance sheet, ported to the handoff's bottom-sheet idiom (modals.jsx ThemeSheet) —
// .sheet chrome, .seg segmented controls, .themegrid palette cards, .swrow accent swatches.
// Wired to this app's real store: Look → setLook, the theme grid → setTheme (Native / a curated
// palette / a saved custom theme), Accent → setAccent, Habit ink → setInk, Completed → setCompleted,
// Type → setTypeface. Saved custom themes are KEPT (create / edit / delete) and resolve through the
// token engine's custom path; the prototype's net-new behaviours (tonal ink, completed-habit modes,
// custom accent) are added on top.

import { useState } from 'react'
import { useHabitsContext } from '../context/habits-store.js'
import { useScrollLock } from '../hooks/useScrollLock.js'
import { useSheetDrag } from '../hooks/useSheetDrag.js'
import { DIRECTIONS, PALETTES, ACCENT_SWATCHES } from '../lib/directions.js'
import { luminance } from '../lib/theme.js'
import { buildDemoData } from '../dev/seed.js'

// Looks in the prototype's order: the two editions of the hand-set look, then the soft alternate.
const LOOKS = [
  { id: 'A', name: 'Ledger' },
  { id: 'C', name: 'Nocturne' },
  { id: 'B', name: 'Bloom' },
]

const EDITOR_FIELDS = [
  { key: 'bg', label: 'Background' },
  { key: 'surface', label: 'Surface / cards' },
  { key: 'text', label: 'Text' },
  { key: 'accent', label: 'Accent' },
]

function ColorRow({ label, value, onChange }) {
  return (
    <label className="crow">
      <span className="crow__l">{label}</span>
      <span className="crow__hex">{value}</span>
      <input type="color" value={value} onChange={(e) => onChange(e.target.value)} aria-label={label} />
    </label>
  )
}

// Create / edit a saved custom theme: name + the four colours the rest of the palette derives
// from (surface tints, borders, muted text, heat ramp — handled by the token engine).
function ThemeEditor({ initial, onSave, onCancel }) {
  const [form, setForm] = useState(initial)
  const set = (patch) => setForm((p) => ({ ...p, ...patch }))

  return (
    <>
      <div className="sheet__sec">
        <span className="flabel">Name</span>
        <input className="input" value={form.name} placeholder="My theme" onChange={(e) => set({ name: e.target.value })} autoFocus />
      </div>

      <div className="sheet__sec">
        <span className="flabel">Custom colours</span>
        <div className="cedit">
          {EDITOR_FIELDS.map((c) => (
            <ColorRow key={c.key} label={c.label} value={form[c.key]} onChange={(v) => set({ [c.key]: v })} />
          ))}
        </div>
        <p className="minihint">Surface tints, borders, muted text and the heatmap ramp derive automatically from these four.</p>
      </div>

      <div className="sheet__foot">
        <button type="button" className="btnp" onClick={onCancel}>Cancel</button>
        <button type="button" className="btnp btnp--accent" disabled={!form.name.trim()} onClick={() => onSave(form)}>Save theme</button>
      </div>
    </>
  )
}

export default function ThemeModal({ onClose }) {
  useScrollLock()
  const { dragHandlers, panelStyle, scrimStyle, panelRef, close } = useSheetDrag(onClose)
  const {
    meta, setLook, setTheme, setAccent, setInk, setCompleted, setTypeface,
    addCustomTheme, updateCustomTheme, deleteCustomTheme, loadDemo,
  } = useHabitsContext()
  const [editing, setEditing] = useState(null) // null | { mode:'new'|'edit', theme }

  const customThemes = meta?.customThemes || []
  const dirTokens = (DIRECTIONS[meta?.direction || 'A'] || DIRECTIONS.A).tokens

  // What the theme grid considers selected: a known palette or a saved theme, else Native.
  const rawSel = meta?.theme || 'auto'
  const currentSel = (PALETTES[rawSel] && rawSel !== 'auto') || customThemes.some((t) => t.id === rawSel) ? rawSel : 'auto'
  const activeSaved = customThemes.find((t) => t.id === currentSel)

  // The cards: Native (the Look's own palette) + the curated library + the user's saved themes.
  const paletteCards = [
    { id: 'auto', label: 'Native' },
    ...Object.keys(PALETTES).filter((k) => k !== 'auto' && k !== 'custom').map((k) => ({ id: k, label: PALETTES[k].label })),
    ...customThemes.map((t) => ({ id: t.id, label: t.name })),
  ]

  // Polarity of a palette id: Native follows the Look, a saved theme reads from its bg, a
  // curated palette carries its own `dark` flag. Drives the Light/Dark filter (§3).
  const palDark = (id) => {
    if (id === 'auto') return (DIRECTIONS[meta?.direction || 'A'] || DIRECTIONS.A).dark
    const saved = customThemes.find((t) => t.id === id)
    if (saved) return luminance(saved.bg) < 0.5
    return PALETTES[id]?.dark ?? false
  }
  const [mode, setMode] = useState(() => (palDark(currentSel) ? 'dark' : 'light'))
  // Native always shows in both lists; everything else filters to the chosen polarity.
  const visibleCards = paletteCards.filter((p) => p.id === 'auto' || palDark(p.id) === (mode === 'dark'))
  // Switching polarity moves the selection to a sensible theme of that polarity if the
  // current one no longer matches (Native when the Look already fits, else a default).
  const switchMode = (m) => {
    setMode(m)
    if (palDark(currentSel) !== (m === 'dark')) {
      const dirDark = (DIRECTIONS[meta?.direction || 'A'] || DIRECTIONS.A).dark
      setTheme(dirDark === (m === 'dark') ? 'auto' : m === 'dark' ? 'charcoal' : 'sand')
    }
  }

  const swatchFor = (id) => {
    if (id === 'auto') return { bg: dirTokens['--bg'], surf: dirTokens['--surface'], acc: dirTokens['--accent'], text: dirTokens['--text'] }
    const saved = customThemes.find((t) => t.id === id)
    if (saved) return { bg: saved.bg, surf: saved.surface, acc: saved.accent, text: saved.text }
    const p = PALETTES[id].tokens
    return { bg: p['--bg'], surf: p['--surface'], acc: p['--accent'], text: p['--text'] }
  }

  const startNew = () => {
    const s = swatchFor(currentSel)
    setEditing({ mode: 'new', theme: { name: 'My theme', bg: s.bg, surface: s.surf, text: s.text, accent: s.acc } })
  }
  const startEdit = (t) => setEditing({ mode: 'edit', theme: { id: t.id, name: t.name, bg: t.bg, surface: t.surface, text: t.text, accent: t.accent } })

  const onSave = (form) => {
    if (editing.mode === 'new') addCustomTheme(form)
    else { updateCustomTheme(editing.theme.id, form); setTheme(editing.theme.id) }
    setEditing(null)
  }

  const accentIsCustom = meta?.accent && meta.accent !== 'auto' && !ACCENT_SWATCHES.some((a) => a.id === meta.accent)

  return (
    <div className="sheet" role="dialog" aria-modal="true" aria-label="Appearance" onClick={close}>
      <div className="sheet__scrim" style={scrimStyle} />
      <div className="sheet__panel" ref={panelRef} style={panelStyle} onClick={(e) => e.stopPropagation()}>
        <div className="sheet__draghandle" {...dragHandlers}><span className="sheet__grab" /></div>
        <div className="sheet__head">
          <span className="sheet__title">{editing ? (editing.mode === 'new' ? 'New theme' : 'Edit theme') : 'Appearance'}</span>
          <button type="button" className="sheet__x" onClick={close} aria-label="Close">✕</button>
        </div>

        {editing ? (
          <ThemeEditor initial={editing.theme} onSave={onSave} onCancel={() => setEditing(null)} />
        ) : (
          <>
            <div className="sheet__sec">
              <span className="flabel">Look</span>
              <div className="seg">
                {LOOKS.map((l) => (
                  <button key={l.id} type="button" className={'seg__btn' + (meta?.direction === l.id ? ' is-on' : '')}
                    onClick={() => setLook(l.id)}>{l.name}</button>
                ))}
              </div>
              <p className="minihint">Ledger &amp; Nocturne are the day and night editions of the same hand-set look; Bloom is the soft alternate.</p>
            </div>

            <div className="sheet__sec">
              <span className="flabel">Theme</span>
              <div className="seg" style={{ marginBottom: 10 }}>
                {[['light', 'Light'], ['dark', 'Dark']].map(([m, l]) => (
                  <button key={m} type="button" className={'seg__btn' + (mode === m ? ' is-on' : '')}
                    onClick={() => switchMode(m)}>{l}</button>
                ))}
              </div>
              <div className="themegrid">
                {visibleCards.map((p) => {
                  const s = swatchFor(p.id)
                  const on = currentSel === p.id
                  return (
                    <button key={p.id} type="button" className={'themecard' + (on ? ' is-on' : '')}
                      onClick={() => setTheme(p.id)} style={{ background: s.surf, borderColor: on ? undefined : s.bg }}>
                      <span className="themecard__sw" style={{ background: s.bg }}>
                        <span className="themecard__dot" style={{ background: s.acc }} />
                        <span className="themecard__line" style={{ background: `color-mix(in srgb, ${s.text} 30%, transparent)` }} />
                      </span>
                      <span className="themecard__name" style={{ color: s.text }}>{p.label}</span>
                    </button>
                  )
                })}
              </div>
              <div className="sheet__foot" style={{ marginTop: 10 }}>
                <button type="button" className="btnp" onClick={startNew}>+ New theme</button>
                {activeSaved && <button type="button" className="btnp" onClick={() => startEdit(activeSaved)}>Edit</button>}
                {activeSaved && <button type="button" className="btnp btnp--danger" onClick={() => deleteCustomTheme(activeSaved.id)}>Delete</button>}
              </div>
            </div>

            <div className="sheet__sec">
              <span className="flabel">Accent</span>
              <div className="swrow">
                {ACCENT_SWATCHES.map((a) => {
                  const on = (meta?.accent || 'auto') === a.id
                  if (a.id === 'auto') {
                    return <button key="auto" type="button" className={'sw sw--auto' + (on ? ' is-on' : '')} onClick={() => setAccent('auto')} title="Auto">A</button>
                  }
                  return <button key={a.id} type="button" className={'sw' + (on ? ' is-on' : '')} style={{ background: a.id }} onClick={() => setAccent(a.id)} title={a.label} />
                })}
                <label className={'sw sw--pick' + (accentIsCustom ? ' is-on' : '')} style={accentIsCustom ? { background: meta.accent } : undefined} title="Any accent">
                  <input type="color" value={/^#[0-9a-fA-F]{6}$/.test(meta?.accent) ? meta.accent : '#9e3b2d'} onChange={(e) => setAccent(e.target.value)} />
                </label>
              </div>
            </div>

            <div className="sheet__sec">
              <span className="flabel">Habit ink</span>
              <div className="seg">
                {[['color', 'Colourful'], ['tonal', 'Tonal']].map(([k, l]) => (
                  <button key={k} type="button" className={'seg__btn' + ((meta?.ink || 'color') === k ? ' is-on' : '')}
                    onClick={() => setInk(k)}>{l}</button>
                ))}
              </div>
              <p className="minihint">Tonal renders each habit as a distinct shade of the theme accent. Calmest with the monochrome themes.</p>
            </div>

            <div className="sheet__sec">
              <span className="flabel">Completed habits</span>
              <div className="seg">
                {[['soften', 'Soften'], ['collapse', 'Collapse'], ['drawer', 'Drawer'], ['none', 'Keep']].map(([k, l]) => (
                  <button key={k} type="button" className={'seg__btn' + ((meta?.completed || 'soften') === k ? ' is-on' : '')}
                    onClick={() => setCompleted(k)}>{l}</button>
                ))}
              </div>
              <p className="minihint">How a habit looks once you finish it today. Soften fades it and sinks it down; Collapse shrinks it to a line; Drawer tucks them away.</p>
            </div>

            <div className="sheet__sec">
              <span className="flabel">Type</span>
              <div className="seg">
                {[['auto', 'Default'], ['serif', 'Serif'], ['grotesk', 'Grotesk'], ['bricolage', 'Rounded']].map(([k, l]) => (
                  <button key={k} type="button" className={'seg__btn' + ((meta?.typeface || 'auto') === k ? ' is-on' : '')}
                    onClick={() => setTypeface(k)}>{l}</button>
                ))}
              </div>
            </div>

            <div className="sheet__sec">
              <button type="button" className="btnp" onClick={() => loadDemo(buildDemoData())}>Reset demo data</button>
              <p className="minihint">Your habits &amp; check-ins are saved on this device. This replaces them with a fresh randomized example set.</p>
            </div>

            <div style={{ height: 4 }} />
          </>
        )}
      </div>
    </div>
  )
}
