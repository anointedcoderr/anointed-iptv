import { supabase } from "../../lib/supabase";

export default async function handler(req, res) {
  if (!supabase) return res.status(503).json({ error: "Supabase not configured." });

  const { userId } = req.method === "GET" ? req.query : req.body;

  if (!userId) return res.status(400).json({ error: "userId required" });

  // GET — fetch user's saved channels
  if (req.method === "GET") {
    const { data, error } = await supabase
      .from("watchlist")
      .select("channel_id")
      .eq("user_id", userId);

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ channelIds: data.map(d => d.channel_id) });
  }

  // POST — toggle a channel (add if not saved, remove if already saved)
  if (req.method === "POST") {
    const { channelId } = req.body;
    if (!channelId) return res.status(400).json({ error: "channelId required" });

    // Check if already saved
    const { data: existing } = await supabase
      .from("watchlist")
      .select("id")
      .eq("user_id", userId)
      .eq("channel_id", channelId)
      .single();

    if (existing) {
      // Already saved — remove it
      await supabase
        .from("watchlist")
        .delete()
        .eq("user_id", userId)
        .eq("channel_id", channelId);

      return res.status(200).json({ action: "removed", channelId });
    } else {
      // Not saved yet — add it
      await supabase
        .from("watchlist")
        .insert({ user_id: userId, channel_id: channelId });

      return res.status(200).json({ action: "added", channelId });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}