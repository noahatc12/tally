// Drag-to-dismiss for bottom sheets, ported 1:1 from the handoff (modals.jsx useSheetDrag).
// Two ways to close, both ending in an animated slide-off + scrim fade, then unmount:
//   • drag the grab handle / header down past a threshold (or a fast flick)
//   • scroll the content to the top and keep pulling down (overscroll-to-close)
// Otherwise it springs back. Wiring: spread dragHandlers on the grab zone, put panelRef +
// panelStyle on .sheet__panel, scrimStyle on .sheet__scrim, and call close() for every
// dismiss path. NOTE: the touch gestures are device-only — headless renders just see the
// entrance/spring transforms; Noah is QA on the feel.

import { useEffect, useRef, useState } from 'react'

export function useSheetDrag(onClose) {
  const [dy, setDy] = useState(0)
  const [dragging, setDragging] = useState(false)
  const [closing, setClosing] = useState(false)
  const [shown, setShown] = useState(false)
  const dyRef = useRef(0)
  const closeRef = useRef(false)
  const panelRef = useRef(null)
  const set = (v) => { dyRef.current = v; setDy(v) }

  // smooth entrance: start off-screen, then settle (transition-driven)
  useEffect(() => { const id = setTimeout(() => setShown(true), 20); return () => clearTimeout(id) }, [])

  // animated dismiss: slide the panel off-screen + fade scrim, then unmount
  const close = () => {
    if (closeRef.current) return
    closeRef.current = true
    setDragging(false); setClosing(true)
    const el = panelRef.current
    const h = el ? el.getBoundingClientRect().height + 80 : 900
    set(h)
    setTimeout(onClose, 300)
  }
  const release = () => { const d = dyRef.current; if (d > 110) close(); else { setDragging(false); set(0) } }

  // explicit handle drag (pointer = mouse + touch on the grab zone)
  const hdrag = useRef(null)
  const onPointerDown = (e) => { if (closeRef.current) return; hdrag.current = { y0: e.clientY, t0: Date.now() }; setDragging(true); try { e.currentTarget.setPointerCapture(e.pointerId) } catch { /* ignore */ } }
  const onPointerMove = (e) => { if (!hdrag.current) return; const d = e.clientY - hdrag.current.y0; set(d > 0 ? d : d * 0.25) }
  const end = (e) => { if (!hdrag.current) return; const d = Math.max(0, e.clientY - hdrag.current.y0); const v = d / Math.max(1, Date.now() - hdrag.current.t0); hdrag.current = null; if (d > 110 || (d > 40 && v > 0.5)) close(); else { setDragging(false); set(0) } }
  const dragHandlers = { onPointerDown, onPointerMove, onPointerUp: end, onPointerCancel: end }

  // content overscroll-to-close — native touch listeners so preventDefault works. Normal
  // scrolling happens until the content is at the top, then a continued downward pull (even
  // within the same swipe) takes over and drags the sheet; pulling back up hands control back.
  useEffect(() => {
    const el = panelRef.current; if (!el) return undefined
    let lastY = 0, baseY = 0, captured = false, active = false
    const yOf = (e) => (e.touches && e.touches[0] ? e.touches[0].clientY : e.clientY)
    const ts = (e) => { if (closeRef.current) return; lastY = yOf(e); captured = false; active = true }
    const tm = (e) => {
      if (!active) return
      const y = yOf(e); const dInc = y - lastY; lastY = y
      if (!captured) {
        if (el.scrollTop <= 0 && dInc > 0) { captured = true; baseY = y; setDragging(true); set(0) }
        return
      }
      const d = y - baseY
      if (d <= 0) { captured = false; setDragging(false); set(0); return }
      if (e.cancelable) e.preventDefault()
      set(d)
    }
    const te = () => { if (captured) release(); active = false; captured = false }
    el.addEventListener('touchstart', ts, { passive: true })
    el.addEventListener('touchmove', tm, { passive: false })
    el.addEventListener('touchend', te, { passive: true })
    el.addEventListener('touchcancel', te, { passive: true })
    return () => { el.removeEventListener('touchstart', ts); el.removeEventListener('touchmove', tm); el.removeEventListener('touchend', te); el.removeEventListener('touchcancel', te) }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- bind listeners once on mount; release/refs stay live
  }, [])

  const ease = 'cubic-bezier(.32,.72,0,1)'
  const offscreen = !shown || closing
  const panelStyle = {
    transform: (!shown && !closing) ? 'translateY(100%)' : `translateY(${dy}px)`,
    transition: dragging ? 'none' : `transform .34s ${ease}`,
  }
  const scrimStyle = { opacity: offscreen ? 0 : 1, transition: 'opacity .34s ease' }
  return { dragHandlers, panelStyle, scrimStyle, panelRef, close }
}
