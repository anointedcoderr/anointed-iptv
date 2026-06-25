// Deterministic, collision-resistant channel id used for watchlist keys.
// Built-in channels keep their numeric id (as a string). Imported/shared
// channels derive a stable id from their stream URL + name so a saved
// favourite still resolves after a refresh or re-import.
function djb2(str) {
  let h = 5381
  for (let i = 0; i < str.length; i++) h = (h * 33) ^ str.charCodeAt(i)
  return (h >>> 0).toString(36)
}

export function stableChannelId(channel) {
  if (channel == null) return "ch_unknown"
  if (typeof channel.id === "number") return String(channel.id)
  if (channel.id != null && /^\d+$/.test(String(channel.id))) return String(channel.id)
  const seed = `${channel.url || ""}|${channel.name || ""}`
  return `ch_${djb2(seed)}`
}
