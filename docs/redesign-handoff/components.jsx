// components.jsx — shared presentational pieces. Exported to window.
const { useState, useEffect, useRef } = React;

// ---- brand tally mark -----------------------------------------------------
function TallyMark({ count = 5, h = 22, w = 2.5, style }) {
  const groups = [];
  let rem = count;
  while (rem > 0) { groups.push(Math.min(5, rem)); rem -= 5; }
  return (
    <span className="tallymark" style={{ '--tm-h': h + 'px', '--tm-w': w + 'px', ...style }} aria-hidden="true">
      {groups.map((g, gi) => (
        <span key={gi} className={'tallymark__grp' + (g === 5 ? ' struck' : '')}>
          {Array.from({ length: Math.min(4, g) }).map((_, i) => (
            <span key={i} className="tallymark__stroke" />
          ))}
        </span>
      ))}
    </span>
  );
}

// ---- progress ring --------------------------------------------------------
function ProgressRing({ pct, size = 56, stroke = 6 }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="daystat__ring">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--surface-2)" strokeWidth={stroke} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--accent)" strokeWidth={stroke}
        strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - pct / 100)}
        transform={`rotate(-90 ${size / 2} ${size / 2})`} style={{ transition: 'stroke-dashoffset 600ms cubic-bezier(.2,.7,.2,1)' }} />
      <text x="50%" y="50%" textAnchor="middle" dominantBaseline="central" className="daystat__big"
        fill="var(--text)" style={{ fontSize: size * 0.27 }}>{pct}%</text>
    </svg>
  );
}

// ---- strength meter -------------------------------------------------------
function StrengthMeter({ value }) {
  return (
    <div className="strength">
      <span className="strength__track"><span className="strength__fill" style={{ width: value + '%' }} /></span>
      <span className="strength__val">{value}<small> /100</small></span>
    </div>
  );
}

// ---- streak badge ---------------------------------------------------------
function StreakBadge({ n, dim }) {
  if (n <= 0) return null;
  return (
    <span className={'streak' + (dim ? ' is-dim' : '')}>
      <span className="streak__flame">▴</span>
      <span className="streak__num">{n}</span>
      <span className="streak__unit">d</span>
    </span>
  );
}

// ---- week dots ------------------------------------------------------------
function WeekDots({ cells }) {
  return (
    <div className="week">
      {cells.map((c) => (
        <div className="week__cell" key={c.key}>
          <span className={`week__dot is-${c.isToday ? 'today' : c.state}`} />
          <span className="week__lbl">{c.dow}</span>
        </div>
      ))}
    </div>
  );
}

// ---- check controls -------------------------------------------------------
function ThreeState({ state, onSelect }) {
  const opt = [
    { k: 'done', icon: 'Check', l: 'Done' },
    { k: 'skip', icon: 'ChevronsRight', l: 'Skip' },
    { k: 'missed', icon: 'Minus', l: 'Miss' },
  ];
  return (
    <div className="tstate">
      {opt.map((o) => (
        <button key={o.k} className={`tstate__btn ${o.k === 'missed' ? 'miss' : o.k}${state === o.k ? ' is-on' : ''}`}
          onClick={() => onSelect(o.k)} type="button">
          <span className="tstate__glyph"><LucideIcon name={o.icon} size={16} stroke={2.4} /></span>{o.l}
        </button>
      ))}
    </div>
  );
}

function CountControl({ value, goal, unit, onSet }) {
  const v = value || 0;
  const done = v >= goal;
  return (
    <div className={'count' + (done ? ' is-done' : '')}>
      <button className="count__btn" type="button" disabled={v <= 0} onClick={() => onSet(Math.max(0, v - 1))}>−</button>
      <span className="count__read"><span className="count__num">{v}</span><span className="count__unit">/{goal} {unit}</span></span>
      <button className="count__btn count__btn--inc" type="button" onClick={() => onSet(v + 1)}>+</button>
    </div>
  );
}

