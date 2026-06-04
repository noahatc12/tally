// Points / level / badges. v3 hook — signatures are frozen now so v1 can wire the
// call sites (the header can show "Level 0 / 0 pts"); v3 fills the bodies without
// touching callers.

export function computePoints() {
  return 0
}

export function computeLevel() {
  return { level: 0, pointsIntoLevel: 0, pointsForNext: 100 }
}

export function awardForCompletion(habit, dateKey, prevMeta) {
  return prevMeta
}
