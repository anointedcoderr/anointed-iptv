import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { ChevronDown, Check, Lock, Settings2, ShieldCheck } from "lucide-react"
import { hasPin, verifyPin } from "../lib/profiles"

export default function ProfileSwitcher({ activeProfile, profiles, onSwitch }) {
  const [open, setOpen] = useState(false)
  const [pinFor, setPinFor] = useState(null) // profile being unlocked
  const [pin, setPin] = useState("")
  const [err, setErr] = useState("")
  const ref = useRef(null)

  useEffect(() => {
    const onDoc = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false)
        setPinFor(null)
        setPin("")
        setErr("")
      }
    }
    document.addEventListener("mousedown", onDoc)
    return () => document.removeEventListener("mousedown", onDoc)
  }, [])

  const pick = (p) => {
    if (p.id === activeProfile.id) {
      setOpen(false)
      return
    }
    // Leaving a Kids profile for a non-kids one requires the parental PIN.
    if (activeProfile.kids && !p.kids && hasPin()) {
      setPinFor(p)
      setPin("")
      setErr("")
      return
    }
    onSwitch(p.id)
    setOpen(false)
  }

  const submitPin = (e) => {
    e.preventDefault()
    if (verifyPin(pin)) {
      onSwitch(pinFor.id)
      setOpen(false)
      setPinFor(null)
      setPin("")
    } else {
      setErr("Incorrect PIN")
    }
  }

  if (!activeProfile) return null

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 rounded-xl border border-border bg-muted px-2.5 py-2 text-xs font-semibold text-foreground hover:bg-accent"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <span className="h-4 w-4 rounded-full" style={{ background: activeProfile.color }} />
        <span className="hidden sm:inline">{activeProfile.name}</span>
        {activeProfile.kids && <ShieldCheck className="size-3 text-emerald-400" />}
        <ChevronDown className="size-3" />
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-xl border border-border bg-card shadow-2xl">
          {pinFor ? (
            <form onSubmit={submitPin} className="p-3">
              <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-foreground">
                <Lock className="size-3.5 text-[#a78bfa]" /> Enter parental PIN
              </div>
              <input
                type="password"
                inputMode="numeric"
                autoFocus
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                aria-label="Parental PIN"
                className="w-full rounded-lg border border-border bg-muted px-3 py-2 text-sm text-foreground focus:border-[#6d35ff] focus:outline-none"
              />
              {err && <div role="alert" className="mt-1.5 text-xs text-rose-400">{err}</div>}
              <button
                type="submit"
                className="mt-2 w-full rounded-lg bg-gradient-to-r from-[#6d35ff] to-[#2ebfff] px-3 py-2 text-xs font-bold text-white"
              >
                Unlock
              </button>
            </form>
          ) : (
            <div className="py-1.5" role="menu">
              <div className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Who's watching?
              </div>
              {profiles.map((p) => (
                <button
                  key={p.id}
                  role="menuitem"
                  onClick={() => pick(p)}
                  className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-foreground hover:bg-muted"
                >
                  <span className="h-4 w-4 rounded-full" style={{ background: p.color }} />
                  <span className="flex-1 text-left">{p.name}</span>
                  {p.kids && <ShieldCheck className="size-3.5 text-emerald-400" />}
                  {p.id === activeProfile.id && <Check className="size-3.5 text-[#a78bfa]" />}
                </button>
              ))}
              <div className="my-1 h-px bg-border" />
              <Link
                href="/account#profiles"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <Settings2 className="size-3.5" /> Manage profiles
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
