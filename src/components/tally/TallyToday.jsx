// Today screen, ported 1:1 from the handoff (screens.jsx) so tally.css styles it exactly:
// masthead head + tally-rule, pull-quote, the day-progress band (ring + dots), and habit
// cards grouped by time of day. Data + mutations come from our store via proto-adapters.

import { useMemo, useState } from 'react'
import { useHabitsContext } from '../../context/habits-store.js'
import { pickQuote } from '../../lib/quotes.js'
import {
  todayKey, toUiHabit, recordOf, strengthOf, streakOf, weekStates, weekRate,
  trailingMisses, aggToday, isDue,
} from '../../lib/proto-adapters.js'
import { buildInkMap } from '../../lib/directions.js'
import {
  Glyph, TallyMark, ProgressRing, StrengthMeter, StreakBadge, WeekDots,
  ThreeState, CountControl, TimerControl,
} from './widgets.jsx'
import HabitFormModal from '../HabitFormModal.jsx'
import HelpModal from '../HelpModal.jsx'
import ThemeModal from '../ThemeModal.jsx'

const TOD = {
  morning: { label: 'Morning' },
  afternoon: { label: 'Afternoon' },
  evening: { label: 'Evening' },
  anytime: { label: 'Anytime' },
}
const TOD_ORDER = ['morning', 'afternoon', 'evening', 'anytime']

function greeting() {
  const h = new Date().getHours()
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'
}

function HabitCard({ habit, completions, today, onOpen, ink, softened, compact }) {
  const { setCompletion, clearCompletion, setValue } = useHabitsContext()
  const ui = toUiHabit(habit)
  const rec = recordOf(completions, habit.id, today)
  const state = rec?.state
  const strength = strengthOf(habit, completions, today)
  const streak = streakOf(habit, completions, today)
  const week = weekStates(habit, completions, today)
  const rate = weekRate(habit, completions, today)
  const tMiss = trailingMisses(habit, completions, today)
  const isDone = state === 'done'
  const showNudge = state !== 'done' && tMiss === 1
  const dimStreak = tMiss >= 2

  const setState = (st) => (st === state ? clearCompletion(habit.id, today) : setCompletion(habit.id, today, st))
  const onSetValue = (v) => setValue(habit.id, today, v, ui.goal)

  // Collapse mode: a finished habit shrinks to a single slim line (still tappable to open).
  if (compact) {
    return (
      <li className="hcard hcard--slim is-done rise" style={{ '--habit': ink || habit.color }}>
        <button className="hcard__slim" type="button" onClick={() => onOpen(habit.id)}>
          <span className="hcard__icon hcard__icon--sm" aria-hidden="true"><Glyph habit={habit} size={17} /></span>
          <span className="hcard__name slim__name">{habit.name}</span>
          <span className="slim__check">✓</span>
          {streak > 0 && <StreakBadge n={streak} dim />}
        </button>
      </li>
    )
  }

  return (
    <li className={'hcard rise' + (isDone ? ' is-done' : '') + (softened ? ' hcard--soft' : '')} style={{ '--habit': ink || habit.color }}>
      <div className="hcard__main">
        <span className="hcard__icon" aria-hidden="true"><Glyph habit={habit} size={22} /></span>
        <button className="hcard__id" type="button" onClick={() => onOpen(habit.id)}>
          <span className="hcard__name">{habit.name}</span>
          {ui.cue && <span className="hcard__cue">After <b>{ui.cue}</b></span>}
        </button>
        <span className="hcard__chev">›</span>
        <StreakBadge n={streak} dim={dimStreak} />
      </div>

      <div className="hcard__metrics"><StrengthMeter value={strength} /></div>
      <div style={{ marginTop: 14 }}><WeekDots cells={week} /></div>

      {ui.type === 'duration' ? (
        <>
          <div className="hcard__foot"><span className="pill">{rate == null ? 'new' : rate + '% this week'}</span></div>
          <TimerControl value={rec?.value} goal={ui.goal} unit={ui.unit} onSet={onSetValue} />
        </>
      ) : (
        <div className="hcard__foot">
          <span className="pill">{rate == null ? 'new' : rate + '% this week'}</span>
          {ui.type === 'count'
            ? <CountControl value={rec?.value} goal={ui.goal} unit={ui.unit} onSet={onSetValue} />
            : <ThreeState state={state} onSelect={setState} />}
        </div>
      )}

      {showNudge && <p className="hcard__nudge">One miss is an accident. Get back on track today. Never miss twice.</p>}
    </li>
  )
}

