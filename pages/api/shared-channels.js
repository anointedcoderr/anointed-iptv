import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { data, error } = await supabase
      .from("shared_channels")
      .select("name, stream_url, group_name, logo, country")
      .order("added_at", { ascending: false })
      .limit(10000);

    if (error) throw error;

    const channels = (data || []).map((c, i) => ({
      id: `shared_${i}`,
      name: c.name,
      url: c.stream_url || "",
      group: c.group_name || "General",
      logo: c.logo || "",
      country: c.country || "",
      color: "#555",
    }));

    return res.status(200).json({ channels, count: channels.length });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}