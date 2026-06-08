// screens.jsx — Today, Detail, Onboarding, ShareCard. Exported to window.
const { useState: useS, useMemo: useM } = React;

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
}
function dateLabel() {
  return dateFromKey(todayKey()).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
}
// almanac monogram — illuminated initial instead of an off-theme emoji
const initial = (name) => (name || '?').trim().charAt(0).toUpperCase();
// render a Lucide outline icon when the habit has one, else the monogram
const glyph = (h, size) => (h.iconName && typeof window !== 'undefined' && window.lucide && window.lucide[h.iconName])
  ? <LucideIcon name={h.iconName} size={size} /> : initial(h.name);

function QuoteBanner() {
  const q = pickQuote();
  return (
    <aside className="quote rise" style={{ animationDelay: '30ms' }}>
      <p className="quote__text">“{q.text}”</p>
      {q.author && <p className="quote__author">{q.author}</p>}
    </aside>
  );
}

// ============================ HABIT CARD (Today) ===========================
function HabitCard({ habit, completions, onOpen, setCompletion, ink, softened, compact }) {
  const tk = todayKey();
  const rec = recordOf(completions, habit.id, tk);
  const state = rec?.state;
  const strength = strengthOf(habit, completions);
  const streak = streakOf(habit, completions);
  const week = weekStates(habit, completions);
  const rate = weekRate(habit, completions);
  const tMiss = trailingMisses(habit, completions);
  const isDone = state === 'done';
  const showNudge = state !== 'done' && tMiss === 1;
  const dimStreak = tMiss >= 2;

  const setState = (st) => {
    if (st === state) setCompletion(habit.id, tk, null);
    else setCompletion(habit.id, tk, st);
  };
  const setCount = (v) => setCompletion(habit.id, tk, v >= habit.goal ? 'done' : v > 0 ? 'in' : null, v);
  const setTimer = (updater) => {
    const cur = recordOf(completions, habit.id, tk)?.value || 0;
    const v = typeof updater === 'function' ? updater(cur) : updater;
    setCompletion(habit.id, tk, v >= habit.goal ? 'done' : v > 0 ? 'in' : null, v);
  };

  if (compact) {
    return (
      <li className="hcard hcard--slim is-done rise" style={{ '--habit': ink || habit.color }}>
        <button className="hcard__slim" type="button" onClick={() => onOpen(habit.id)}>
          <span className="hcard__icon hcard__icon--sm" aria-hidden="true">{glyph(habit, 17)}</span>
          <span className="hcard__name slim__name">{habit.name}</span>
          <span className="slim__check">✓</span>
          {streak > 0 && <StreakBadge n={streak} dim />}
        </button>
      </li>
    );
  }

  return (
    <li className={'hcard rise' + (isDone ? ' is-done' : '') + (softened ? ' hcard--soft' : '')} style={{ '--habit': ink || habit.color }}>
      <div className="hcard__main">
        <span className="hcard__icon" aria-hidden="true">{glyph(habit, 22)}</span>
        <button className="hcard__id" type="button" onClick={() => onOpen(habit.id)}>
          <span className="hcard__name">{habit.name}</span>
          {habit.cue && <span className="hcard__cue">After <b>{habit.cue}</b></span>}
        </button>
        <span className="hcard__chev">›</span>
        <StreakBadge n={streak} dim={dimStreak} />
      </div>

      <div className="hcard__metrics">
        <StrengthMeter value={strength} />
      </div>
      <div style={{ marginTop: 14 }}><WeekDots cells={week} /></div>

      {habit.type === 'duration' ? (
        <>
          <div className="hcard__foot"><span className="pill">{rate == null ? 'new' : rate + '% this week'}</span></div>
          <TimerControl value={rec?.value} goal={habit.goal} unit={habit.unit} onSet={setTimer} />
        </>
      ) : (
        <div className="hcard__foot">
          <span className="pill">{rate == null ? 'new' : rate + '% this week'}</span>
          {habit.type === 'count'
            ? <CountControl value={rec?.value} goal={habit.goal} unit={habit.unit} onSet={setCount} />
            : <ThreeState state={state} onSelect={setState} />}
        </div>
      )}

      {showNudge && <p className="hcard__nudge">One miss is an accident. Get back on track today. Never miss twice.</p>}
    </li>
  );
}

