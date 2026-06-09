// Year-in-review share card, ported 1:1 from the handoff (screens.jsx ShareCard) so tally.css
// styles it exactly: a framed card with the brand mark, the "you showed up N days" headline, the
// strongest habit's year heatmap, three stat columns, and the share/close actions. Data comes from
// our store via proto-adapters. Opened from Detail / Overview's ✦ button.

import { useMemo } from 'react'
import { useHabitsContext } from '../context/habits-store.js'
import { useScrollLock } from '../hooks/useScrollLock.js'
import { todayKey, dateFromKey, yearStats, yearGrid, strengthOf } from '../lib/proto-adapters.js'
import { TallyMark, YearHeatmap } from './tally/widgets.jsx'

export default function ShareCard({ onClose }) {
  useScrollLock()
  const { habits, completions } = useHabitsContext()
  const today = todayKey()
  const active = useMemo(() => habits.filter((h) => !h.archived), [habits])
  const stats = useMemo(() => yearStats(active, completions, today), [active, completions, today])
  // Showcase the strongest habit's heatmap (the prototype's choice).
  const strongest = useMemo(
    () => active.map((h) => ({ h, s: strengthOf(h, completions, today) })).sort((a, b) => b.s - a.s)[0]?.h || active[0],
    [active, completions, today],
  )
  const grid = useMemo(() => (strongest ? yearGrid(strongest, completions, today) : null), [strongest, completions, today])
  const year = dateFromKey(today).getFullYear()

  if (!strongest) return null

  // The prototype stubs export to a no-op; share the achievement via the native sheet where
  // available (clipboard fallback). True image export is a future enhancement.
  const onShare = async () => {
    const text = `I showed up ${stats.activeDays} days this year on Tally — ${stats.totalDone} check-ins, best streak ${stats.bestStreak} days.`
    try {
      if (navigator.share) { await navigator.share({ title: 'My year on Tally', text }); return }
      if (navigator.clipboard) await navigator.clipboard.writeText(text)
    } catch { /* user dismissed the share sheet — no-op */ }
  }

  return (
    <div className="share" role="dialog" aria-modal="true" aria-label="Year in review">
      <div className="share__scrim" onClick={onClose} />
      <button className="share__close" type="button" onClick={onClose} aria-label="Close">✕</button>
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
          <button className="share__btn share__btn--accent" type="button" onClick={onShare}>Share image</button>
        </div>
      </div>
    </div>
  )
}
