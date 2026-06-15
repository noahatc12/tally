// Horizontal swipe paging (mouse + touch via pointer events), ported 1:1 from the handoff
// (components.jsx useHSwipe). Shared-axis X transition: the current view glides out a short
// distance + fades, content swaps, the incoming view eases in from the opposite side + fades.
// Direction-locked to horizontal so vertical drags still scroll; small drags spring back.
// Spread `handlers` on the pager element and apply `style`. NOTE: a touch gesture — headless
// renders just see the static pager; Noah is QA on the feel.

import { useRef } from 'react'

export function useHSwipe({ onPrev, onNext, hasPrev, hasNext }) {
  const s = useRef({ down: false, x0: 0, y0: 0, decided: null, cur: 0, el: null, busy: false })
  const W = 460, T = 120
  const set = (el, x, op, anim, dur) => {
    if (!el) return
    el.style.transition = anim ? `transform ${dur}ms cubic-bezier(.4,0,.2,1), opacity ${dur}ms ease` : 'none'
    el.style.transform = `translateX(${x}px)`
    if (op != null) el.style.opacity = String(op)
  }
  const commit = (el, dir, cb) => {
    s.current.busy = true
    set(el, dir * T, 0, true, 175)
    setTimeout(() => {
      cb && cb()
      set(el, -dir * T, 0, false)
      requestAnimationFrame(() => {
        set(el, 0, 1, true, 250)
        setTimeout(() => { if (el) el.style.transition = ''; s.current.busy = false }, 270)
      })
    }, 180)
  }
  const down = (e) => {
    if (s.current.busy) return
    s.current = { down: true, x0: e.clientX, y0: e.clientY, decided: null, cur: 0, el: e.currentTarget, busy: false }
  }
  const move = (e) => {
    const st = s.current; if (!st.down) return
    const dX = e.clientX - st.x0, dY = e.clientY - st.y0
    if (st.decided === null) {
      if (Math.abs(dX) > 8 || Math.abs(dY) > 8) {
        st.decided = Math.abs(dX) > Math.abs(dY) ? 'h' : 'v'
        if (st.decided === 'h') { try { e.currentTarget.setPointerCapture(e.pointerId) } catch { /* ignore */ } }
      }
    }
    if (st.decided === 'h') {
      let d = dX; if ((d > 0 && !hasPrev) || (d < 0 && !hasNext)) d = Math.sign(d) * Math.pow(Math.abs(d), 0.8) * 1.3
      st.cur = d
      set(st.el, d, Math.max(0.4, 1 - Math.abs(d) / (W * 0.9)), false)
    }
  }
  const up = () => {
    const st = s.current; if (!st.down) return; st.down = false
    const el = st.el
    if (st.decided === 'h') {
      const TH = 48
      if (st.cur > TH && hasPrev) { commit(el, 1, onPrev); return }
      if (st.cur < -TH && hasNext) { commit(el, -1, onNext); return }
    }
    set(el, 0, 1, true, 260)
  }
  const handlers = { onPointerDown: down, onPointerMove: move, onPointerUp: up, onPointerCancel: up }
  const style = { transform: 'translateX(0)', touchAction: 'pan-y', willChange: 'transform, opacity', opacity: 1 }
  return { handlers, style }
}
