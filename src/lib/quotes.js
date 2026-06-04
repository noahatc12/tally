// A daily rotating motivational line. Chosen deterministically by the date so it is
// stable through the day and changes each day (not random per render). Kept tasteful
// and consistency-themed — no guilt, on-brand with the forgiving model.

import { diffDays } from './dates.js'

export const QUOTES = [
  { text: 'You do not rise to the level of your goals. You fall to the level of your systems.', author: 'James Clear' },
  { text: 'We are what we repeatedly do. Excellence, then, is not an act, but a habit.', author: 'Will Durant' },
  { text: 'Every action is a vote for the person you wish to become.', author: 'James Clear' },
  { text: 'Missing once is an accident. Missing twice is the start of a new habit.', author: 'James Clear' },
  { text: 'What you do every day matters more than what you do once in a while.', author: 'Gretchen Rubin' },
  { text: 'Consistency beats intensity.', author: null },
  { text: 'Small habits don’t add up. They compound.', author: null },
  { text: 'Progress, not perfection.', author: null },
  { text: 'Show up — especially on the days you don’t feel like it.', author: null },
  { text: 'A year from now, you’ll be glad you started today.', author: null },
  { text: 'Be patient with yourself. Habits take months, not days.', author: null },
  { text: 'Tiny gains, repeated, become remarkable.', author: null },
  { text: 'Motivation gets you started. Habit keeps you going.', author: null },
  { text: 'If you break the chain, just start a new one. No drama.', author: null },
  { text: 'Discipline is choosing what you want most over what you want now.', author: null },
  { text: 'The smallest step in the right direction still counts.', author: null },
  { text: 'Fall down seven times, stand up eight.', author: 'Japanese proverb' },
  { text: 'You’re not behind. You’re building.', author: null },
]

export function pickQuote(todayKey) {
  const i = Math.abs(diffDays('2020-01-01', todayKey)) % QUOTES.length
  return QUOTES[i]
}
