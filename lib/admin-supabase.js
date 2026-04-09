// Server-side Supabase client using service role key.
// Bypasses RLS — only use in API routes, never on the client.
import { createClient } from "@supabase/supabase-js"

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY

export const adminSupabase = url && key ? createClient(url, key) : null
