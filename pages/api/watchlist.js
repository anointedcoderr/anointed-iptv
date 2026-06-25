import { getUserFromReq } from "../../lib/auth"
import { adminSupabase } from "../../lib/admin-supabase"

// Persists a signed-in user's watchlist to iptv_user_watchlist (channel_id is
// text so built-in numeric ids and imported/shared string ids coexist).
export default async function handler(req, res) {
  if (!adminSupabase) return res.status(503).json({ error: "Database not configured." })
  const session = getUserFromReq(req)
  if (!session?.id) return res.status(401).json({ error: "Sign in to use your watchlist." })

  if (req.method === "GET") {
    const { data, error } = await adminSupabase
      .from("iptv_user_watchlist")
      .select("channel_id")
      .eq("user_id", session.id)
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ channelIds: (data || []).map((d) => String(d.channel_id)) })
  }

  if (req.method === "POST") {
    const { channelId, action } = req.body || {}
    if (!channelId) return res.status(400).json({ error: "channelId required" })
    const id = String(channelId)

    if (action === "remove") {
      const { error } = await adminSupabase
        .from("iptv_user_watchlist")
        .delete()
        .eq("user_id", session.id)
        .eq("channel_id", id)
      if (error) return res.status(500).json({ error: error.message })
      return res.status(200).json({ action: "removed", channelId: id })
    }

    const { error } = await adminSupabase
      .from("iptv_user_watchlist")
      .upsert({ user_id: session.id, channel_id: id }, { onConflict: "user_id,channel_id", ignoreDuplicates: true })
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ action: "added", channelId: id })
  }

  return res.status(405).json({ error: "Method not allowed" })
}
