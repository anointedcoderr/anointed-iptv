import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

function getColor(group) {
  const map = {
    news: "#c8a84b", sports: "#e4002b", entertainment: "#8b1a7e",
    movies: "#003DA5", documentary: "#006341", kids: "#f58220",
    music: "#ff1744", lifestyle: "#ff6b00", general: "#555",
  };
  const key = (group || "").toLowerCase();
  for (const [k, v] of Object.entries(map)) if (key.includes(k)) return v;
  return "#555";
}

async function fetchM3U(url) {
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0", Accept: "*/*" },
    redirect: "follow",
  });
  if (!res.ok) throw new Error(`Failed to fetch M3U (${res.status})`);
  return res.text();
}

function parseM3U(text) {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const channels = [];
  let current = null;

  for (const line of lines) {
    if (line.startsWith("#EXTINF")) {
      const name = line.split(",").slice(1).join(",").trim() || "Unknown";
      const groupMatch = line.match(/group-title="([^"]*)"/);
      const logoMatch = line.match(/tvg-logo="([^"]*)"/);
      const countryMatch = line.match(/tvg-country="([^"]*)"/);
      current = {
        name,
        group: groupMatch?.[1]?.split(";")[0]?.trim() || "General",
        logo: logoMatch?.[1] || "",
        country: countryMatch?.[1] || "",
        color: getColor(groupMatch?.[1] || ""),
      };
    } else if (line.startsWith("http") && current) {
      channels.push({ ...current, url: line });
      current = null;
    } else if (!line.startsWith("#")) {
      current = null;
    }
  }
  return channels;
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { url, content } = req.body || {};
  let text = content;
  let sourceUrl = url || null;

  try {
    if (!text && url) text = await fetchM3U(url);
    if (!text) return res.status(400).json({ error: "Provide a URL or M3U content." });

    const channels = parseM3U(text);
    if (!channels.length) return res.status(400).json({ error: "No channels found in this playlist." });

    // Save to Supabase shared_channels (only if a URL was provided, not raw paste)
    if (sourceUrl && channels.length > 0) {
      try {
        const rows = channels.slice(0, 5000).map((c) => ({
          name: c.name,
          stream_url: c.url || null,
          group_name: c.group,
          logo: c.logo || null,
          country: c.country || null,
          source_url: sourceUrl,
        }));

        // Insert in batches of 500 to avoid timeouts
        const batchSize = 500;
        for (let i = 0; i < rows.length; i += batchSize) {
          await supabase
            .from("shared_channels")
            .upsert(rows.slice(i, i + batchSize), {
              onConflict: "stream_url,name",
              ignoreDuplicates: true,
            });
        }
      } catch (dbErr) {
        console.error("DB save error:", dbErr);
        // Don't fail the import if DB save fails
      }
    }

    return res.status(200).json({ channels, count: channels.length });
  } catch (err) {
    return res.status(500).json({ error: err.message || "Import failed." });
  }
}