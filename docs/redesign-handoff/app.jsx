// app.jsx — root: state machine, device frame, tweaks panel + token export.
const { useState: uS, useEffect: uE, useMemo: uM, useCallback: uC } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "direction": "A",
  "palette": "auto",
  "ink": "color",
  "completed": "soften",
  "customBg": "#14181d",
  "customSurface": "#1d232b",
  "customText": "#e4e8ed",
  "customAccent": "#7c93b0",
  "customDark": true,
  "accent": "auto",
  "density": "regular",
  "radius": "regular",
  "typeface": "auto",
  "motion": "calm",
  "heatmap": "auto",
  "cardStyle": "auto",
  "firstRun": false
}/*EDITMODE-END*/;

const CELEBRATIONS = ['Nice.', 'Logged.', 'Kept the chain.', 'That counts.', "Strength +.", 'Showed up.'];
const newHabitFrom = (s, i) => normalizeHabit({ ...s, id: s.id + '_' + Date.now() + '_' + i, createdAt: todayKey() + 'T08:00:00.000Z' });

// tonal ink: distinct shades of the theme accent so habits match the active theme
const INK_SH = [100, 74, 56, 42, 32, 24, 18, 14];
const inkShade = (i) => `color-mix(in srgb, var(--accent) ${INK_SH[i % INK_SH.length]}%, var(--surface))`;

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const resolved = uM(() => resolveTweaks(t), [t]);

  const demo = uM(() => ({ habits: HABITS.map(normalizeHabit), completions: buildCompletions() }), []);
  const freshDemo = () => ({ habits: HABITS.map(normalizeHabit), completions: buildCompletions() });
  const [data, setData] = uS(() => (t.firstRun ? { habits: [], completions: {} } : (loadState() || demo)));
  const [view, setView] = uS(() => (t.firstRun ? 'onboarding' : 'today'));
  const [sel, setSel] = uS(null);
  const [onbAdded, setOnbAdded] = uS([]);
  const [onbMode, setOnbMode] = uS('firstrun');
  const [shareOpen, setShareOpen] = uS(false);
  const [themeOpen, setThemeOpen] = uS(false);
  const [helpOpen, setHelpOpen] = uS(false);
  const [form, setForm] = uS(null); // null | { habit: null|habit }
  const [celebrate, setCelebrate] = uS(null);

  // react to the first-run tweak
  uE(() => {
    if (t.firstRun) { setData({ habits: [], completions: {} }); setView('onboarding'); setOnbMode('firstrun'); setOnbAdded([]); }
    else { setData(loadState() || demo); setView('today'); setShareOpen(false); }
  }, [t.firstRun]);

  // persist (localStorage), like the repo
  uE(() => { if (!t.firstRun) saveState(data); }, [data, t.firstRun]);

  const setCompletion = uC((habitId, key, state, value) => {
    setData((d) => {
      const prev = d.completions[key]?.[habitId]?.state;
      const completions = { ...d.completions };
      const day = { ...(completions[key] || {}) };
      if (state == null) delete day[habitId];
      else day[habitId] = value !== undefined ? { state, value } : { state };
      completions[key] = day;
      if (state === 'done' && prev !== 'done' && key === todayKey()) {
        setCelebrate({ id: Date.now(), msg: CELEBRATIONS[Math.floor(Math.random() * CELEBRATIONS.length)] });
      }
      return { ...d, completions };
    });
  }, []);

  uE(() => { if (!celebrate) return; const id = setTimeout(() => setCelebrate(null), 1000); return () => clearTimeout(id); }, [celebrate]);

  const finishSetup = ({ name, reminders, reminderTime, exampleData, starters }) => {
    try {
      if (name) localStorage.setItem('tally_name', name); else localStorage.removeItem('tally_name');
      localStorage.setItem('tally_reminders', JSON.stringify({ on: !!reminders, time: reminderTime }));
    } catch (e) {}
    if (exampleData) setData(freshDemo());
    else { const chosen = STARTERS.filter((s) => starters.includes(s.id)).map(newHabitFrom); setData({ habits: chosen, completions: {} }); }
    setView('today');
  };

  const openAdd = () => { setOnbAdded([]); setOnbMode('add'); setView('onboarding'); };
  const onbToggle = (id) => setOnbAdded((a) => (a.includes(id) ? a.filter((x) => x !== id) : [...a, id]));
  const onbStart = () => {
    const chosen = STARTERS.filter((s) => onbAdded.includes(s.id)).map(newHabitFrom);
    if (onbMode === 'firstrun') {
      setData({ habits: chosen, completions: {} });
    } else {
      setData((d) => ({ habits: [...d.habits, ...chosen], completions: d.completions }));
    }
    setView('today');
  };

  // habit CRUD (the repo's add/edit form)
  const saveHabit = (fields, id) => {
    if (id) setData((d) => ({ ...d, habits: d.habits.map((h) => (h.id === id ? { ...h, ...fields } : h)) }));
    else setData((d) => ({ ...d, habits: [...d.habits, normalizeHabit({ id: 'h_' + Date.now(), createdAt: todayKey() + 'T08:00:00.000Z', ...fields })] }));
    setForm(null);
  };
  const deleteHabit = (id) => {
    setData((d) => ({ ...d, habits: d.habits.filter((h) => h.id !== id) }));
    setForm(null);
    if (sel === id) setView('today');
  };
  const archiveHabit = (id) => {
    setData((d) => ({ ...d, habits: d.habits.map((h) => (h.id === id ? { ...h, archived: !h.archived } : h)) }));
    setForm(null);
    if (sel === id) setView('today');
  };
  const resetDemo = () => { clearState(); setData(freshDemo()); setView('today'); };

  const selHabit = data.habits.find((h) => h.id === sel);
  const dark = resolved.dark;
  const tonal = t.ink === 'tonal';
  const inkMap = uM(() => Object.fromEntries(data.habits.map((h, i) => [h.id, tonal ? inkShade(i) : h.color])), [data.habits, tonal]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18, padding: '26px 12px 40px' }}>
      <IOSDevice dark={dark}>
        <div className="tally" data-screen-label={view} data-completed={t.completed || 'soften'} style={resolved.vars} {...resolved.attrs}>
          {view === 'onboarding' && (
            <SetupWizard t={t} setTweak={setTweak} onFinish={finishSetup} />
          )}
          {view === 'today' && (
            <TodayScreen
              habits={data.habits} completions={data.completions} setCompletion={setCompletion} inkMap={inkMap}
              onOpen={(id) => { setSel(id); setView('detail'); }}
              onOverview={() => setView('overview')} onHelp={() => setHelpOpen(true)}
              onTheme={() => setThemeOpen(true)} onNew={() => setForm({ habit: null })} completedMode={t.completed || 'soften'}
            />
          )}
          {view === 'overview' && (
            <OverviewScreen
              habits={data.habits} completions={data.completions} inkMap={inkMap}
              onBack={() => setView('today')} onOpen={(id) => { setSel(id); setView('detail'); }}
              onShare={() => setShareOpen(true)}
            />
          )}
          {view === 'detail' && selHabit && (
            <DetailScreen habit={selHabit} completions={data.completions} setCompletion={setCompletion} ink={inkMap[selHabit.id]}
              habits={data.habits} onOpen={(id) => setSel(id)}
              onBack={() => setView('today')} onShare={() => setShareOpen(true)} onEdit={() => setForm({ habit: selHabit })} />
          )}

          {shareOpen && data.habits.length > 0 && (
            <ShareCard habits={data.habits} completions={data.completions} onClose={() => setShareOpen(false)} />
          )}
          {themeOpen && <ThemeSheet t={t} setTweak={setTweak} onReset={resetDemo} onClose={() => setThemeOpen(false)} />}
          {helpOpen && <HelpSheet onClose={() => setHelpOpen(false)} />}
          {form && (
            <HabitFormSheet habit={form.habit} habits={data.habits} onSave={saveHabit} onDelete={deleteHabit} onArchive={archiveHabit} onClose={() => setForm(null)} />
          )}

          {celebrate && (
            <div className="celebrate" key={celebrate.id}>
              <div className="celebrate__pop">
                <div className="celebrate__check">✓</div>
                <div className="celebrate__msg">{celebrate.msg}</div>
              </div>
            </div>
          )}
        </div>
      </IOSDevice>

      <TweaksPanel>
        <TweakPanelBody t={t} setTweak={setTweak} />
      </TweaksPanel>
    </div>
  );
}

