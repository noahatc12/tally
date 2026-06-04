import { useState } from 'react'
import { useHabitsContext } from '../context/habits-store.js'
import { PRESETS, CURATED_THEMES, FONT_OPTIONS, deriveTokens, resolveColors } from '../lib/theme.js'

const COLOR_FIELDS = [
  { key: 'bg', label: 'Background' },
  { key: 'surface', label: 'Surface' },
  { key: 'text', label: 'Text' },
  { key: 'accent', label: 'Accent' },
]

// Live preview of a theme-in-progress: derive the full token set and apply it as
// inline vars on a wrapper so the mini card renders exactly like the real app.
function ThemePreview({ colors }) {
  const tokens = deriveTokens(colors)
  return (
    <div className="theme-preview" style={tokens}>
      <div className="theme-preview__row">
        <span className="theme-preview__icon">💪</span>
        <span className="theme-preview__name">Strength training</span>
        <span className="theme-preview__streak">🔥 5</span>
      </div>
      <div className="theme-preview__bar">
        <div className="theme-preview__fill" />
      </div>
      <button type="button" className="theme-preview__btn">
        Done
      </button>
    </div>
  )
}

function ThemeEditor({ initial, onSave, onCancel }) {
  const [form, setForm] = useState(initial)
  const set = (patch) => setForm((p) => ({ ...p, ...patch }))

  return (
    <div className="theme-editor">
      <label className="field">
        <span className="field__label">Name</span>
        <input
          className="field__input"
          value={form.name}
          onChange={(e) => set({ name: e.target.value })}
          placeholder="My theme"
        />
      </label>

      {COLOR_FIELDS.map((c) => (
        <div className="color-row" key={c.key}>
          <span className="color-row__label">{c.label}</span>
          <span className="color-row__hex">{form[c.key]}</span>
          <input
            type="color"
            className="color-row__input"
            value={form[c.key]}
            onChange={(e) => set({ [c.key]: e.target.value })}
            aria-label={c.label}
          />
        </div>
      ))}

      <ThemePreview colors={form} />

      <div className="modal__foot">
        <button type="button" className="btn btn--accent btn--block" onClick={() => onSave(form)}>
          Save theme
        </button>
        <button type="button" className="btn btn--ghost" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  )
}

export default function ThemeModal({ onClose }) {
  const { meta, setTheme, setFont, addCustomTheme, updateCustomTheme, deleteCustomTheme } =
    useHabitsContext()
  const [editing, setEditing] = useState(null) // { mode:'new'|'edit', theme }
  const active = meta?.theme || 'dark'
  const activeFont = meta?.font || 'default'
  const customThemes = meta?.customThemes || []

  const startNew = () => {
    const seed = resolveColors(active, customThemes)
    setEditing({ mode: 'new', theme: { name: 'My theme', bg: seed.bg, surface: seed.surface, text: seed.text, accent: seed.accent } })
  }

  const onSave = (form) => {
    if (editing.mode === 'new') addCustomTheme(form)
    else {
      updateCustomTheme(editing.theme.id, form)
      setTheme(editing.theme.id)
    }
    setEditing(null)
  }

  return (
    <div className="modal" role="dialog" aria-modal="true" aria-label="Appearance">
      <div className="modal__backdrop" onClick={onClose} />
      <div className="modal__panel">
        <div className="modal__head">
          <h2>{editing ? (editing.mode === 'new' ? 'New theme' : 'Edit theme') : 'Appearance'}</h2>
          <button type="button" className="btn btn--ghost" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        {editing ? (
          <ThemeEditor initial={editing.theme} onSave={onSave} onCancel={() => setEditing(null)} />
        ) : (
          <>
            <h3 className="appearance__label">Theme</h3>
            <div className="theme-grid">
              {PRESETS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className={`theme-chip${active === p.id ? ' is-active' : ''}`}
                  onClick={() => setTheme(p.id)}
                >
                  {p.name}
                </button>
              ))}
              {CURATED_THEMES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  className={`theme-chip${active === t.id ? ' is-active' : ''}`}
                  onClick={() => setTheme(t.id)}
                  style={{ background: t.surface, color: t.text, borderColor: t.bg }}
                >
                  <span className="theme-chip__dot" style={{ background: t.accent }} />
                  {t.name}
                </button>
              ))}
              {customThemes.map((t) => (
                <div key={t.id} className={`theme-chip theme-chip--custom${active === t.id ? ' is-active' : ''}`}>
                  <button type="button" className="theme-chip__select" onClick={() => setTheme(t.id)}>
                    <span className="theme-chip__dot" style={{ background: t.accent }} />
                    {t.name}
                  </button>
                  <button
                    type="button"
                    className="theme-chip__mini"
                    aria-label={`Edit ${t.name}`}
                    onClick={() => setEditing({ mode: 'edit', theme: { ...t } })}
                  >
                    ✎
                  </button>
                  <button
                    type="button"
                    className="theme-chip__mini"
                    aria-label={`Delete ${t.name}`}
                    onClick={() => deleteCustomTheme(t.id)}
                  >
                    🗑
                  </button>
                </div>
              ))}
            </div>
            <button type="button" className="btn btn--accent btn--block" onClick={startNew}>
              + Create theme
            </button>

            <h3 className="appearance__label">Font</h3>
            <div className="font-grid">
              {FONT_OPTIONS.map((fnt) => (
                <button
                  key={fnt.id}
                  type="button"
                  className={`font-chip${activeFont === fnt.id ? ' is-active' : ''}`}
                  style={{ fontFamily: fnt.display }}
                  onClick={() => setFont(fnt.id)}
                  aria-label={`Font: ${fnt.name}`}
                >
                  Momentum
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
