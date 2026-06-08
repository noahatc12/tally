// data.jsx — seed habits + pure derived math (mirrors src/lib logic, simplified).
// Exposed on window so every screen script shares one source of truth.

const pad2 = (n) => String(n).padStart(2, '0');
function keyForOffset(off, base = new Date()) {
  const d = new Date(base);
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() - off);
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}
const todayKey = () => keyForOffset(0);
function dateFromKey(k) { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d, 12); }
const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MON = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

// ---- seed habits ----------------------------------------------------------
// Muted "colored ink" palette — desaturated so habit hues read calmly on Ledger's
// paper (and never neon), while still distinguishing habits on the dark directions.
const HABITS = [
  { id: 'meditate', name: 'Meditate', icon: '🧘', iconName: 'Sparkles', color: '#8a7ba2', tod: 'morning', cue: 'I wake up', type: 'binary', phase: 1 },
  { id: 'workout', name: 'Strength training', icon: '💪', iconName: 'Dumbbell', color: '#6e88ac', tod: 'morning', cue: 'morning coffee', type: 'binary', phase: 3 },
  { id: 'water', name: 'Drink water', icon: '💧', iconName: 'Droplet', color: '#5f97a0', tod: 'morning', cue: 'each meal', type: 'count', goal: 8, unit: 'glasses', phase: 6 },
  { id: 'walk', name: 'Walk', icon: '🚶', iconName: 'Footprints', color: '#bf8052', tod: 'afternoon', cue: 'lunch', type: 'duration', goal: 30, unit: 'min', phase: 0 },
  { id: 'read', name: 'Read 10 pages', icon: '📖', iconName: 'BookOpen', color: '#7e9c6c', tod: 'evening', cue: 'dinner', type: 'binary', phase: 4 },
];
const TOD = {
  morning: { label: 'Morning', sub: 'After you wake' },
  afternoon: { label: 'Afternoon', sub: 'Midday reset' },
  evening: { label: 'Evening', sub: 'Wind down' },
};

const DAYS = 364;
// Deterministic textured history: mostly done, periodic skips, two rough patches
// (so the strength curve dips and recovers — the whole point of the model).
function stateFor(off, phase) {
  if (off === 0) return null; // today: left for the user
  if (off >= 40 + phase && off <= 52 + phase) return off % 3 === 0 ? 'done' : 'missed';
  if (off >= 150 + phase && off <= 165 + phase) return off % 2 === 0 ? 'done' : 'missed';
  if (off % 23 === 0) return 'skip';
  if (off % 14 === 0) return 'missed';
  return 'done';
}
const walkMinutes = (off) => 18 + ((off * 7) % 34);
const waterGlasses = (off) => 5 + ((off * 3) % 5); // 5..9

function buildCompletions() {
  const c = {};
  for (let off = DAYS; off >= 1; off--) {
    const key = keyForOffset(off);
    for (const h of HABITS) {
      const st = stateFor(off, h.phase);
      if (!st) continue;
      c[key] = c[key] || {};
      if (st === 'done' && h.type === 'duration') c[key][h.id] = { state: 'done', value: walkMinutes(off) };
      else if (st === 'done' && h.type === 'count') c[key][h.id] = { state: 'done', value: waterGlasses(off) };
      else c[key][h.id] = { state: st };
    }
  }
  // partial today for life
  const tk = todayKey();
  c[tk] = { walk: { state: 'done', value: 22 }, water: { state: 'in', value: 5 } };
  return c;
}

// ---- derived --------------------------------------------------------------
function recordOf(completions, habitId, key) { return completions[key]?.[habitId] || null; }

// EWMA strength 0..100 over the habit's full history.
function strengthOf(habit, completions, today = todayKey()) {
  const alpha = 0.09;
  let s = 0, started = false;
  for (let off = DAYS; off >= 0; off--) {
    const key = keyForOffset(off);
    const rec = recordOf(completions, habit.id, key);
    if (!rec) { if (off === 0) continue; if (!started) continue; else { /* untracked past = soft miss */ } }
    if (rec?.state === 'skip') continue;
    let x;
    if (!rec) { if (!started) continue; x = 0; }
    else if (rec.state === 'done') x = 100;
    else if (rec.state === 'in') continue;
    else x = 0;
    started = true;
    s = alpha * x + (1 - alpha) * s;
  }
  return Math.round(s);
}

