import bcrypt from "bcryptjs"
import { getUserFromReq } from "../../../lib/auth"
import { adminSupabase } from "../../../lib/admin-supabase"
import { validateNewPassword } from "../../../lib/validate"

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" })
  const session = getUserFromReq(req)
  if (!session?.id) return res.status(401).json({ error: "Sign in first." })
  if (!adminSupabase) return res.status(503).json({ error: "Service temporarily unavailable. Please try again shortly." })

  const { currentPassword, newPassword } = req.body || {}
  const check = validateNewPassword(newPassword)
  if (!check.ok) return res.status(400).json({ error: check.error })

  const { data: user } = await adminSupabase
    .from("iptv_users")
    .select("password_hash")
    .eq("id", session.id)
    .single()
  if (!user) return res.status(404).json({ error: "Account not found." })

  const ok = await bcrypt.compare(currentPassword || "", user.password_hash)
  if (!ok) return res.status(401).json({ error: "Current password is incorrect." })

  const hash = await bcrypt.hash(newPassword, 12)
  const { error } = await adminSupabase.from("iptv_users").update({ password_hash: hash }).eq("id", session.id)
  if (error) return res.status(500).json({ error: error.message })
  return res.status(200).json({ success: true })
}