// ============================== TODAY SCREEN ===============================
function TodayScreen({ habits, completions, setCompletion, onOpen, onOverview, onHelp, onTheme, onNew, inkMap = {}, completedMode = 'soften' }) {
  const [drawerOpen, setDrawerOpen] = useS(false);
  const active = useM(() => habits.filter((h) => !h.archived), [habits]);
  const due = useM(() => active.filter((h) => isDue(h)), [active]);
  const notDue = useM(() => active.filter((h) => !isDue(h)), [active]);
  const isDoneToday = (h) => recordOf(completions, h.id, todayKey())?.state === 'done';
  const drawerMode = completedMode === 'drawer';
  const visibleDue = drawerMode ? due.filter((h) => !isDoneToday(h)) : due;
  const doneDrawer = drawerMode ? due.filter(isDoneToday) : [];
  const sortG = (items) => (completedMode === 'none' || drawerMode) ? items
    : [...items.filter((h) => !isDoneToday(h)), ...items.filter(isDoneToday)];
  const agg = useM(() => aggToday(due, completions), [due, completions]);
  const groups = ['morning', 'afternoon', 'evening']
    .map((tod) => ({ tod, items: sortG(visibleDue.filter((h) => h.tod === tod)) }))
    .filter((g) => g.items.length);

  return (
    <div className="screen">
      <header className="thead rise">
        <div>
          <p className="thead__greeting">{greeting()}</p>
          <div className="thead__brand">
            <h1 className="thead__word">tally</h1>
          </div>
          <p className="thead__date">{dateLabel()}</p>
        </div>
        <div className="thead__actions">
          <button className="iconbtn" type="button" onClick={onOverview} title="Overview">▦</button>
          <button className="iconbtn" type="button" onClick={onHelp} title="How it works">?</button>
          <button className="iconbtn" type="button" onClick={onTheme} title="Appearance">◑</button>
          <button className="iconbtn iconbtn--accent" type="button" onClick={onNew}>+ New</button>
        </div>
      </header>

      <div className="masthead rise" aria-hidden="true">
        <span className="masthead__rule" />
        <TallyMark count={5} h={12} w={1.8} style={{ color: 'var(--accent)' }} />
        <span className="masthead__rule" />
      </div>

      <QuoteBanner />

      {due.length > 0 && (
        <div className="daystat rise" style={{ animationDelay: '40ms' }}>
          <ProgressRing pct={agg.pct} />
          <div className="daystat__meta">
            <span className="daystat__label"><b>{agg.done}</b> of <b>{agg.total}</b> done today</span>
            <div className="daystat__dots">
              {agg.items.map((it) => (
                <span key={it.habit.id} className={'daystat__dot' + (it.isDone ? ' is-done' : it.isMiss ? ' is-miss' : '')}
                  style={{ '--accent': inkMap[it.habit.id] || it.habit.color, borderColor: inkMap[it.habit.id] || it.habit.color, background: it.isDone ? (inkMap[it.habit.id] || it.habit.color) : 'transparent' }} />
              ))}
            </div>
          </div>
        </div>
      )}

      {groups.map((g, gi) => (
        <section className="group" key={g.tod} style={{ animationDelay: 60 + gi * 30 + 'ms' }}>
          <div className="group__label">{TOD[g.tod].label}<span className="group__count">{g.items.length}</span></div>
          <ul className="cards">
            {g.items.map((h) => (
              <HabitCard key={h.id} habit={h} completions={completions} onOpen={onOpen} setCompletion={setCompletion} ink={inkMap[h.id]}
                softened={completedMode === 'soften' && isDoneToday(h)} compact={completedMode === 'collapse' && isDoneToday(h)} />
            ))}
          </ul>
        </section>
      ))}
      {notDue.length > 0 && (
        <section className="group">
          <div className="group__label">Not due today<span className="group__count">{notDue.length}</span></div>
          <ul className="cards">
            {notDue.map((h) => (
              <HabitCard key={h.id} habit={h} completions={completions} onOpen={onOpen} setCompletion={setCompletion} ink={inkMap[h.id]} />
            ))}
          </ul>
        </section>
      )}
      {doneDrawer.length > 0 && (
        <section className="group">
          <button className="drawer__head" type="button" onClick={() => setDrawerOpen((o) => !o)}>
            <span>Done today</span><span className="group__count">{doneDrawer.length}</span>
            <span className="drawer__chev">{drawerOpen ? '▾' : '▸'}</span>
          </button>
          {drawerOpen && (
            <ul className="cards" style={{ marginTop: 12 }}>
              {doneDrawer.map((h) => (
                <HabitCard key={h.id} habit={h} completions={completions} onOpen={onOpen} setCompletion={setCompletion} ink={inkMap[h.id]} compact />
              ))}
            </ul>
          )}
        </section>
      )}
      {active.length === 0 && (
        <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 28, textAlign: 'center' }}>No habits yet. Tap <b>+ New</b> to add one.</p>
      )}
      <div style={{ height: 8 }} />
    </div>
  );
}