// skip-neutral streak, today-pending aware
function streakOf(habit, completions, today = todayKey()) {
  let n = 0;
  for (let off = 0; off <= DAYS; off++) {
    const key = keyForOffset(off);
    const rec = recordOf(completions, habit.id, key);
    const st = rec?.state;
    if (off === 0 && (!st || st === 'in')) continue; // today pending doesn't break
    if (st === 'done') n++;
    else if (st === 'skip') continue;
    else break;
  }
  return n;
}

function trailingMisses(habit, completions) {
  let n = 0;
  for (let off = 1; off <= 14; off++) {
    const st = recordOf(completions, habit.id, keyForOffset(off))?.state;
    if (st === 'missed') n++;
    else if (st === 'skip') continue;
    else break;
  }
  return n;
}

function weekStates(habit, completions, today = todayKey()) {
  const out = [];
  for (let off = 6; off >= 0; off--) {
    const key = keyForOffset(off);
    const rec = recordOf(completions, habit.id, key);
    out.push({ key, off, state: rec?.state || (off === 0 ? 'today' : 'off'), isToday: off === 0, dow: DOW[dateFromKey(key).getDay()][0] });
  }
  return out;
}

function weekRate(habit, completions) {
  let done = 0, denom = 0;
  for (let off = 0; off < 7; off++) {
    const st = recordOf(completions, habit.id, keyForOffset(off))?.state;
    if (st === 'done') { done++; denom++; }
    else if (st === 'missed') denom++;
  }
  return denom === 0 ? null : Math.round((done / denom) * 100);
}

// heatmap cells (level 0..4, or -1 for off/untracked)
function heatLevel(rec, habit) {
  if (!rec) return 0;
  if (rec.state === 'skip') return 1;
  if (rec.state === 'missed') return 0;
  if (rec.state === 'in') return 2;
  if (rec.state === 'done') {
    if (habit.type === 'duration') return rec.value >= habit.goal ? 4 : rec.value >= habit.goal * 0.6 ? 3 : 2;
    if (habit.type === 'count') return rec.value >= habit.goal ? 4 : rec.value >= habit.goal * 0.6 ? 3 : 2;
    return 4;
  }
  return 0;
}

// year grid aligned to weeks (columns = weeks, rows = Sun..Sat)
function yearGrid(habit, completions, weeks = 53) {
  const cells = []; // {col,row,level,key,state,miss}
  const months = [];
  let lastMonth = -1;
  const totalDays = weeks * 7;
  // find offset of the most recent Saturday to align columns
  const todayDow = dateFromKey(todayKey()).getDay();
  for (let i = totalDays - 1; i >= 0; i--) {
    const off = i - (6 - todayDow); // pad so today's column ends at its weekday
    if (off < 0) continue;
    const idx = totalDays - 1 - i;
    const col = Math.floor(idx / 7);
    const row = idx % 7;
    const key = keyForOffset(off);
    const d = dateFromKey(key);
    const rec = off === 0 ? null : recordOf(completions, habit.id, key);
    cells.push({ col, row, off, key, level: heatLevel(rec, habit), state: rec?.state, isToday: off === 0 });
    if (row === 0) { const m = d.getMonth(); if (m !== lastMonth) { months.push({ col, label: MON[m] }); lastMonth = m; } }
  }
  return { cells, months, cols: weeks };
}

// strength sampled over the year for the trend line
function trendSeries(habit, completions, points = 40) {
  const series = [];
  const step = Math.floor(DAYS / points);
  const alpha = 0.09;
  let s = 0, started = false, p = 0;
  for (let off = DAYS; off >= 0; off--) {
    const rec = recordOf(completions, habit.id, keyForOffset(off));
    if (rec?.state === 'skip') { /* neutral */ }
    else if (rec || started) {
      let x = !rec ? 0 : rec.state === 'done' ? 100 : rec.state === 'in' ? null : 0;
      if (x != null) { started = true; s = alpha * x + (1 - alpha) * s; }
    }
    if ((DAYS - off) % step === 0) series.push(Math.round(s));
  }
  series.push(strengthOf(habit, completions));
  return series;
}