export default function TallyToday({ onOpenHabit, onOpenOverview }) {
  const { habits, completions, meta } = useHabitsContext()
  const [formOpen, setFormOpen] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)
  const [themeOpen, setThemeOpen] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const today = todayKey()

  const inkMap = useMemo(() => buildInkMap(habits, meta?.ink), [habits, meta?.ink])
  const completedMode = meta?.completed || 'soften'

  const active = useMemo(() => habits.filter((h) => !h.archived), [habits])
  const due = useMemo(() => active.filter((h) => isDue(h, today, completions)), [active, completions, today])
  const notDue = useMemo(() => active.filter((h) => !isDue(h, today, completions)), [active, completions, today])
  const agg = useMemo(() => aggToday(due, completions, today), [due, completions, today])

  // Completed-habit display: 'drawer' tucks finished habits into a collapsible section;
  // 'soften'/'collapse' keep them in place but sink them to the bottom of their group (and
  // restyle the card); 'none' (Keep) leaves order untouched.
  const isDoneToday = (h) => recordOf(completions, h.id, today)?.state === 'done'
  const drawerMode = completedMode === 'drawer'
  const visibleDue = drawerMode ? due.filter((h) => !isDoneToday(h)) : due
  const doneDrawer = drawerMode ? due.filter(isDoneToday) : []
  const sortG = (items) => (completedMode === 'none' || drawerMode) ? items
    : [...items.filter((h) => !isDoneToday(h)), ...items.filter(isDoneToday)]

  const groups = TOD_ORDER
    .map((tod) => ({ tod, items: sortG(visibleDue.filter((h) => (h.tod || 'anytime') === tod)) }))
    .filter((g) => g.items.length)

  const dateLabel = new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })

  return (
    <div className="screen">
      <header className="thead rise">
        <div>
          <p className="thead__greeting">{greeting()}{meta?.name ? `, ${meta.name}` : ''}</p>
          <div className="thead__brand"><h1 className="thead__word">tally</h1></div>
          <p className="thead__date">{dateLabel}</p>
        </div>
        <div className="thead__actions">
          <button className="iconbtn" type="button" onClick={onOpenOverview} aria-label="Overview" title="Overview">▦</button>
          <button className="iconbtn" type="button" onClick={() => setHelpOpen(true)} aria-label="How it works" title="How it works">?</button>
          <button className="iconbtn" type="button" onClick={() => setThemeOpen(true)} aria-label="Themes" title="Appearance">◑</button>
          <button className="iconbtn iconbtn--accent" type="button" onClick={() => setFormOpen(true)} aria-label="Add habit">+ New</button>
        </div>
      </header>

      <div className="masthead rise" aria-hidden="true">
        <span className="masthead__rule" />
        <TallyMark count={5} h={12} w={1.8} style={{ color: 'var(--accent)' }} />
        <span className="masthead__rule" />
      </div>

      {active.length > 0 && (
        <aside className="quote rise" style={{ animationDelay: '30ms' }}>
          <p className="quote__text">“{pickQuote(today).text}”</p>
          {pickQuote(today).author && <p className="quote__author">{pickQuote(today).author}</p>}
        </aside>
      )}

      {due.length > 0 && (
        <div className="daystat rise" style={{ animationDelay: '40ms' }}>
          <ProgressRing pct={agg.pct} />
          <div className="daystat__meta">
            <span className="daystat__label"><b>{agg.done}</b> of <b>{agg.total}</b> done today</span>
            <div className="daystat__dots">
              {agg.items.map((it) => {
                const c = inkMap[it.habit.id] || it.habit.color
                return (
                  <span key={it.habit.id} className={'daystat__dot' + (it.isDone ? ' is-done' : it.isMiss ? ' is-miss' : '')}
                    style={{ borderColor: c, background: it.isDone ? c : 'transparent' }} />
                )
              })}
            </div>
          </div>
        </div>
      )}

      {groups.map((g, gi) => (
        <section className="group" key={g.tod} style={{ animationDelay: 60 + gi * 30 + 'ms' }}>
          <div className="group__label">{TOD[g.tod].label}<span className="group__count">{g.items.length}</span></div>
          <ul className="cards">
            {g.items.map((h) => (
              <HabitCard key={h.id} habit={h} completions={completions} today={today} onOpen={onOpenHabit}
                ink={inkMap[h.id]}
                softened={completedMode === 'soften' && isDoneToday(h)}
                compact={completedMode === 'collapse' && isDoneToday(h)} />
            ))}
          </ul>
        </section>
      ))}

      {notDue.length > 0 && (
        <section className="group">
          <div className="group__label">Not due today<span className="group__count">{notDue.length}</span></div>
          <ul className="cards">
            {notDue.map((h) => (
              <HabitCard key={h.id} habit={h} completions={completions} today={today} onOpen={onOpenHabit} ink={inkMap[h.id]} />
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
                <HabitCard key={h.id} habit={h} completions={completions} today={today} onOpen={onOpenHabit} ink={inkMap[h.id]} compact />
              ))}
            </ul>
          )}
        </section>
      )}

      {active.length === 0 && (
        <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 28, textAlign: 'center' }}>
          No habits yet. Tap <b>+ New</b> to add one.
        </p>
      )}

      {formOpen && <HabitFormModal habit={null} existingHabits={active} onClose={() => setFormOpen(false)} />}
      {helpOpen && <HelpModal onClose={() => setHelpOpen(false)} />}
      {themeOpen && <ThemeModal onClose={() => setThemeOpen(false)} />}
    </div>
  )
}
