import { getUserFromReq } from "../../../lib/auth"
import { adminSupabase } from "../../../lib/admin-supabase"

// Admin management of the crowd-sourced / imported channel library
// (shared_channels). Built-in channels live in code (lib/channels.js).
// Keyed by (name, stream_url) which is the table's upsert conflict target.
export default async function handler(req, res) {
  const session = getUserFromReq(req)
  if (!session?.isAdmin) return res.status(403).json({ error: "Admin access required." })
  if (!adminSupabase) return res.status(503).json({ error: "Service temporarily unavailable. Please try again shortly." })

  if (req.method === "GET") {
    const { data, error } = await adminSupabase
      .from("shared_channels")
      .select("name, stream_url, group_name, logo, country")
      .order("added_at", { ascending: false })
      .limit(500)
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ channels: data || [] })
  }

  if (req.method === "POST") {
    const { name, url, group } = req.body || {}
    if (!name || !url) return res.status(400).json({ error: "Channel name and stream URL are required." })
    const { error } = await adminSupabase
      .from("shared_channels")
      .upsert({ name, stream_url: url, group_name: group || "General" }, { onConflict: "stream_url,name", ignoreDuplicates: true })
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ success: true })
  }

  if (req.method === "DELETE") {
    const { name, url } = req.body || {}
    if (!name || !url) return res.status(400).json({ error: "name and url required" })
    const { error } = await adminSupabase
      .from("shared_channels")
      .delete()
      .eq("name", name)
      .eq("stream_url", url)
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ success: true })
  }

  return res.status(405).json({ error: "Method not allowed" })
}
