import bcrypt from "bcryptjs"
import { adminSupabase } from "../../../lib/admin-supabase"
import { signToken, setSessionCookie } from "../../../lib/auth"

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" })
  if (!adminSupabase) return res.status(503).json({ error: "Database not configured." })

  const { email, password } = req.body || {}
  if (!email || !password) return res.status(400).json({ error: "Email and password required." })

  const { data: user, error } = await adminSupabase
    .from("iptv_users")
    .select("id, email, name, password_hash, is_verified, is_admin")
    .eq("email", email.trim().toLowerCase())
    .single()

  if (error || !user) return res.status(401).json({ error: "Invalid email or password." })

  const valid = await bcrypt.compare(password, user.password_hash)
  if (!valid) return res.status(401).json({ error: "Invalid email or password." })

  const jwt = signToken({ id: user.id, email: user.email, isAdmin: user.is_admin })
  setSessionCookie(res, jwt)

  return res.status(200).json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      is_verified: user.is_verified,
      is_admin: user.is_admin,
    },
  })
}
