// Synthetic, deterministic EPG (program guide). A real deployment would ingest
// XMLTV and map by tvg-id; for this demo we generate a stable schedule per
// channel so the guide is believable and consistent across renders/devices.
// Clearly labelled as demo data in the UI.

const POOLS = {
  News: ["World News", "Top Stories", "The Brief", "Global Report", "Business Hour", "Headlines", "In Depth", "The Agenda"],
  Documentary: ["Planet Earth", "Deep Space", "Hidden Worlds", "Wild Frontiers", "The Universe", "Ocean Giants", "Ancient Empires"],
  Music: ["Top Hits", "Classic Concert", "Live Sessions", "The Chart Show", "Acoustic Hour", "Anthems"],
  Kids: ["Cartoon Time", "Story Hour", "Adventure Club", "Animation Fun", "Little Explorers"],
  Business: ["Market Watch", "Closing Bell", "The Exchange", "Money Talks", "Startup Stories"],
  Lifestyle: ["Travel Diaries", "Kitchen Table", "Home & Style", "Wellness Hour", "The Escape"],
  Culture: ["Arts Today", "On Stage", "The Gallery", "Nature Calm", "World Tour"],
  Demo: ["Reference Stream", "Test Pattern", "Playback Check", "Loop Showcase"],
  default: ["Now Showing", "Featured Programme", "Prime Time", "The Main Event", "On Air Now"],
}

const HALF_HOUR = 30 * 60 * 1000
const DURATIONS = [HALF_HOUR, 2 * HALF_HOUR, 3 * HALF_HOUR] // 30 / 60 / 90 min

function hash(str) {
  let h = 5381
  for (let i = 0; i < str.length; i++) h = (h * 33) ^ str.charCodeAt(i)
  return h >>> 0
}

function dayStart(ms) {
  const d = new Date(ms)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

// Deterministic programmes for the UTC-local day containing `ms`.
export function programmesForDay(channel, ms) {
  const cid = channel?.cid || channel?.name || "ch"
  const group = channel?.group || "default"
  const pool = POOLS[group] || POOLS.default
  const start0 = dayStart(ms)
  const out = []
  let t = start0
  let i = 0
  while (t < start0 + 24 * 60 * 60 * 1000) {
    const seed = hash(`${cid}|${start0}|${i}`)
    const dur = DURATIONS[seed % DURATIONS.length]
    const title = pool[(seed >>> 4) % pool.length]
    out.push({ title, start: t, stop: t + dur })
    t += dur
    i++
  }
  return out
}

// Programmes overlapping [fromMs, toMs] (spans across the day boundary).
export function getProgrammes(channel, fromMs, toMs) {
  const days = new Set([dayStart(fromMs), dayStart(toMs)])
  let all = []
  for (const d of days) all = all.concat(programmesForDay(channel, d))
  all.sort((a, b) => a.start - b.start)
  return all.filter((p) => p.stop > fromMs && p.start < toMs)
}

export function nowNext(channel, nowMs) {
  const list = getProgrammes(channel, nowMs - 4 * HALF_HOUR, nowMs + 8 * HALF_HOUR)
  const now = list.find((p) => p.start <= nowMs && p.stop > nowMs) || null
  const next = list.find((p) => p.start > nowMs) || null
  return { now, next }
}

export function fmtTime(ms) {
  const d = new Date(ms)
  let h = d.getHours()
  const m = d.getMinutes().toString().padStart(2, "0")
  const ap = h >= 12 ? "PM" : "AM"
  h = h % 12 || 12
  return `${h}:${m} ${ap}`
}
