import { Info } from "lucide-react"
import { demoNotice } from "../lib/demo"

// Inline, honest "this is a demo" notice. Pass a key from lib/demo.js NOTICES.
export default function DemoNotice({ k, className = "" }) {
  const text = demoNotice(k)
  if (!text) return null
  return (
    <div
      role="note"
      className={`flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs leading-relaxed text-amber-200 ${className}`}
    >
      <Info className="mt-0.5 size-3.5 flex-shrink-0" aria-hidden="true" />
      <span>{text}</span>
    </div>
  )
}
