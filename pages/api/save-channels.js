import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Dedicated endpoint just for saving channels to DB
// Called separately from the client after import succeeds
// This gives it its own full Vercel timeout budget

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { channels, sourceUrl } = req.body || {};

  if (!channels || !Array.isArray(channels) || channels.length === 0) {
    return res.status(400).json({ error: "No channels provided." });
  }

  try {
    const rows = channels.map((c) => ({
      name: c.name || "Unknown",
      stream_url: c.url || null,
      group_name: c.group || "General",
      logo: c.logo || null,
      country: c.country || null,
      source_url: sourceUrl || null,
    }));

    let saved = 0;
    let failed = 0;
    const batchSize = 500;

    for (let i = 0; i < rows.length; i += batchSize) {
      const batch = rows.slice(i, i + batchSize);
      const { error } = await supabase
        .from("shared_channels")
        .upsert(batch, {
          onConflict: "stream_url,name",
          ignoreDuplicates: true,
        });

      if (error) {
        console.error(`Batch ${i}-${i+batchSize} failed:`, error.message);
        failed += batch.length;
      } else {
        saved += batch.length;
      }
    }

    return res.status(200).json({
      saved,
      failed,
      total: rows.length,
      message: `Saved ${saved} of ${rows.length} channels.`,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}