// ----- custom tweak panel body -----
function DirectionCard({ id, active, onPick }) {
  const d = DIRECTIONS[id];
  const dots = [d.tokens['--bg'], d.tokens['--surface'], d.tokens['--accent'], d.tokens['--text']];
  return (
    <button type="button" onClick={() => onPick(id)}
      style={{
        display: 'flex', flexDirection: 'column', gap: 7, padding: '11px 12px', textAlign: 'left',
        borderRadius: 12, cursor: 'pointer', width: '100%',
        border: active ? '1.5px solid #fff' : '1px solid rgba(255,255,255,0.16)',
        background: active ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.03)',
        color: '#fff', outline: active ? '2px solid rgba(255,255,255,0.25)' : 'none', outlineOffset: 1,
      }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ display: 'flex', gap: 3 }}>
          {dots.map((c, i) => <span key={i} style={{ width: 12, height: 12, borderRadius: 3, background: c, border: '1px solid rgba(255,255,255,0.18)' }} />)}
        </div>
        <span style={{ fontWeight: 700, fontSize: 13, letterSpacing: '.01em' }}>{d.name}</span>
        <span style={{ marginLeft: 'auto', fontSize: 10, opacity: .5, fontFamily: 'ui-monospace, monospace' }}>{id}</span>
      </div>
      <span style={{ fontSize: 11, lineHeight: 1.4, opacity: .68 }}>{d.tagline}</span>
    </button>
  );
}

