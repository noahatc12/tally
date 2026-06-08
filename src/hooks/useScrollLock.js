// Lock page scroll while a modal/overlay is open, so dragging in the modal can't
// scroll the page behind it. Uses the position:fixed technique because iOS Safari
// ignores body{overflow:hidden} for touch scrolling. Restores the exact scroll
// position on close. A counter supports overlapping locks (one modal over another).

import { useEffect } from 'react'

let lockCount = 0
let savedY = 0

export function useScrollLock() {
  useEffect(() => {
    if (lockCount === 0) {
      savedY = window.scrollY
      const { style } = document.body
      style.position = 'fixed'
      style.top = `-${savedY}px`
      style.left = '0'
      style.right = '0'
      style.width = '100%'
    }
    lockCount += 1

    return () => {
      lockCount -= 1
      if (lockCount === 0) {
        const { style } = document.body
        style.position = ''
        style.top = ''
        style.left = ''
        style.right = ''
        style.width = ''
        window.scrollTo(0, savedY)
      }
    }
  }, [])
}
