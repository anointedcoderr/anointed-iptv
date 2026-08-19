import crypto from "crypto"
import { getUserFromReq } from "../../../lib/auth"
import { adminSupabase } from "../../../lib/admin-supabase"
import { sendVerificationEmail } from "../../../lib/send-email"

// Regenerates a verify token for the signed-in user and re-sends the email,
// so the (only) unlock path can never dead-end.
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" })
  const session = getUserFromReq(req)
  if (!session?.id) return res.status(401).json({ error: "Sign in first." })
  if (!adminSupabase) return res.status(503).json({ error: "Service temporarily unavailable. Please try again shortly." })

  const { data: user } = await adminSupabase
    .from("iptv_users")
    .select("id, email, is_verified")
    .eq("id", session.id)
    .single()

  if (!user) return res.status(404).json({ error: "Account not found." })
  if (user.is_verified) return res.status(200).json({ success: true, alreadyVerified: true })

  const token = crypto.randomBytes(32).toString("hex")
  await adminSupabase.from("iptv_users").update({ verify_token: token }).eq("id", user.id)

  try {
    await sendVerificationEmail(user.email, token)
  } catch (err) {
    console.error("[resend-verification]", err)
    return res.status(502).json({ error: "Email service unavailable. Please try again later." })
  }

  return res.status(200).json({ success: true })
}