// ============================== DETAIL SCREEN ==============================
function DetailScreen({ habit, completions, setCompletion, onBack, onShare, onEdit, ink }) {
  const strength = strengthOf(habit, completions);
  const streak = streakOf(habit, completions);
  const best = longestStreak(habit, completions);
  const rate = weekRate(habit, completions);
  const grid = useM(() => yearGrid(habit, completions), [habit, completions]);
  const series = useM(() => trendSeries(habit, completions), [habit, completions]);
  const totals = (habit.type === 'count' || habit.type === 'duration') ? valueTotals(habit, completions) : null;
  const delta = series.length > 6 ? strength - series[series.length - 6] : 0;

  const schedBase = schedLabel(habit);
  const schedText = habit.type === 'duration' ? `${schedBase} · ${habit.goal} ${habit.unit} goal`
    : habit.type === 'count' ? `${schedBase} · ${habit.goal} ${habit.unit}` : schedBase;
  const planBits = [
    habit.anchor && `after ${habit.anchor}`,
    habit.plan?.time && `at ${habit.plan.time}`,
    habit.plan?.place && `@ ${habit.plan.place}`,
    habit.minimumVersion && `min: ${habit.minimumVersion}`,
  ].filter(Boolean);

  // backfill: last 7 days, tap to cycle done→skip→missed→clear
  const week = weekStates(habit, completions);
  const cycle = (cellKey, state) => {
    const order = { done: 'skip', skip: 'missed', missed: null };
    const next = state in order ? order[state] : 'done';
    setCompletion(habit.id, cellKey, next);
  };

  return (
    <div className="screen detail" style={{ '--habit': ink || habit.color }}>
      <div className="detail__bar rise">
        <button className="backbtn" type="button" onClick={onBack}>‹ Today</button>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="iconbtn" type="button" onClick={onEdit} title="Edit habit">✎</button>
          <button className="iconbtn" type="button" onClick={onShare} title="Share">✦</button>
        </div>
      </div>

      <div className="detail__head rise">
        <span className="detail__icon" aria-hidden="true">{glyph(habit, 26)}</span>
        <div>
          <div className="detail__name">{habit.name}</div>
          <p className="detail__sched">{schedText}{habit.cue ? <> · after <b>{habit.cue}</b></> : null}</p>
          {planBits.length > 0 && <p className="detail__plan">{planBits.join('  ·  ')}</p>}
        </div>
      </div>

      <div className="hero rise" style={{ animationDelay: '40ms' }}>
        <div className="hero__big">{strength}<small> /100</small></div>
        <div className="hero__cap">
          <span className="hero__caplabel">Habit strength</span>
          <span className="hero__delta">{delta >= 0 ? '▲' : '▼'} <b>{Math.abs(delta)}</b> over 6 wks</span>
        </div>
      </div>

      <div className="statgrid rise" style={{ animationDelay: '80ms' }}>
        <div className="stat"><span className="stat__v">{streak}<small>d</small></span><span className="stat__l">Current streak</span></div>
        <div className="stat"><span className="stat__v">{best}<small>d</small></span><span className="stat__l">Best ever</span></div>
        <div className="stat"><span className="stat__v">{rate == null ? '—' : rate}<small>%</small></span><span className="stat__l">This week</span></div>
      </div>

      {totals && (
        <div className="statgrid rise" style={{ animationDelay: '100ms' }}>
          {habit.type === 'duration' ? (
            <>
              <div className="stat"><span className="stat__v">{formatDuration(totals.total)}</span><span className="stat__l">Total time</span></div>
              <div className="stat"><span className="stat__v">{formatDuration(totals.avg)}</span><span className="stat__l">Per active day</span></div>
              <div className="stat"><span className="stat__v">{formatDuration(totals.week)}</span><span className="stat__l">This week</span></div>
            </>
          ) : (
            <>
              <div className="stat"><span className="stat__v">{Math.round(totals.total)}</span><span className="stat__l">Total {habit.unit}</span></div>
              <div className="stat"><span className="stat__v">{totals.avg.toFixed(1)}</span><span className="stat__l">Per active day</span></div>
              <div className="stat"><span className="stat__v">{Math.round(totals.week)}</span><span className="stat__l">This week</span></div>
            </>
          )}
        </div>
      )}

      <section className="section">
        <div className="section__title">Strength trend</div>
        <TrendChart series={series} />
      </section>

      <section className="section">
        <div className="section__title">This year<span className="group__count" style={{ fontFamily: 'var(--font-mono)' }}>{grid.cols} weeks</span></div>
        <YearHeatmap grid={grid} />
      </section>

      <section className="section">
        <div className="section__title">Backfill: tap a day you forgot to log</div>
        <div className="backfill">
          {week.map((c) => (
            <div className="bf" key={c.key}>
              <button className={`bf__dot${c.isToday ? '' : ' is-' + c.state}`} type="button"
                onClick={() => cycle(c.key, c.state)}>
                {c.state === 'done' ? '✓' : c.state === 'skip' ? '↷' : c.state === 'missed' ? '–' : ''}
              </button>
              <span className="bf__lbl"><b>{dateFromKey(c.key).getDate()}</b>{c.dow}</span>
            </div>
          ))}
        </div>
        <p className="backfill__hint">Forgiving by design. A <b>skip</b> never breaks your streak, only a real miss does.</p>
      </section>
    </div>
  );
}