function TimerControl({ value, goal, unit, onSet }) {
  const v = value || 0;
  const [startedAt, setStartedAt] = useState(null);
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (startedAt == null) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [startedAt]);
  const sessionMin = startedAt != null ? (now - startedAt) / 60000 : 0;
  const shown = v + sessionMin;
  const done = shown >= goal;
  const pct = Math.min(100, (shown / goal) * 100);
  const running = startedAt != null;
  const sessSecs = Math.floor(sessionMin * 60);
  const mmss = `${Math.floor(sessSecs / 60)}:${String(sessSecs % 60).padStart(2, '0')}`;
  const toggle = () => {
    if (!running) { const t = Date.now(); setStartedAt(t); setNow(t); }
    else { const mins = (Date.now() - startedAt) / 60000; setStartedAt(null); onSet((v || 0) + mins); }
  };
  const reset = () => { setStartedAt(null); onSet(0); };
  return (
    <div className={'timer' + (done ? ' is-complete' : '')}>
      <div className="timer__head">
        <span className="timer__read"><span className="timer__num">{Math.floor(shown)}</span><span className="timer__goal">/ {goal} {unit}</span></span>
        {running && <span className="timer__goal" style={{ color: 'var(--c, var(--accent))', fontVariantNumeric: 'tabular-nums' }}>● {mmss}</span>}
      </div>
      <div className="timer__bar"><span className="timer__fill" style={{ width: pct + '%' }} /></div>
      <div className="timer__actions">
        <button className={'timer__primary' + (running ? ' is-running' : '')} type="button" onClick={toggle}>
          {running ? 'Stop' : v > 0 ? 'Resume' : 'Start'}
        </button>
        <button className="timer__chip" type="button" onClick={() => onSet(v + 5)}>+5</button>
        <button className="timer__chip" type="button" onClick={() => onSet(v + 15)}>+15</button>
        <button className="timer__chip" type="button" onClick={reset}>Reset</button>
      </div>
    </div>
  );
}

// ---- trend chart ----------------------------------------------------------
function TrendChart({ series, w = 320, h = 116 }) {
  const [drawn, setDrawn] = useState(false);
  useEffect(() => {
    setDrawn(false);
    const id = setTimeout(() => setDrawn(true), 70);
    return () => clearTimeout(id);
  }, [series]);
  if (!series || series.length < 2) return null;
  const n = series.length;
  const px = (i) => (i / (n - 1)) * w;
  const py = (v) => h - 5 - (Math.max(0, Math.min(100, v)) / 100) * (h - 12);
  const pts = series.map((v, i) => [px(i), py(v)]);
  let d = `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;
  for (let i = 1; i < n; i++) {
    const p0 = pts[i - 1], p1 = pts[i], pm1 = pts[i - 2] || p0, p2 = pts[i + 1] || p1;
    const c1x = p0[0] + (p1[0] - pm1[0]) / 6, c1y = p0[1] + (p1[1] - pm1[1]) / 6;
    const c2x = p1[0] - (p2[0] - p0[0]) / 6, c2y = p1[1] - (p2[1] - p0[1]) / 6;
    d += ` C${c1x.toFixed(1)},${c1y.toFixed(1)} ${c2x.toFixed(1)},${c2y.toFixed(1)} ${p1[0].toFixed(1)},${p1[1].toFixed(1)}`;
  }
  const area = `${d} L${w},${h} L0,${h} Z`;
  const last = series[n - 1];
  const lx = px(n - 1), ly = py(last);
  const gid = 'tgrad' + Math.round(w);
  const dotStyle = { opacity: drawn ? 1 : 0, transition: 'opacity 360ms ease 1000ms' };
  return (
    <div className="trend">
      <svg className="trend__svg" viewBox={`0 0 ${w} ${h}`} width="100%" style={{ height: 'auto', display: 'block' }}>
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--c, var(--accent))" stopOpacity="0.18" />
            <stop offset="100%" stopColor="var(--c, var(--accent))" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path className="trend__area" d={area} fill={`url(#${gid})`}
          style={{ opacity: drawn ? 1 : 0, transition: 'opacity 700ms ease 350ms' }} />
        <line className="trend__now" x1={lx} y1="0" x2={lx} y2={h} style={{ opacity: drawn ? 1 : 0, transition: 'opacity 500ms ease 850ms' }} />
        <path className="trend__line" d={d} pathLength="1"
          style={{ strokeDasharray: 1, strokeDashoffset: drawn ? 0 : 1, transition: 'stroke-dashoffset 1150ms cubic-bezier(.45,.55,.2,1)' }} />
        <circle className="trend__halo" cx={lx} cy={ly} r="6.5" style={dotStyle} />
        <circle className="trend__dot" cx={lx} cy={ly} r="3.4" style={dotStyle} />
      </svg>
      <div className="trend__axis"><span>a year ago</span><span>now · {last}</span></div>
    </div>
  );
}