function aggToday(habits, completions) {
  const tk = todayKey();
  let done = 0;
  const items = habits.map((h) => {
    const st = recordOf(completions, h.id, tk)?.state;
    const isDone = st === 'done';
    if (isDone) done++;
    return { habit: h, state: st, isDone, isMiss: st === 'missed' };
  });
  return { items, done, total: habits.length, pct: habits.length ? Math.round((done / habits.length) * 100) : 0 };
}

function yearStats(habits, completions) {
  let totalDone = 0, activeDays = new Set(), bestStreak = 0, perfect = 0;
  for (let off = DAYS; off >= 1; off--) {
    const key = keyForOffset(off);
    const day = completions[key];
    if (!day) continue;
    let dDone = 0, dTotal = 0;
    for (const h of habits) {
      const st = day[h.id]?.state;
      if (st === 'done') { totalDone++; dDone++; dTotal++; activeDays.add(key); }
      else if (st === 'missed') dTotal++;
    }
    if (dTotal > 0 && dDone === dTotal) perfect++;
  }
  for (const h of habits) bestStreak = Math.max(bestStreak, longestStreak(h, completions));
  return { totalDone, activeDays: activeDays.size, bestStreak, perfect };
}

function longestStreak(habit, completions) {
  let best = 0, run = 0;
  for (let off = DAYS; off >= 0; off--) {
    const st = recordOf(completions, habit.id, keyForOffset(off))?.state;
    if (st === 'done') { run++; best = Math.max(best, run); }
    else if (st === 'skip' || st === 'in') continue;
    else if (off === 0) continue;
    else run = 0;
  }
  return best;
}

const STARTERS = [
  { id: 's_read', name: 'Read', icon: '📖', iconName: 'BookOpen', color: '#7e9c6c', tod: 'evening', cue: 'dinner', type: 'binary' },
  { id: 's_water', name: 'Drink water', icon: '💧', iconName: 'Droplet', color: '#5f97a0', tod: 'morning', cue: 'each meal', type: 'count', goal: 8, unit: 'glasses' },
  { id: 's_walk', name: 'Walk', icon: '🚶', iconName: 'Footprints', color: '#bf8052', tod: 'afternoon', cue: 'lunch', type: 'duration', goal: 20, unit: 'min' },
  { id: 's_meditate', name: 'Meditate', icon: '🧘', iconName: 'Sparkles', color: '#8a7ba2', tod: 'morning', cue: 'I wake up', type: 'binary' },
  { id: 's_stretch', name: 'Stretch', icon: '🤸', iconName: 'PersonStanding', color: '#c2a052', tod: 'morning', cue: 'morning coffee', type: 'binary' },
  { id: 's_journal', name: 'Journal', icon: '✍️', iconName: 'PenLine', color: '#c07f93', tod: 'evening', cue: 'I get in bed', type: 'binary' },
];

// aggregate year grid: each day shaded by share of that day's habits completed
function aggregateYearGrid(habits, completions, weeks = 53) {
  const base = yearGrid(habits[0] || { id: '__none', type: 'binary' }, completions, weeks);
  const cells = base.cells.map((c) => {
    if (c.isToday) return { ...c, level: 0, ratio: 0 };
    let done = 0, due = 0;
    for (const h of habits) {
      const st = recordOf(completions, h.id, c.key)?.state;
      if (st === 'done') { done++; due++; }
      else if (st === 'missed') due++;
    }
    const ratio = due === 0 ? 0 : done / due;
    const level = due === 0 || done === 0 ? 0 : Math.min(4, 1 + Math.round(ratio * 3));
    return { ...c, level, ratio, done, due, state: undefined };
  });
  return { cells, months: base.months, cols: base.cols };
}