// ============================ ONBOARDING SCREEN ============================
function Onboarding({ onAdd, added, onStart }) {
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
        Most trackers reset to zero the moment you slip. Tally doesn't. One missed day is an
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
          const on = added.includes(s.id);
          return (
            <button key={s.id} className={'starter' + (on ? ' is-added' : '')} type="button"
              style={{ '--sc': s.color }} onClick={() => onAdd(s.id)}>
              <span className="starter__ic" aria-hidden="true">{glyph(s, 18)}</span>
              <span className="starter__n">{s.name}</span>
              <span className="starter__plus">{on ? '✓' : '+'}</span>
            </button>
          );
        })}
      </div>

      <button className="onb__cta rise" type="button" disabled={added.length === 0} onClick={onStart}>
        {added.length === 0 ? 'Choose at least one' : `Start tracking ${added.length} habit${added.length > 1 ? 's' : ''}`} →
      </button>
      <button className="onb__skip" type="button" onClick={onStart}>Skip. I'll add my own</button>
      <div style={{ height: 20 }} />
    </div>
  );
}

// ============================== SHARE CARD ================================
function ShareCard({ habits, completions, onClose }) {
  const stats = useM(() => yearStats(habits, completions), [habits, completions]);
  // a combined heatmap: pick the strongest habit for the showcase
  const strongest = useM(() => habits.map((h) => ({ h, s: strengthOf(h, completions) }))
    .sort((a, b) => b.s - a.s)[0]?.h || habits[0], [habits, completions]);
  const grid = useM(() => yearGrid(strongest, completions), [strongest, completions]);
  const year = dateFromKey(todayKey()).getFullYear();

  return (
    <div className="share">
      <div className="share__scrim" onClick={onClose} />
      <button className="share__close" type="button" onClick={onClose}>✕</button>
      <div className="share__wrap">
        <div className="card">
          <div className="card__top">
            <span className="card__brand">tally <TallyMark count={5} h={15} w={2} style={{ color: 'var(--accent)' }} /></span>
            <span className="card__year">{year} IN REVIEW</span>
          </div>
          <h2 className="card__head">You showed up <b>{stats.activeDays} days</b> this year, and got back up every time.</h2>
          <div className="card__heat"><YearHeatmap grid={grid} cell={9} gap={2.5} /></div>
          <div className="card__stats">
            <div className="card__stat"><span className="card__sv">{stats.totalDone}</span><span className="card__sl">Check-ins</span></div>
            <div className="card__stat"><span className="card__sv">{stats.bestStreak}</span><span className="card__sl">Best streak</span></div>
            <div className="card__stat"><span className="card__sv">{stats.perfect}</span><span className="card__sl">Perfect days</span></div>
          </div>
          <div className="card__foot"><span>Strongest: {strongest.name}</span><span>tally.app</span></div>
        </div>
        <div className="share__actions">
          <button className="share__btn" type="button" onClick={onClose}>Close</button>
          <button className="share__btn share__btn--accent" type="button" onClick={onClose}>Share image</button>
        </div>
      </div>
    </div>
  );
}