// ---- horizontal swipe paging (mouse + touch via pointer events) -----------
function useHSwipe({ onPrev, onNext, hasPrev, hasNext }) {
  const s = useRef({ down: false, x0: 0, y0: 0, decided: null, cur: 0, el: null, busy: false });
  const W = 460, T = 120; // T = glide distance for the shared-axis transition
  const set = (el, x, op, anim, dur) => {
    if (!el) return;
    el.style.transition = anim ? `transform ${dur}ms cubic-bezier(.4,0,.2,1), opacity ${dur}ms ease` : 'none';
    el.style.transform = `translateX(${x}px)`;
    if (op != null) el.style.opacity = String(op);
  };
  // shared-axis X: current glides out a little + fades, content swaps, incoming
  // eases in from the opposite side + fades. Short travel keeps it crisp.
  const commit = (el, dir, cb) => {
    s.current.busy = true;
    set(el, dir * T, 0, true, 175);
    setTimeout(() => {
      cb && cb();
      set(el, -dir * T, 0, false);
      requestAnimationFrame(() => {
        set(el, 0, 1, true, 250);
        setTimeout(() => { if (el) el.style.transition = ''; s.current.busy = false; }, 270);
      });
    }, 180);
  };
  const down = (e) => {
    if (s.current.busy) return;
    s.current = { down: true, x0: e.clientX, y0: e.clientY, decided: null, cur: 0, el: e.currentTarget, busy: false };
  };
  const move = (e) => {
    const st = s.current; if (!st.down) return;
    const dX = e.clientX - st.x0, dY = e.clientY - st.y0;
    if (st.decided === null) {
      if (Math.abs(dX) > 8 || Math.abs(dY) > 8) {
        st.decided = Math.abs(dX) > Math.abs(dY) ? 'h' : 'v';
        if (st.decided === 'h') { try { e.currentTarget.setPointerCapture(e.pointerId); } catch (x) {} }
      }
    }
    if (st.decided === 'h') {
      let d = dX; if ((d > 0 && !hasPrev) || (d < 0 && !hasNext)) d = Math.sign(d) * Math.pow(Math.abs(d), 0.8) * 1.3;
      st.cur = d;
      set(st.el, d, Math.max(0.4, 1 - Math.abs(d) / (W * 0.9)), false); // fade as it travels
    }
  };
  const up = () => {
    const st = s.current; if (!st.down) return; st.down = false;
    const el = st.el;
    if (st.decided === 'h') {
      const TH = 48;
      if (st.cur > TH && hasPrev) { commit(el, 1, onPrev); return; }
      if (st.cur < -TH && hasNext) { commit(el, -1, onNext); return; }
    }
    set(el, 0, 1, true, 260); // spring back
  };
  const handlers = { onPointerDown: down, onPointerMove: move, onPointerUp: up, onPointerCancel: up };
  const style = { transform: 'translateX(0)', touchAction: 'pan-y', willChange: 'transform, opacity', opacity: 1 };
  return { handlers, style };
}

