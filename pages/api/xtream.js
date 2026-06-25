import { buildBase, playerApiUrl, normalizeStreams } from "../../lib/xtream"

// Server-side proxy for Xtream Codes logins. Keeps provider credentials off the
// client and avoids CORS. Returns channels in our normal shape.
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" })

  const { server, username, password } = req.body || {}
  if (!server || !username || !password) {
    return res.status(400).json({ error: "Server, username and password are required." })
  }

  const base = buildBase(server)
  const headers = { "User-Agent": "AnointedIPTV/1.0", Accept: "application/json" }

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 12000)

    const info = await fetch(playerApiUrl(base, username, password), { headers, signal: controller.signal })
    const infoJson = await info.json().catch(() => null)
    if (!infoJson || infoJson.user_info?.auth === 0) {
      clearTimeout(timeout)
      return res.status(401).json({ error: "Invalid Xtream credentials or server." })
    }

    const [streamsRes, catsRes] = await Promise.all([
      fetch(playerApiUrl(base, username, password, "get_live_streams"), { headers, signal: controller.signal }),
      fetch(playerApiUrl(base, username, password, "get_live_categories"), { headers, signal: controller.signal }),
    ])
    clearTimeout(timeout)

    const streams = await streamsRes.json().catch(() => [])
    const categories = await catsRes.json().catch(() => [])

    const channels = normalizeStreams(streams, categories, base, username, password).slice(0, 2000)
    if (!channels.length) return res.status(400).json({ error: "No live streams found for this account." })

    return res.status(200).json({ channels, count: channels.length })
  } catch (err) {
    if (err.name === "AbortError") return res.status(504).json({ error: "Provider timed out." })
    return res.status(502).json({ error: "Could not reach the Xtream provider." })
  }
}
