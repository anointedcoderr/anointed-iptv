import { useEffect, useState } from "react"
import { Play } from "lucide-react"
import { getProgrammes, fmtTime } from "../lib/epg"
import DemoNotice from "./DemoNotice"

const HALF_HOUR = 30 * 60 * 1000
const WINDOW = 8 * HALF_HOUR // show 4 hours

function MiniLogo({ channel }) {
  const initials = (channel.name || "CH")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 3)
    .toUpperCase()
  return (
    <div
      className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-md text-[11px] font-black text-white"
      style={{ background: channel.color || "#333" }}
    >
      {initials}
    </div>
  )
}

export default function EpgGuide({ channels, onPlay }) {
  const [now, setNow] = useState(null)

  useEffect(() => {
    setNow(Date.now())
    const id = setInterval(() => setNow(Date.now()), 60 * 1000)
    return () => clearInterval(id)
  }, [])

  if (now == null) {
    return <div className="h-64 rounded-2xl glass-card" aria-hidden="true" />
  }

  const windowStart = Math.floor(now / HALF_HOUR) * HALF_HOUR
  const windowEnd = windowStart + WINDOW
  const span = windowEnd - windowStart
  const ticks = []
  for (let t = windowStart; t <= windowEnd; t += HALF_HOUR) ticks.push(t)
  const nowPct = ((now - windowStart) / span) * 100

  // Only channels with a real stream, capped for a readable guide.
  const rows = channels.filter((c) => c.url).slice(0, 40)

  return (
    <div>
      <DemoNotice k="epg" className="mb-5 max-w-2xl" />
      <div className="overflow-x-auto rounded-2xl border border-border">
        <div className="min-w-[900px]">
          {/* Time header */}
          <div className="flex border-b border-border bg-muted/40">
            <div className="w-48 flex-shrink-0 px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Channel
            </div>
            <div className="relative flex-1">
              <div className="flex">
                {ticks.slice(0, -1).map((t) => (
                  <div
                    key={t}
                    className="flex-1 border-l border-border px-2 py-2 text-[11px] font-semibold text-muted-foreground"
                  >
                    {fmtTime(t)}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Channel rows */}
          <div className="relative divide-y divide-border">
            {/* now line spanning all rows */}
            <div
              className="pointer-events-none absolute bottom-0 top-0 z-10 w-px bg-[#6d35ff]"
              style={{ left: `calc(12rem + ${(nowPct / 100)} * (100% - 12rem))` }}
              aria-hidden="true"
            >
              <div className="absolute -top-1 -left-1 h-2 w-2 rounded-full bg-[#6d35ff]" />
            </div>

            {rows.map((c) => {
              const progs = getProgrammes(c, windowStart, windowEnd)
              return (
                <div key={c.cid} className="flex hover:bg-muted/20">
                  <div className="flex w-48 flex-shrink-0 items-center gap-2 px-4 py-3">
                    <MiniLogo channel={c} />
                    <div className="min-w-0">
                      <div className="truncate text-xs font-semibold text-foreground">{c.name}</div>
                      <div className="truncate text-[11px] text-muted-foreground">{c.group}</div>
                    </div>
                  </div>
                  <div className="relative flex-1 py-2">
                    <div className="relative mx-1 h-12">
                      {progs.map((p, i) => {
                        const left = Math.max(0, ((p.start - windowStart) / span) * 100)
                        const right = Math.min(100, ((p.stop - windowStart) / span) * 100)
                        const width = Math.max(0, right - left)
                        const isNow = p.start <= now && p.stop > now
                        return (
                          <button
                            key={i}
                            onClick={() => onPlay(c)}
                            title={`${p.title} · ${fmtTime(p.start)}-${fmtTime(p.stop)}`}
                            className={`group absolute top-0 h-12 overflow-hidden rounded-lg border px-2 py-1 text-left transition-colors ${
                              isNow
                                ? "border-[#6d35ff]/50 bg-[#6d35ff]/15 hover:bg-[#6d35ff]/25"
                                : "border-border bg-muted/60 hover:bg-muted"
                            }`}
                            style={{ left: `${left}%`, width: `calc(${width}% - 4px)` }}
                          >
                            <div className="flex items-center gap-1 truncate text-[11px] font-semibold text-foreground">
                              {isNow && <Play className="size-2.5 flex-shrink-0 fill-[#a78bfa] text-[#a78bfa]" />}
                              <span className="truncate">{p.title}</span>
                            </div>
                            <div className="truncate text-[11px] text-muted-foreground">{fmtTime(p.start)}</div>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
