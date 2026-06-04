import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useHabits } from '../../src/hooks/useHabits.js'
import { KEYS } from '../../src/lib/storage.js'

describe('useHabits', () => {
  beforeEach(() => localStorage.clear())

  it('addHabit assigns an id and createdAt and stores it', () => {
    const { result } = renderHook(() => useHabits())
    act(() => result.current.addHabit({ name: 'Read' }))
    expect(result.current.habits).toHaveLength(1)
    const h = result.current.habits[0]
    expect(h.id).toMatch(/^habit_/)
    expect(h.createdAt).toBeTruthy()
    expect(h.name).toBe('Read')
  })

  it('setCompletion records a state and persists to localStorage', () => {
    const { result } = renderHook(() => useHabits())
    let id
    act(() => {
      id = result.current.addHabit({ name: 'Read' }).id
    })
    act(() => result.current.setCompletion(id, '2026-06-04', 'done'))
    expect(result.current.completions['2026-06-04'][id]).toEqual({ state: 'done' })
    const persisted = JSON.parse(localStorage.getItem(KEYS.completions))
    expect(persisted['2026-06-04'][id].state).toBe('done')
  })

  it('toggling the same state off clears the entry', () => {
    const { result } = renderHook(() => useHabits())
    let id
    act(() => {
      id = result.current.addHabit({ name: 'Read' }).id
    })
    act(() => result.current.setCompletion(id, '2026-06-04', 'done'))
    act(() => result.current.clearCompletion(id, '2026-06-04'))
    expect(result.current.completions['2026-06-04']).toBeUndefined()
  })

  it('archiveHabit marks the habit archived', () => {
    const { result } = renderHook(() => useHabits())
    let id
    act(() => {
      id = result.current.addHabit({ name: 'Read' }).id
    })
    act(() => result.current.archiveHabit(id))
    expect(result.current.habits[0].archived).toBe(true)
  })
})
