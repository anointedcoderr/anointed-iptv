import { getUserFromReq, clearSessionCookie } from "../../../lib/auth"
import { adminSupabase } from "../../../lib/admin-supabase"

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" })
  const session = getUserFromReq(req)
  if (!session?.id) return res.status(401).json({ error: "Sign in first." })
  if (!adminSupabase) return res.status(503).json({ error: "Service temporarily unavailable. Please try again shortly." })

  const { error } = await adminSupabase.from("iptv_users").delete().eq("id", session.id)
  if (error) return res.status(500).json({ error: error.message })
  clearSessionCookie(res)
  return res.status(200).json({ success: true })
}
