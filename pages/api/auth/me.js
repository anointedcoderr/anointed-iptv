import { getUserFromReq } from "../../../lib/auth"
import { adminSupabase } from "../../../lib/admin-supabase"

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" })

  const decoded = getUserFromReq(req)
  if (!decoded) return res.status(200).json({ user: null })
  if (!adminSupabase) return res.status(200).json({ user: null })

  const { data: user } = await adminSupabase
    .from("iptv_users")
    .select("id, email, name, is_verified, is_admin")
    .eq("id", decoded.id)
    .single()

  return res.status(200).json({ user: user || null })
}
