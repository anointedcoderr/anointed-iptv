// Xtream Codes helpers (pure, unit-tested). The server proxy (pages/api/xtream.js)
// uses these to normalize a provider's live streams into our channel shape.

export function buildBase(server) {
  let s = (server || "").trim().replace(/\/+$/, "")
  if (!s) return ""
  if (!/^https?:\/\//i.test(s)) s = "http://" + s
  return s
}

export function streamUrl(base, user, pass, id, ext = "m3u8") {
  return `${base}/live/${encodeURIComponent(user)}/${encodeURIComponent(pass)}/${id}.${ext}`
}

export function playerApiUrl(base, user, pass, action) {
  const q = `username=${encodeURIComponent(user)}&password=${encodeURIComponent(pass)}`
  return `${base}/player_api.php?${q}${action ? `&action=${action}` : ""}`
}

export function normalizeStreams(streams, categories, base, user, pass) {
  const catMap = {}
  for (const c of categories || []) catMap[String(c.category_id)] = c.category_name
  return (streams || [])
    .filter((s) => s && s.stream_id != null)
    .map((s) => ({
      name: s.name || "Unknown",
      url: streamUrl(base, user, pass, s.stream_id),
      group: catMap[String(s.category_id)] || "Live",
      logo: s.stream_icon || "",
      country: "",
      color: "#555",
    }))
}
