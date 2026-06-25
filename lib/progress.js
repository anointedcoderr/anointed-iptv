// Continue-watching store (localStorage). Pure helpers are unit-tested.
const KEY = "iptv_progress"
const MAX = 30

export function pruneProgress(list, max = MAX) {
  return [...list].sort((a, b) => b.updatedAt - a.updatedAt).slice(0, max)
}

export function upsertProgress(list, entry) {
  const rest = list.filter((e) => e.cid !== entry.cid)
  return pruneProgress([entry, ...rest])
}

function read() {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || "[]")
    return Array.isArray(v) ? v : []
  } catch {
    return []
  }
}

function write(list) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list))
  } catch {}
}

export function getProgressList() {
  return pruneProgress(read())
}

export function getProgress(cid) {
  return read().find((e) => e.cid === cid) || null
}

// position/duration in seconds; updatedAt is a caller-supplied timestamp (ms).
export function saveProgress(cid, position, duration, updatedAt) {
  if (!cid || !position || position < 5) return
  // treat as "finished" if within 30s of the end → drop it
  if (duration && duration - position < 30) {
    write(read().filter((e) => e.cid !== cid))
    return
  }
  write(upsertProgress(read(), { cid, position, duration: duration || 0, updatedAt }))
}

export function clearProgress(cid) {
  write(read().filter((e) => e.cid !== cid))
}
