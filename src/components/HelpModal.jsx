// A friendly quick-start guide for people new to the app. Pure content — explains the
// three daily states, habit kinds, schedules, and the stickiness fields. Ported 1:1 from
// the handoff (modals.jsx HelpSheet) so tally.css styles it as a bottom sheet; scroll-lock
// is kept (a real-device necessity the prototype doesn't need).

import { useScrollLock } from '../hooks/useScrollLock.js'

export default function HelpModal({ onClose }) {
  useScrollLock()
  return (
    <div className="sheet" role="dialog" aria-modal="true" aria-label="How it works">
      <div className="sheet__scrim" onClick={onClose} />
      <div className="sheet__panel">
        <div className="sheet__grab" />
        <div className="sheet__head">
          <span className="sheet__title">How it works</span>
          <button type="button" className="sheet__x" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <p className="guide__lead">
          Tap <b>+ New</b> to create a habit, then mark it each day. Missing one day won&apos;t
          reset you; only missing repeatedly does. The goal is showing up, not perfection.
        </p>

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
            <li><b>Every day</b> · <b>Weekdays</b> · <b>Every N</b> days · <b>× / week</b>, a weekly target on any days.</li>
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
          <button type="button" className="btnp btnp--accent" onClick={onClose}>Got it</button>
        </div>
      </div>
    </div>
  )
}