function PaletteRow({ value, onChange }) {
  const items = [{ id: 'auto', label: 'Auto' }, ...Object.keys(PALETTES).filter((k) => k !== 'auto' && k !== 'custom').map((k) => ({ id: k, label: PALETTES[k].label }))];
  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      {items.map((it) => {
        const active = value === it.id;
        const p = PALETTES[it.id];
        const bg = p ? p.tokens['--bg'] : 'linear-gradient(135deg,#f2ece0 50%,#18181a 50%)';
        const acc = p ? p.tokens['--accent'] : '#bd6a3c';
        return (
          <button key={it.id} type="button" onClick={() => onChange(it.id)} title={it.label}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
              padding: 5, borderRadius: 10, cursor: 'pointer', width: 52,
              border: active ? '1.5px solid #fff' : '1px solid rgba(255,255,255,0.16)',
              background: active ? 'rgba(255,255,255,0.10)' : 'transparent',
            }}>
            <span style={{ position: 'relative', width: 38, height: 26, borderRadius: 6, background: bg, border: '1px solid rgba(255,255,255,0.18)', overflow: 'hidden' }}>
              <span style={{ position: 'absolute', right: 4, bottom: 4, width: 9, height: 9, borderRadius: '50%', background: acc, border: '1px solid rgba(255,255,255,0.25)' }} />
            </span>
            <span style={{ fontSize: 10, color: '#fff', opacity: active ? 1 : .6 }}>{it.label}</span>
          </button>
        );
      })}
    </div>
  );
}