// ---- year heatmap ---------------------------------------------------------
function YearHeatmap({ grid, cell = 11, gap = 3, onCell }) {
  const { cells, months, cols } = grid;
  const W = cols * (cell + gap);
  const H = 7 * (cell + gap) + 16;
  const heat = (lvl) => `var(--heat-${Math.max(0, lvl)})`;
  return (
    <div className="heat">
      <div className="heat__scroll">
        <svg className="heat__svg" width="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet" style={{ height: 'auto', display: 'block' }}>
          {months.map((m, i) => (
            <text key={i} className="heat__mlabel" x={m.col * (cell + gap)} y={9}>{m.label}</text>
          ))}
          <g transform="translate(0,15)">
            {cells.map((c) => (
              <rect key={c.key} x={c.col * (cell + gap)} y={c.row * (cell + gap)} width={cell} height={cell} rx={2.5}
                fill={c.isToday ? 'var(--surface-2)' : heat(c.level)}
                stroke={c.isToday ? 'var(--accent)' : c.state === 'missed' ? 'color-mix(in srgb, var(--danger) 50%, transparent)' : 'none'}
                strokeWidth={c.isToday ? 1.4 : 1}
                onClick={onCell ? () => onCell(c) : undefined}
                style={onCell ? { cursor: 'pointer' } : undefined} />
            ))}
          </g>
        </svg>
      </div>
      <div className="heat__legend">
        <span>less</span>
        {[0, 1, 2, 3, 4].map((l) => <span key={l} className="heat__key" style={{ background: heat(l) }} />)}
        <span>more</span>
      </div>
    </div>
  );
}

// ---- lucide outline icon (stroke = currentColor, so it takes the habit ink) ----
function LucideIcon({ name, size = 22, stroke = 2.1 }) {
  const icon = (typeof window !== 'undefined' && window.lucide) ? window.lucide[name] : null;
  if (!Array.isArray(icon)) return null;
  const children = icon[2] || [];
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }} aria-hidden="true">
      {children.map(([tag, attrs], i) => React.createElement(tag, { key: i, ...attrs }))}
    </svg>
  );
}
// curated habit-relevant set (all valid lucide names; render guards missing ones)
const ICONS = [
  'Dumbbell', 'Footprints', 'Bike', 'Waves', 'PersonStanding', 'HeartPulse', 'Activity', 'Mountain',
  'Droplet', 'GlassWater', 'Coffee', 'Apple', 'Salad', 'Carrot', 'Soup', 'Wheat',
  'Moon', 'BedDouble', 'Sun', 'Sunrise', 'AlarmClock', 'Hourglass', 'Timer',
  'BookOpen', 'Book', 'PenLine', 'NotebookPen', 'GraduationCap', 'Brain', 'Languages', 'Pencil',
  'Music', 'Guitar', 'Palette', 'Camera', 'Code', 'Briefcase', 'Wallet', 'PiggyBank',
  'Target', 'Flag', 'Trophy', 'Flame', 'Star', 'Sparkles', 'Heart', 'Smile',
  'Sprout', 'Leaf', 'TreePine', 'Flower2', 'Sun', 'Wind', 'Dog', 'Cat',
  'Pill', 'Stethoscope', 'Bath', 'ShowerHead', 'Cigarette', 'Hand', 'Phone', 'Bell',
  'Recycle', 'Tent', 'Shirt', 'WashingMachine', 'Brush', 'Dumbbell', 'CheckCheck', 'Sword',
];


function Sparkline({ series, color, w = 84, h = 26 }) {
  if (!series || series.length < 2) return <span className="spark spark--empty" />;
  const n = series.length;
  const pts = series.map((v, i) => `${((i / (n - 1)) * w).toFixed(1)},${(h - (Math.max(0, Math.min(100, v)) / 100) * h).toFixed(1)}`).join(' ');
  return (
    <svg className="spark" viewBox={`0 0 ${w} ${h}`} width={w} height={h} preserveAspectRatio="none" aria-hidden="true">
      <polyline points={pts} fill="none" style={{ stroke: color }} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

Object.assign(window, {
  TallyMark, ProgressRing, StrengthMeter, StreakBadge, WeekDots,
  ThreeState, CountControl, TimerControl, TrendChart, YearHeatmap, Sparkline,
  LucideIcon, ICONS, useHSwipe,
});
