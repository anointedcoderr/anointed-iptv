async function fetchM3U(url) {
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0", Accept: "*/*" },
    redirect: "follow",
  });
  if (!res.ok) throw new Error(`Failed to fetch M3U (${res.status})`);
  return res.text();
}

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

  try {
    if (!text && url) text = await fetchM3U(url);
    if (!text) return res.status(400).json({ error: "Provide a URL or M3U content." });

    const channels = parseM3U(text);
    if (!channels.length) return res.status(400).json({ error: "No channels found in this playlist." });

    // Return channels immediately to the client
    // Client will separately call /api/save-channels to persist them
    return res.status(200).json({
      channels,
      count: channels.length,
      sourceUrl: url || null,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message || "Import failed." });
  }
}