// daily quotes — calm, on-thesis (consistency over perfection)
const QUOTES = [
  { text: 'You do not rise to the level of your goals. You fall to the level of your systems.', author: 'James Clear' },
  { text: 'Small habits don’t add up. They compound.', author: null },
  { text: 'A river cuts through rock not because of its power, but its persistence.', author: 'Proverb' },
  { text: 'Fall down seven times, stand up eight.', author: 'Japanese proverb' },
  { text: 'It is not that we have a short time to live, but that we waste a lot of it.', author: 'Seneca' },
  { text: 'The journey of a thousand miles begins beneath one’s feet.', author: 'Lao Tzu' },
  { text: 'Well begun is half done.', author: 'Aristotle' },
  { text: 'Motivation gets you going; habit keeps you growing.', author: null },
  { text: 'A single missed day is an accident, not a verdict.', author: null },
  { text: 'How we spend our days is how we spend our lives.', author: 'Annie Dillard' },
  { text: 'Patience and perseverance have a magical effect.', author: 'J. Q. Adams' },
  { text: 'The best time to plant a tree was twenty years ago. The second best is today.', author: 'Proverb' },
];
function pickQuote(key = todayKey()) {
  let s = 0; for (let i = 0; i < key.length; i++) s = (s * 31 + key.charCodeAt(i)) >>> 0;
  return QUOTES[s % QUOTES.length];
}

// Sum of logged values (counts or minutes) over the habit's history, excluding skips.
function valueTotals(habit, completions, days = DAYS) {
  let total = 0, daysLogged = 0, week = 0;
  for (let off = days; off >= 0; off--) {
    const rec = recordOf(completions, habit.id, keyForOffset(off));
    if (!rec || rec.state === 'skip') continue;
    const v = rec.value || 0;
    if (v > 0) { total += v; daysLogged++; if (off < 7) week += v; }
  }
  return { total, daysLogged, avg: daysLogged ? total / daysLogged : 0, week };
}
function formatDuration(min) {
  const m = Math.round(min || 0);
  if (m < 60) return m + 'm';
  const h = Math.floor(m / 60), r = m % 60;
  return r ? `${h}h ${r}m` : `${h}h`;
}

// ---- schedules + due logic (ported from src/lib/scheduling.js) ------------
function getWeekday(key) { return dateFromKey(key).getDay(); }
function diffDaysKeys(a, b) { return Math.round((dateFromKey(b) - dateFromKey(a)) / 86400000); }
function isDue(habit, key = todayKey()) {
  if (habit.archived) return false;
  const created = (habit.createdAt || '').slice(0, 10);
  if (created && diffDaysKeys(created, key) < 0) return false;
  const s = habit.schedule || { kind: 'daily' };
  switch (s.kind) {
    case 'weekdays': return (s.weekdays || []).includes(getWeekday(key));
    case 'everyNDays': { const n = Math.max(1, s.everyN || 1); return created ? diffDaysKeys(created, key) % n === 0 : true; }
    case 'timesPerWeek': return true; // actionable any day until the weekly quota is met
    default: return true;
  }
}
function schedLabel(habit) {
  const s = habit.schedule || { kind: 'daily' };
  if (s.kind === 'weekdays') { const n = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']; return (s.weekdays || []).map((d) => n[d]).join(' · ') || 'Weekdays'; }
  if (s.kind === 'everyNDays') return `Every ${s.everyN || 2} days`;
  if (s.kind === 'timesPerWeek') return `${s.timesPerWeek || 3}× per week`;
  return 'Daily';
}
function normalizeHabit(h) {
  return {
    schedule: { kind: 'daily' },
    createdAt: keyForOffset(DAYS) + 'T08:00:00.000Z',
    plan: { cue: h.cue || '', time: '', place: '' },
    minimumVersion: '', anchor: null, archived: false,
    ...h,
  };
}

// ---- persistence (localStorage, like the repo) ----------------------------
const STORE = 'tally_proto_v2';
function loadState() {
  try { const r = localStorage.getItem(STORE); if (!r) return null; const d = JSON.parse(r); return d && d.habits ? d : null; } catch (e) { return null; }
}
function saveState(data) { try { localStorage.setItem(STORE, JSON.stringify(data)); } catch (e) {} }
function clearState() { try { localStorage.removeItem(STORE); } catch (e) {} }

Object.assign(window, {
  keyForOffset, todayKey, dateFromKey, DOW, MON, HABITS, TOD, STARTERS, DAYS,
  buildCompletions, recordOf, strengthOf, streakOf, trailingMisses, weekStates,
  weekRate, yearGrid, trendSeries, aggToday, yearStats, longestStreak,
  aggregateYearGrid, pickQuote, valueTotals, formatDuration,
  isDue, schedLabel, normalizeHabit, loadState, saveState, clearState,
});
