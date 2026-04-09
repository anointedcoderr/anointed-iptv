import { getUserFromReq } from "../../../lib/auth"
import { adminSupabase } from "../../../lib/admin-supabase"

export default async function handler(req, res) {
  const user = getUserFromReq(req)
  if (!user?.isAdmin) return res.status(403).json({ error: "Admin access required." })
  if (!adminSupabase) return res.status(503).json({ error: "Database not configured." })

  if (req.method === "GET") {
    const { data, error } = await adminSupabase
      .from("iptv_users")
      .select("id, email, name, is_verified, is_admin, created_at")
      .order("created_at", { ascending: false })

    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ users: data })
  }

  if (req.method === "PATCH") {
    const { userId, is_admin } = req.body || {}
    if (!userId) return res.status(400).json({ error: "userId required." })

    const updates = {}
    if (typeof is_admin === "boolean") updates.is_admin = is_admin

    const { error } = await adminSupabase
      .from("iptv_users")
      .update(updates)
      .eq("id", userId)

    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ success: true })
  }

  return res.status(405).json({ error: "Method not allowed" })
}
