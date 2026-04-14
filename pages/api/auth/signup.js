import bcrypt from "bcryptjs"
import crypto from "crypto"
import { adminSupabase } from "../../../lib/admin-supabase"
import { signToken, setSessionCookie } from "../../../lib/auth"
import { sendVerificationEmail } from "../../../lib/send-email"

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" })
  if (!adminSupabase) return res.status(503).json({ error: "Database not configured." })

  const { email, password, name } = req.body || {}
  if (!email || !password) return res.status(400).json({ error: "Email and password required." })
  if (password.length < 6) return res.status(400).json({ error: "Password must be at least 6 characters." })

  const cleanEmail = email.trim().toLowerCase()

  // Check existing
  const { data: existing } = await adminSupabase
    .from("iptv_users")
    .select("id")
    .eq("email", cleanEmail)
    .single()

  if (existing) return res.status(409).json({ error: "An account with this email already exists." })

  const passwordHash = await bcrypt.hash(password, 12)
  const verifyToken = crypto.randomBytes(32).toString("hex")

  const { data: user, error } = await adminSupabase
    .from("iptv_users")
    .insert({
      email: cleanEmail,
      password_hash: passwordHash,
      name: name || null,
      verify_token: verifyToken,
    })
    .select("id, email, name, is_verified, is_admin")
    .single()

  if (error) return res.status(500).json({ error: error.message })

  // Send verification email (fire and forget — don't block signup)
  sendVerificationEmail(cleanEmail, verifyToken).catch(console.error)

  // Notify admin panel (owner email + 15-min follow-up + push)
  fetch("https://admin.anointedcoder.com/api/demo-signup", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-admin-secret": process.env.ADMIN_API_SECRET || "" },
    body: JSON.stringify({ demoSlug: "anointed-iptv", userEmail: cleanEmail, username: name || null }),
  }).catch((err) => console.error("[demo-signup notify]", err))

  // Log the user in immediately (but they'll be unverified until they click the link)
  const jwt = signToken({ id: user.id, email: user.email, isAdmin: user.is_admin })
  setSessionCookie(res, jwt)

  return res.status(201).json({ user })
}
