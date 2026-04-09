import { adminSupabase } from "../../../lib/admin-supabase"
import { signToken, setSessionCookie } from "../../../lib/auth"

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" })
  if (!adminSupabase) return res.status(503).json({ error: "Database not configured." })

  const { token } = req.query
  if (!token) return res.status(400).json({ error: "Token required." })

  // Find user by verify token
  const { data: user, error } = await adminSupabase
    .from("iptv_users")
    .select("id, email, is_admin")
    .eq("verify_token", token)
    .single()

  if (error || !user) return res.status(400).json({ error: "Invalid or expired verification link." })

  // Mark verified, clear token
  await adminSupabase
    .from("iptv_users")
    .update({ is_verified: true, verify_token: null })
    .eq("id", user.id)

  // Auto-login
  const jwt = signToken({ id: user.id, email: user.email, isAdmin: user.is_admin })
  setSessionCookie(res, jwt)

  return res.status(200).json({ success: true })
}
