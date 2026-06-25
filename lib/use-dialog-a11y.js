import { useEffect, useRef } from "react"

// Accessible dialog behaviour: focus the dialog on open, trap Tab within it,
// close on Escape, and restore focus to the trigger on close. Attach the
// returned ref + onKeyDown to the dialog content element (give it tabIndex={-1},
// role="dialog", aria-modal="true").
const FOCUSABLE =
  'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])'

export function useDialogA11y(active, onClose) {
  const ref = useRef(null)

  useEffect(() => {
    if (!active) return
    const prev = typeof document !== "undefined" ? document.activeElement : null
    const node = ref.current
    if (node) {
      const first = node.querySelector(FOCUSABLE)
      ;(first || node).focus()
    }
    return () => {
      if (prev && typeof prev.focus === "function") prev.focus()
    }
  }, [active])

  const onKeyDown = (e) => {
    if (e.key === "Escape") {
      e.stopPropagation()
      onClose?.()
      return
    }
    if (e.key === "Tab" && ref.current) {
      const list = Array.from(ref.current.querySelectorAll(FOCUSABLE))
      if (list.length === 0) return
      const i = list.indexOf(document.activeElement)
      if (e.shiftKey && i <= 0) {
        e.preventDefault()
        list[list.length - 1].focus()
      } else if (!e.shiftKey && i === list.length - 1) {
        e.preventDefault()
        list[0].focus()
      }
    }
  }

  return { ref, onKeyDown }
}
