// modals.jsx — in-app Appearance sheet + Habit create/edit form. Exported to window.
const { useState: useMS } = React;

// Ink presets are derived from the live theme tokens, so they always match the
// active palette. Stored as CSS strings (var()/color-mix) that resolve per theme.
const INK_COLORS = [
  'var(--accent)',
  'color-mix(in srgb, var(--accent) 78%, var(--text))',
  'color-mix(in srgb, var(--accent) 60%, var(--surface))',
  'color-mix(in srgb, var(--accent) 42%, var(--surface))',
  'color-mix(in srgb, var(--accent) 58%, var(--text-muted))',
  'color-mix(in srgb, var(--text) 64%, var(--surface))',
  'color-mix(in srgb, var(--text-muted) 82%, var(--surface))',
];

function ColorRow({ label, value, onChange }) {
  return (
    <label className="crow">
      <span className="crow__l">{label}</span>
      <span className="crow__hex">{value}</span>
      <input type="color" value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}

// ───────────────────────── Appearance sheet ─────────────────────────
function ThemeSheet({ t, setTweak, onReset, onClose }) {
  const looks = [{ id: 'A', name: 'Ledger' }, { id: 'C', name: 'Nocturne' }, { id: 'B', name: 'Bloom' }];
  const allPalettes = [{ id: 'auto', label: 'Native' },
    ...Object.keys(PALETTES).filter((k) => k !== 'auto' && k !== 'custom').map((k) => ({ id: k, label: PALETTES[k].label })),
    { id: 'custom', label: 'Custom' }];
  const dirTokens = DIRECTIONS[t.direction].tokens;
  const palDark = (id) => id === 'auto' ? DIRECTIONS[t.direction].dark : id === 'custom' ? !!t.customDark : (PALETTES[id] ? PALETTES[id].dark : false);
  const [mode, setMode] = useMS(palDark(t.palette || 'auto') ? 'dark' : 'light');
  const palettes = allPalettes.filter((p) => p.id === 'custom' || p.id === 'auto' || palDark(p.id) === (mode === 'dark'));
  const switchMode = (m) => {
    setMode(m);
    if (palDark(t.palette || 'auto') !== (m === 'dark')) {
      const def = DIRECTIONS[t.direction].dark === (m === 'dark') ? 'auto' : (m === 'dark' ? 'charcoal' : 'sand');
      setTweak('palette', def);
    }
  };

  const swatchFor = (id) => {
    if (id === 'auto') return { bg: dirTokens['--bg'], surf: dirTokens['--surface'], acc: dirTokens['--accent'], text: dirTokens['--text'] };
    if (id === 'custom') return { bg: t.customBg, surf: t.customSurface, acc: t.customAccent, text: t.customText };
    const p = PALETTES[id].tokens;
    return { bg: p['--bg'], surf: p['--surface'], acc: p['--accent'], text: p['--text'] };
  };

  return (
    <div className="sheet">
      <div className="sheet__scrim" onClick={onClose} />
      <div className="sheet__panel">
        <div className="sheet__grab" />
        <div className="sheet__head">
          <span className="sheet__title">Appearance</span>
          <button className="sheet__x" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <div className="sheet__sec">
          <span className="flabel">Look</span>
          <div className="seg">
            {looks.map((l) => (
              <button key={l.id} className={'seg__btn' + (t.direction === l.id ? ' is-on' : '')}
                onClick={() => setTweak('direction', l.id)}>{l.name}</button>
            ))}
          </div>
          <p className="minihint">Ledger &amp; Nocturne are the day and night editions of the same hand-set look; Bloom is the soft alternate.</p>
        </div>

        <div className="sheet__sec">
          <span className="flabel">Theme</span>
          <div className="seg" style={{ marginBottom: 10 }}>
            {[['light', 'Light'], ['dark', 'Dark']].map(([m, l]) => (
              <button key={m} className={'seg__btn' + (mode === m ? ' is-on' : '')} onClick={() => switchMode(m)}>{l}</button>
            ))}
          </div>
          <div className="themegrid">
            {palettes.map((p) => {
              const s = swatchFor(p.id);
              const on = (t.palette || 'auto') === p.id;
              return (
                <button key={p.id} className={'themecard' + (on ? ' is-on' : '')} onClick={() => { setTweak('palette', p.id); if (p.id === 'custom') setTweak('customDark', mode === 'dark'); }}
                  style={{ background: s.surf, borderColor: on ? undefined : s.bg }}>
                  <span className="themecard__sw" style={{ background: s.bg }}>
                    <span className="themecard__dot" style={{ background: s.acc }} />
                    <span className="themecard__line" style={{ background: 'color-mix(in srgb,' + s.text + ' 30%, transparent)' }} />
                  </span>
                  <span className="themecard__name" style={{ color: s.text }}>{p.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {t.palette === 'custom' && (
          <div className="sheet__sec">
            <span className="flabel">Custom colours</span>
            <div className="cedit">
              <ColorRow label="Background" value={t.customBg} onChange={(v) => setTweak('customBg', v)} />
              <ColorRow label="Surface / cards" value={t.customSurface} onChange={(v) => setTweak('customSurface', v)} />
              <ColorRow label="Text" value={t.customText} onChange={(v) => setTweak('customText', v)} />
              <ColorRow label="Accent" value={t.customAccent} onChange={(v) => setTweak('customAccent', v)} />
            </div>
            <div className="seg" style={{ marginTop: 10 }}>
              <button className={'seg__btn' + (!t.customDark ? ' is-on' : '')} onClick={() => setTweak('customDark', false)}>Light</button>
              <button className={'seg__btn' + (t.customDark ? ' is-on' : '')} onClick={() => setTweak('customDark', true)}>Dark</button>
            </div>
            <p className="minihint">Surface tints, borders, muted text and the heatmap ramp derive automatically from these four.</p>
          </div>
        )}

        <div className="sheet__sec">
          <span className="flabel">Accent</span>
          <div className="swrow">
            {ACCENT_SWATCHES.map((a) => {
              const on = (t.accent || 'auto') === a.id;
              if (a.id === 'auto') return <button key="auto" className={'sw sw--auto' + (on ? ' is-on' : '')} onClick={() => setTweak('accent', 'auto')}>A</button>;
              return <button key={a.id} className={'sw' + (on ? ' is-on' : '')} style={{ background: a.id }} onClick={() => setTweak('accent', a.id)} title={a.label} />;
            })}
            {(() => {
              const isCustom = t.accent && t.accent !== 'auto' && !ACCENT_SWATCHES.some((a) => a.id === t.accent);
              return (
                <label className={'sw sw--pick' + (isCustom ? ' is-on' : '')} style={isCustom ? { background: t.accent } : undefined} title="Any accent">
                  <input type="color" value={/^#[0-9a-fA-F]{6}$/.test(t.accent) ? t.accent : '#9e3b2d'} onChange={(e) => setTweak('accent', e.target.value)} />
                </label>
              );
            })()}
          </div>
        </div>
        <div className="sheet__sec">
          <span className="flabel">Habit ink</span>
          <div className="seg">
            {[['color', 'Colourful'], ['tonal', 'Tonal']].map(([k, l]) => (
              <button key={k} className={'seg__btn' + ((t.ink || 'color') === k ? ' is-on' : '')} onClick={() => setTweak('ink', k)}>{l}</button>
            ))}
          </div>
          <p className="minihint">Tonal renders each habit as a distinct shade of the theme accent. Calmest with the monochrome themes.</p>
        </div>

        <div className="sheet__sec">
          <span className="flabel">Completed habits</span>
          <div className="seg">
            {[['soften', 'Soften'], ['collapse', 'Collapse'], ['drawer', 'Drawer'], ['none', 'Keep']].map(([k, l]) => (
              <button key={k} className={'seg__btn' + ((t.completed || 'soften') === k ? ' is-on' : '')} onClick={() => setTweak('completed', k)}>{l}</button>
            ))}
          </div>
          <p className="minihint">How a habit looks once you finish it today. Soften fades it and sinks it down; Collapse shrinks it to a line; Drawer tucks them away.</p>
        </div>

        <div className="sheet__sec">
          <span className="flabel">Type</span>
          <div className="seg">
            {[['auto', 'Default'], ['serif', 'Serif'], ['grotesk', 'Grotesk'], ['bricolage', 'Rounded']].map(([k, l]) => (
              <button key={k} className={'seg__btn' + ((t.typeface || 'auto') === k ? ' is-on' : '')} onClick={() => setTweak('typeface', k)}>{l}</button>
            ))}
          </div>
        </div>

        {onReset && (
          <div className="sheet__sec">
            <button className="btnp" onClick={onReset}>Reset demo data</button>
            <p className="minihint">Your habits &amp; check-ins are saved on this device. This restores the original example set.</p>
          </div>
        )}
        <div style={{ height: 4 }} />
      </div>
    </div>
  );
}

// ───────────────────────── Habit form ─────────────────────────
const WD = [['S', 0], ['M', 1], ['T', 2], ['W', 3], ['T', 4], ['F', 5], ['S', 6]];
function HabitFormSheet({ habit, habits = [], onSave, onDelete, onArchive, onClose }) {
  const editing = !!habit;
  const sc = habit?.schedule || { kind: 'daily' };
  const [name, setName] = useMS(habit?.name || '');
  const [color, setColor] = useMS(habit?.color || INK_COLORS[0]);
  const [iconName, setIconName] = useMS(habit?.iconName || '');
  const [tod, setTod] = useMS(habit?.tod || 'morning');
  const [type, setType] = useMS(habit?.type || 'binary');
  const [goal, setGoal] = useMS(habit?.goal ?? '');
  const [unit, setUnit] = useMS(habit?.unit ?? '');
  const [cue, setCue] = useMS(habit?.cue || habit?.plan?.cue || '');
  const [kind, setKind] = useMS(sc.kind || 'daily');
  const [weekdays, setWeekdays] = useMS(sc.weekdays || [1, 2, 3, 4, 5]);
  const [everyN, setEveryN] = useMS(sc.everyN || 2);
  const [perWeek, setPerWeek] = useMS(sc.timesPerWeek || 3);
  const [time, setTime] = useMS(habit?.plan?.time || '');
  const [place, setPlace] = useMS(habit?.plan?.place || '');
  const [anchor, setAnchor] = useMS(habit?.anchor || '');
  const [minVer, setMinVer] = useMS(habit?.minimumVersion || '');

  const toggleWd = (d) => setWeekdays((w) => (w.includes(d) ? w.filter((x) => x !== d) : [...w, d].sort()));
  const anchorable = habits.filter((h) => h.id !== habit?.id && !h.archived);

  const save = () => {
    if (!name.trim()) return;
    const schedule = kind === 'weekdays' ? { kind, weekdays } : kind === 'everyNDays' ? { kind, everyN: Number(everyN) || 1 }
      : kind === 'timesPerWeek' ? { kind, timesPerWeek: Number(perWeek) || 1 } : { kind: 'daily' };
    const f = {
      name: name.trim(), color, tod, type, cue: cue.trim(), schedule, iconName: iconName || null,
      plan: { cue: cue.trim(), time, place: place.trim() },
      anchor: anchor || null, minimumVersion: minVer.trim(),
    };
    if (type === 'count' || type === 'duration') { f.goal = Number(goal) || (type === 'duration' ? 20 : 8); f.unit = type === 'duration' ? (unit || 'min') : (unit.trim() || 'times'); }
    onSave(f, habit?.id);
  };

  return (
    <div className="sheet">
      <div className="sheet__scrim" onClick={onClose} />
      <div className="sheet__panel">
        <div className="sheet__grab" />
        <div className="sheet__head">
          <span className="sheet__title">{editing ? 'Edit habit' : 'New habit'}</span>
          <button className="sheet__x" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <div className="sheet__sec">
          <span className="flabel">Name</span>
          <input className="input" value={name} placeholder="e.g. Read 10 pages" onChange={(e) => setName(e.target.value)} autoFocus />
        </div>

        <div className="sheet__sec">
          <span className="flabel">Ink</span>
          <div className="swrow swrow--grid">
            {INK_COLORS.map((c) => (
              <button key={c} className={'sw' + (color === c ? ' is-on' : '')} style={{ background: c }} onClick={() => setColor(c)} />
            ))}
            <label className={'sw sw--pick' + (!INK_COLORS.includes(color) ? ' is-on' : '')} style={!INK_COLORS.includes(color) ? { background: color } : undefined} title="Any colour">
              <input type="color" value={/^#[0-9a-fA-F]{6}$/.test(color) ? color : '#8a7ba2'} onChange={(e) => setColor(e.target.value)} />
            </label>
          </div>
        </div>

        <div className="sheet__sec">
          <span className="flabel">Icon</span>
          <div className="iconpick">
            <button className={'iconpick__b' + (!iconName ? ' is-on' : '')} onClick={() => setIconName('')} title="Monogram">
              <span className="iconpick__mono">{(name.trim()[0] || 'A').toUpperCase()}</span>
            </button>
            {[...new Set(ICONS)].filter((n) => window.lucide && window.lucide[n]).map((n) => (
              <button key={n} className={'iconpick__b' + (iconName === n ? ' is-on' : '')} onClick={() => setIconName(n)} title={n}>
                <LucideIcon name={n} size={20} />
              </button>
            ))}
          </div>
        </div>

        <div className="sheet__sec">
          <span className="flabel">When of day</span>
          <div className="seg">
            {[['morning', 'Morning'], ['afternoon', 'Afternoon'], ['evening', 'Evening']].map(([k, l]) => (
              <button key={k} className={'seg__btn' + (tod === k ? ' is-on' : '')} onClick={() => setTod(k)}>{l}</button>
            ))}
          </div>
        </div>

        <div className="sheet__sec">
          <span className="flabel">Track as</span>
          <div className="seg">
            {[['binary', 'Yes / no'], ['count', 'Count'], ['duration', 'Timer']].map(([k, l]) => (
              <button key={k} className={'seg__btn' + (type === k ? ' is-on' : '')} onClick={() => setType(k)}>{l}</button>
            ))}
          </div>
          {(type === 'count' || type === 'duration') && (
            <div className="row2" style={{ marginTop: 10 }}>
              <div>
                <span className="flabel">Daily goal</span>
                <input className="input" type="number" min="1" value={goal} placeholder={type === 'duration' ? '20' : '8'} onChange={(e) => setGoal(e.target.value)} />
              </div>
              <div>
                <span className="flabel">Unit</span>
                {type === 'duration' ? (
                  <select className="input" value={unit || 'min'} onChange={(e) => setUnit(e.target.value)}>
                    <option value="min">minutes</option>
                    <option value="hr">hours</option>
                  </select>
                ) : (
                  <input className="input" value={unit} placeholder="glasses" onChange={(e) => setUnit(e.target.value)} />
                )}
              </div>
            </div>
          )}
        </div>

        <div className="sheet__sec">
          <span className="flabel">Schedule</span>
          <div className="seg">
            {[['daily', 'Every day'], ['weekdays', 'Weekdays'], ['everyNDays', 'Every N'], ['timesPerWeek', '× / week']].map(([k, l]) => (
              <button key={k} className={'seg__btn' + (kind === k ? ' is-on' : '')} onClick={() => setKind(k)}>{l}</button>
            ))}
          </div>
          {kind === 'weekdays' && (
            <div className="seg" style={{ marginTop: 10 }}>
              {WD.map(([l, d], i) => (
                <button key={i} className={'seg__btn' + (weekdays.includes(d) ? ' is-on' : '')} style={{ minWidth: 0, padding: 0 }} onClick={() => toggleWd(d)}>{l}</button>
              ))}
            </div>
          )}
          {kind === 'everyNDays' && (
            <div style={{ marginTop: 10 }}>
              <span className="flabel">Every how many days</span>
              <input className="input" type="number" min="1" value={everyN} onChange={(e) => setEveryN(e.target.value)} />
            </div>
          )}
          {kind === 'timesPerWeek' && (
            <div style={{ marginTop: 10 }}>
              <span className="flabel">Times per week</span>
              <input className="input" type="number" min="1" max="7" value={perWeek} onChange={(e) => setPerWeek(e.target.value)} />
            </div>
          )}
        </div>

        <div className="sheet__sec">
          <span className="flabel">After this cue (habit stacking)</span>
          <input className="input" value={cue} placeholder="morning coffee" onChange={(e) => setCue(e.target.value)} />
          <p className="minihint">“After [something you already do], I will…” is the strongest way to make a habit stick.</p>
        </div>

        {anchorable.length > 0 && (
          <div className="sheet__sec">
            <span className="flabel">Anchor to an existing habit</span>
            <select className="input" value={anchor} onChange={(e) => setAnchor(e.target.value)}>
              <option value="">None</option>
              {anchorable.map((h) => <option key={h.id} value={h.name}>{h.name}</option>)}
            </select>
          </div>
        )}

        <div className="sheet__sec">
          <span className="flabel">Time &amp; place <span style={{ textTransform: 'none', letterSpacing: 0 }}>(optional)</span></span>
          <div className="row2">
            <input className="input" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
            <input className="input" value={place} placeholder="the kitchen" onChange={(e) => setPlace(e.target.value)} />
          </div>
        </div>

        <div className="sheet__sec">
          <span className="flabel">Two-minute version <span style={{ textTransform: 'none', letterSpacing: 0 }}>(optional)</span></span>
          <input className="input" value={minVer} placeholder="one page" onChange={(e) => setMinVer(e.target.value)} />
        </div>

        {editing && (
          <div className="sheet__sec">
            <button className="btnp" onClick={() => onArchive(habit.id)}>{habit.archived ? 'Restore from archive' : 'Archive (keeps history, hides from Today)'}</button>
          </div>
        )}

        <div className="sheet__foot">
          {editing && <button className="btnp btnp--danger" onClick={() => onDelete(habit.id)}>Delete</button>}
          <button className="btnp btnp--accent" disabled={!name.trim()} onClick={save}>{editing ? 'Save' : 'Add habit'}</button>
        </div>
      </div>
    </div>
  );
}

// ───────────────────────── Help / guide ─────────────────────────
function HelpSheet({ onClose }) {
  return (
    <div className="sheet">
      <div className="sheet__scrim" onClick={onClose} />
      <div className="sheet__panel">
        <div className="sheet__grab" />
        <div className="sheet__head">
          <span className="sheet__title">How it works</span>
          <button className="sheet__x" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <p className="guide__lead">Tap <b>+ New</b> to create a habit, then mark it each day. Missing one day won’t reset you; only missing repeatedly does. The goal is showing up, not perfection.</p>

        <div className="guide__sec">
          <h3 className="guide__h">Each day, mark a habit</h3>
          <ul className="guide__list">
            <li><b>Done</b>. You did it. Extends your streak and raises strength.</li>
            <li><b>Skip</b>. A planned rest (sick, travelling). Neutral: never breaks a streak.</li>
            <li><b>Miss</b>. The only thing that breaks a streak. One miss is fine; just never miss twice.</li>
          </ul>
          <p className="guide__note"><b>Habit strength</b> is a 0–100 score that rises as you show up. One miss dips it a little; it never crashes to zero.</p>
        </div>

        <div className="guide__sec">
          <h3 className="guide__h">Kinds of habit</h3>
          <ul className="guide__list">
            <li><b>Yes / no</b>. A simple did-I-or-not. <em>Meditate.</em></li>
            <li><b>Count</b>. Log several a day toward a target. <em>8 glasses of water.</em></li>
            <li><b>Timer</b>. Track minutes toward a goal. <em>Walk 30 min.</em></li>
          </ul>
        </div>

        <div className="guide__sec">
          <h3 className="guide__h">How often</h3>
          <ul className="guide__list">
            <li><b>Every day</b> · <b>Weekdays</b> · <b>× / week</b>, a weekly target on any days.</li>
          </ul>
        </div>

        <div className="guide__sec">
          <h3 className="guide__h">Make it stick</h3>
          <ul className="guide__list">
            <li><b>After…</b> anchor a new habit to a routine you already do (“after coffee, I stretch”).</li>
            <li><b>Two-minute version</b>: your floor on a hard day. Showing up at the minimum still counts.</li>
          </ul>
        </div>

        <p className="guide__note">Tip: open <b>Appearance</b> any time to switch themes: Sand, Pine, Ocean and more.</p>

        <div className="sheet__foot">
          <button className="btnp btnp--accent" onClick={onClose}>Got it</button>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { ThemeSheet, HabitFormSheet, HelpSheet });
