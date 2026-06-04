// A friendly quick-start guide for people new to the app. Pure content — explains the
// habit types, schedules, the three daily states, and the optional stickiness fields.

export default function HelpModal({ onClose }) {
  return (
    <div className="modal" role="dialog" aria-modal="true" aria-label="How it works">
      <div className="modal__backdrop" onClick={onClose} />
      <div className="modal__panel">
        <div className="modal__head">
          <h2>How it works</h2>
          <button type="button" className="btn btn--ghost btn--icon" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <div className="guide">
          <p className="guide__lead">
            Tap <strong>+ New</strong> to create a habit, then mark it each day. Missing one day
            won&apos;t reset you — only missing repeatedly does. The goal is showing up, not perfection.
          </p>

          <section className="guide__section">
            <h3>Each day, mark a habit</h3>
            <ul className="guide__list">
              <li><strong>Done</strong> — you did it. Extends your streak and raises strength.</li>
              <li><strong>Skip</strong> — a planned rest day (sick, traveling). Neutral: it never breaks your streak and doesn&apos;t count against you.</li>
              <li><strong>Miss</strong> — the only thing that breaks a streak. One miss is fine; the app just nudges you not to miss twice.</li>
            </ul>
            <p className="guide__note">
              <strong>Habit strength</strong> is a 0–100 score that rises as you show up. One miss
              dips it a little — it never crashes to zero.
            </p>
          </section>

          <section className="guide__section">
            <h3>Two kinds of habit</h3>
            <ul className="guide__list">
              <li><strong>Yes / no</strong> — a simple did-I-or-not. Example: <em>Meditate</em>.</li>
              <li>
                <strong>Measured</strong> — for habits with a number or done several times a day.
                Set a target like <em>2 times</em> or <em>8 glasses</em>, then tap ＋ to log each one.
                A single tap already keeps your streak; reaching the target marks it complete.
              </li>
            </ul>
          </section>

          <section className="guide__section">
            <h3>How often (schedule)</h3>
            <ul className="guide__list">
              <li><strong>Daily</strong> — every day.</li>
              <li><strong>Days</strong> — specific weekdays. Example: gym on <em>Mon / Wed / Fri</em>.</li>
              <li><strong>×/week</strong> — a weekly target, any days. Example: <em>run 3× a week</em>.</li>
              <li><strong>Every N</strong> — a fixed gap. Example: water plants <em>every 3 days</em>.</li>
            </ul>
          </section>

          <section className="guide__section">
            <h3>Make it stick (optional)</h3>
            <ul className="guide__list">
              <li><strong>Minimum version</strong> — your two-minute floor (e.g. “one set,” “one page”). Showing up at the minimum still counts.</li>
              <li><strong>Cue</strong> — “after [something you already do]” (e.g. <em>after morning coffee</em>).</li>
              <li><strong>Time &amp; place</strong> — when and where it happens.</li>
              <li><strong>Anchor</strong> — stack a new habit onto an existing one.</li>
            </ul>
          </section>

          <section className="guide__section">
            <h3>A few examples</h3>
            <ul className="guide__list guide__examples">
              <li><strong>Brush teeth</strong> → Measured, <em>2 times</em>, Daily.</li>
              <li><strong>Drink water</strong> → Measured, <em>8 glasses</em>, Daily.</li>
              <li><strong>Gym</strong> → Yes / no, <em>×/week 3</em>.</li>
              <li><strong>Read</strong> → Yes / no, Daily, minimum “one page.”</li>
              <li><strong>Call family</strong> → Yes / no, <em>every 7 days</em>.</li>
            </ul>
          </section>

          <p className="guide__note">
            Tip: tap <strong>🎨</strong> any time to switch themes or build your own.
          </p>
        </div>

        <div className="modal__foot">
          <button type="button" className="btn btn--accent btn--block" onClick={onClose}>
            Got it
          </button>
        </div>
      </div>
    </div>
  )
}
