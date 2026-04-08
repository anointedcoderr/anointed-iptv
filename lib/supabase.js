import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Gracefully handle missing env vars during local dev / first deploy.
// The homepage still renders (channels are hardcoded); only watchlist
// persistence and M3U save-to-DB require a real Supabase project.
export const supabase =
  supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null
