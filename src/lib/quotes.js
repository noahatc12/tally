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
  // General motivation, discipline, and wisdom
  { text: 'The journey of a thousand miles begins with a single step.', author: 'Lao Tzu' },
  { text: 'Whether you think you can or you think you can’t, you’re right.', author: 'Henry Ford' },
  { text: 'It always seems impossible until it’s done.', author: 'Nelson Mandela' },
  { text: 'The secret of getting ahead is getting started.', author: 'Mark Twain' },
  { text: 'Do what you can, with what you have, where you are.', author: 'Theodore Roosevelt' },
  { text: 'Well done is better than well said.', author: 'Benjamin Franklin' },
  { text: 'Quality is not an act, it is a habit.', author: 'Aristotle' },
  { text: 'It does not matter how slowly you go as long as you do not stop.', author: 'Confucius' },
  { text: 'Hard choices, easy life. Easy choices, hard life.', author: 'Jerzy Gregorek' },
  { text: 'Discipline equals freedom.', author: 'Jocko Willink' },
  { text: 'We suffer more in imagination than in reality.', author: 'Seneca' },
  { text: 'You have power over your mind — not outside events. Realize this, and you will find strength.', author: 'Marcus Aurelius' },
  { text: 'Either you run the day or the day runs you.', author: 'Jim Rohn' },
  { text: 'Comparison is the thief of joy.', author: 'Theodore Roosevelt' },
  { text: 'The best way out is always through.', author: 'Robert Frost' },
  { text: 'Energy and persistence conquer all things.', author: 'Benjamin Franklin' },
  { text: 'Start where you are. Use what you have. Do what you can.', author: 'Arthur Ashe' },
  { text: 'You miss 100% of the shots you don’t take.', author: 'Wayne Gretzky' },
  { text: 'Be so good they can’t ignore you.', author: 'Steve Martin' },
  { text: 'Little by little, one travels far.', author: 'J.R.R. Tolkien' },
  { text: 'The obstacle is the way.', author: 'Marcus Aurelius' },
  { text: 'What we fear doing most is usually what we most need to do.', author: 'Tim Ferriss' },
  { text: 'Done is better than perfect.', author: null },
  { text: 'Dream big. Start small. Act now.', author: null },
]

export function pickQuote(todayKey) {
  const i = Math.abs(diffDays('2020-01-01', todayKey)) % QUOTES.length
  return QUOTES[i]
}
