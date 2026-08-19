import { getUserFromReq } from "../../../lib/auth"
import { adminSupabase } from "../../../lib/admin-supabase"

// Admin user management. Cookie-JWT auth (matches /api/admin/stats and the UI).
// GET = list, PATCH = update is_admin/is_verified, DELETE = remove.
export default async function handler(req, res) {
  const session = getUserFromReq(req)
  if (!session?.isAdmin) return res.status(403).json({ error: "Admin access required." })
  if (!adminSupabase) return res.status(503).json({ error: "Service temporarily unavailable. Please try again shortly." })

  if (req.method === "GET") {
    const { data, error } = await adminSupabase
      .from("iptv_users")
      .select("id, email, name, is_admin, is_verified, created_at")
      .order("created_at", { ascending: false })
      .limit(500)
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ users: data || [] })
  }

  if (req.method === "PATCH") {
    const { userId, is_admin, is_verified } = req.body || {}
    if (!userId) return res.status(400).json({ error: "userId required" })
    const patch = {}
    if (typeof is_admin === "boolean") patch.is_admin = is_admin
    if (typeof is_verified === "boolean") patch.is_verified = is_verified
    if (Object.keys(patch).length === 0) return res.status(400).json({ error: "Nothing to update" })
    const { error } = await adminSupabase.from("iptv_users").update(patch).eq("id", userId)
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ success: true })
  }

  if (req.method === "DELETE") {
    const { userId } = req.body || {}
    if (!userId) return res.status(400).json({ error: "userId required" })
    if (String(userId) === String(session.id)) {
      return res.status(400).json({ error: "You cannot delete your own account here." })
    }
    const { error } = await adminSupabase.from("iptv_users").delete().eq("id", userId)
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ success: true })
  }

  return res.status(405).json({ error: "Method not allowed" })
}
