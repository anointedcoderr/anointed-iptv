import { supabase } from "../../lib/supabase";

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
  if (!supabase) return res.status(200).json({ channels: [], count: 0 });

  try {
    // Fetch all shared channels using pagination
    let allData = [];
    let from = 0;
    const pageSize = 1000;

    while (true) {
      const { data, error } = await supabase
        .from("shared_channels")
        .select("name, stream_url, group_name, logo, country")
        .order("added_at", { ascending: false })
        .range(from, from + pageSize - 1);

      if (error) throw error;
      if (!data || data.length === 0) break;

      allData = allData.concat(data);
      if (data.length < pageSize) break; // last page
      from += pageSize;
    }

    const channels = allData.map((c, i) => ({
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