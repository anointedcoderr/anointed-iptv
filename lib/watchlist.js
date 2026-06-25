// Pure toggle logic (unit-tested) + thin client API wrappers for the watchlist.
export function toggleId(list, id) {
  return list.includes(id) ? list.filter((x) => x !== id) : [...list, id]
}

// Returns array of channel-id strings, or null if unauthenticated / not configured.
export async function fetchWatchlist() {
  try {
    const res = await fetch("/api/watchlist")
    if (!res.ok) return null
    const data = await res.json()
    return data.channelIds || []
  } catch {
    return null
  }
}

// Best-effort persist; UI is already updated optimistically.
export async function persistToggle(channelId, action) {
  try {
    await fetch("/api/watchlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ channelId, action }),
    })
  } catch {
    /* optimistic UI already reflects the change */
  }
}