// ============================== OVERVIEW SCREEN ==============================
function OverviewScreen({ habits, completions, onBack, onOpen, onShare, inkMap = {} }) {
  const agg = useM(() => aggToday(habits, completions), [habits, completions]);
  const grid = useM(() => aggregateYearGrid(habits, completions), [habits, completions]);
  const rows = useM(() => habits.map((h) => ({
    habit: h, strength: strengthOf(h, completions), series: trendSeries(h, completions, 30),
    done: recordOf(completions, h.id, todayKey())?.state === 'done',
  })), [habits, completions]);

  return (
    <div className="screen">
      <div className="overview__bar rise">
        <button className="backbtn" type="button" onClick={onBack}>‹ Today</button>
        <button className="iconbtn" type="button" onClick={onShare} title="Year in review">✦</button>
      </div>
      <div className="overview__title rise">Overview</div>

      <div className="overview__today rise" style={{ animationDelay: '40ms' }}>
        <span className="overview__pct">{agg.total ? agg.pct + '%' : '—'}</span>
        <div className="daystat__meta">
          <span className="daystat__label"><b>{agg.done}</b> of <b>{agg.total}</b> done today</span>
          <div className="daystat__dots">
            {agg.items.map((it) => (
              <span key={it.habit.id} className={'daystat__dot' + (it.isDone ? ' is-done' : it.isMiss ? ' is-miss' : '')}
                style={{ borderColor: inkMap[it.habit.id] || it.habit.color, background: it.isDone ? (inkMap[it.habit.id] || it.habit.color) : 'transparent' }} />
            ))}
          </div>
        </div>
      </div>

      <section className="section rise" style={{ animationDelay: '80ms' }}>
        <div className="section__title">All habits · last 12 months</div>
        <YearHeatmap grid={grid} />
      </section>

      <section className="section rise" style={{ animationDelay: '110ms' }}>
        <div className="section__title">Habits<span className="overview__count">{habits.length}</span></div>
        <ul className="overview__list">
          {rows.map(({ habit, strength, series }) => (
            <li key={habit.id}>
              <button className="ovrow" type="button" style={{ '--c': inkMap[habit.id] || habit.color }} onClick={() => onOpen(habit.id)}>
                <span className="ovrow__ic">{glyph(habit, 18)}</span>
                <span className="ovrow__name">{habit.name}</span>
                <Sparkline series={series} color={inkMap[habit.id] || habit.color} />
                <span className="ovrow__str">{strength}</span>
                <span className="ovrow__chev">›</span>
              </button>
            </li>
          ))}
        </ul>
      </section>
      <div style={{ height: 8 }} />
    </div>
  );
}

Object.assign(window, { TodayScreen, DetailScreen, Onboarding, ShareCard, OverviewScreen });
