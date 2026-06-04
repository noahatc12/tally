import { useState } from 'react'
import { useHabitsContext } from '../context/habits-store.js'
import { PRESETS, PRESET_SEED, deriveTokens } from '../lib/theme.js'

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
  const { meta, setTheme, addCustomTheme, updateCustomTheme, deleteCustomTheme } = useHabitsContext()
  const [editing, setEditing] = useState(null) // { mode:'new'|'edit', theme }
  const active = meta?.theme || 'dark'
  const customThemes = meta?.customThemes || []

  const startNew = () => {
    const seed = PRESET_SEED[active] || PRESET_SEED.dark
    setEditing({ mode: 'new', theme: { name: 'My theme', ...seed } })
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
    <div className="modal" role="dialog" aria-modal="true" aria-label="Themes">
      <div className="modal__backdrop" onClick={onClose} />
      <div className="modal__panel">
        <div className="modal__head">
          <h2>{editing ? (editing.mode === 'new' ? 'New theme' : 'Edit theme') : 'Themes'}</h2>
          <button type="button" className="btn btn--ghost" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        {editing ? (
          <ThemeEditor initial={editing.theme} onSave={onSave} onCancel={() => setEditing(null)} />
        ) : (
          <>
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
          </>
        )}
      </div>
    </div>
  )
}
