import { getUserFromReq } from "../../../lib/auth"
import { adminSupabase } from "../../../lib/admin-supabase"

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" })
  const user = getUserFromReq(req)
  if (!user?.isAdmin) return res.status(403).json({ error: "Admin access required." })
  if (!adminSupabase) return res.status(503).json({ error: "Database not configured." })

  const { count: totalUsers } = await adminSupabase.from("iptv_users").select("*", { count: "exact", head: true })
  const { count: verifiedUsers } = await adminSupabase.from("iptv_users").select("*", { count: "exact", head: true }).eq("is_verified", true)
  const { count: adminUsers } = await adminSupabase.from("iptv_users").select("*", { count: "exact", head: true }).eq("is_admin", true)

  return res.status(200).json({
    totalUsers: totalUsers || 0,
    verifiedUsers: verifiedUsers || 0,
    adminUsers: adminUsers || 0,
  })
}
