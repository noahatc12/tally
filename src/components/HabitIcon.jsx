// A habit's glyph: its chosen Lucide icon, drawn with stroke=currentColor so it takes the
// habit's ink from the surrounding tile. Falls back to a serif monogram of the first letter
// when no (or an unknown) iconName is set — so older habits and quick adds still look intentional.

import { createElement } from 'react'
import { iconComponent } from '../lib/icons.js'

export default function HabitIcon({ habit, size = 22 }) {
  const Icon = iconComponent(habit.iconName)
  if (Icon) return createElement(Icon, { size, strokeWidth: 2.1, 'aria-hidden': 'true' })
  const letter = (habit.name || '').trim().charAt(0).toUpperCase() || '·'
  return (
    <span className="habit-monogram" aria-hidden="true">
      {letter}
    </span>
  )
}