function AccentRow({ value, onChange }) {
  const isCustom = value && value !== 'auto' && !ACCENT_SWATCHES.some((s) => s.id === value);
  return (
    <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
      {ACCENT_SWATCHES.map((s) => {
        const active = value === s.id;
        const isAuto = s.id === 'auto';
        return (
          <button key={s.id} type="button" onClick={() => onChange(s.id)} title={s.label}
            style={{
              width: 30, height: 30, borderRadius: 8, cursor: 'pointer',
              background: isAuto ? 'conic-gradient(#9e3b2d,#ef9079,#c8f25a,#5a8bd6,#9e3b2d)' : s.id,
              border: active ? '2px solid #fff' : '1px solid rgba(255,255,255,0.2)',
              outline: active ? '2px solid rgba(255,255,255,0.3)' : 'none', outlineOffset: 1,
              fontSize: 9, color: '#fff', fontWeight: 700,
            }}>{isAuto ? 'A' : ''}</button>
        );
      })}
      <label title="Custom accent"
        style={{
          width: 30, height: 30, borderRadius: 8, cursor: 'pointer', position: 'relative', overflow: 'hidden',
          background: isCustom ? value : 'conic-gradient(from 0deg,#e2725b,#c2a052,#7e9c6c,#5f97a0,#6e88ac,#8a7ba2,#c07f93,#e2725b)',
          border: isCustom ? '2px solid #fff' : '1px solid rgba(255,255,255,0.2)',
        }}>
        <input type="color" value={/^#[0-9a-fA-F]{6}$/.test(value) ? value : '#9e3b2d'} onChange={(e) => onChange(e.target.value)}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0, border: 'none', cursor: 'pointer' }} />
      </label>
    </div>
  );
}

function TweakPanelBody({ t, setTweak }) {
  const [copied, setCopied] = uS(false);
  const copyTokens = () => {
    const css = tokensToCSS(t);
    if (navigator.clipboard) navigator.clipboard.writeText(css).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1600); });
    else { console.log(css); setCopied(true); setTimeout(() => setCopied(false), 1600); }
  };
  return (
    <>
      <TweakSection label="Direction" />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {['A', 'B', 'C'].map((id) => (
          <DirectionCard key={id} id={id} active={t.direction === id} onPick={(v) => setTweak('direction', v)} />
        ))}
      </div>

      <TweakSection label="Tune the personality" />
      <TweakRow label="Palette"><PaletteRow value={t.palette} onChange={(v) => setTweak('palette', v)} /></TweakRow>
      <TweakRow label="Accent"><AccentRow value={t.accent} onChange={(v) => setTweak('accent', v)} /></TweakRow>
      <TweakRadio label="Density" value={t.density} options={['compact', 'regular', 'roomy']} onChange={(v) => setTweak('density', v)} />
      <TweakRadio label="Corners" value={t.radius} options={['sharp', 'regular', 'soft']} onChange={(v) => setTweak('radius', v)} />
      <TweakRadio label="Card" value={t.cardStyle} options={['auto', 'flat', 'elevated']} onChange={(v) => setTweak('cardStyle', v)} />
      <TweakRadio label="Motion" value={t.motion} options={['off', 'calm', 'lively']} onChange={(v) => setTweak('motion', v)} />
      <TweakSelect label="Display font" value={t.typeface}
        options={[{ value: 'auto', label: 'Per direction' }, { value: 'grotesk', label: 'Space Grotesk' }, { value: 'serif', label: 'Newsreader' }, { value: 'bricolage', label: 'Bricolage' }]}
        onChange={(v) => setTweak('typeface', v)} />
      <TweakSelect label="Heatmap" value={t.heatmap}
        options={[{ value: 'auto', label: 'Per direction' }, { value: 'forge', label: 'Forge' }, { value: 'bloom', label: 'Bloom' }, { value: 'signal', label: 'Signal' }, { value: 'github', label: 'GitHub green' }, { value: 'mono', label: 'Mono' }]}
        onChange={(v) => setTweak('heatmap', v)} />

      <TweakSection label="Screens" />
      <TweakToggle label="Show first-run / onboarding" value={t.firstRun} onChange={(v) => setTweak('firstRun', v)} />

      <TweakSection label="Handoff" />
      <TweakButton label={copied ? '✓ Copied tokens to clipboard' : 'Copy design tokens (CSS)'} onClick={copyTokens} />
      <div style={{ fontSize: 11, opacity: .55, lineHeight: 1.4, padding: '2px 2px 0' }}>
        Exports the current direction as a ready-to-ship <code>:root</code> token block.
      </div>
    </>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
