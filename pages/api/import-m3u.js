export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { url, content } = req.body;

  if (!url && !content) {
    return res.status(400).json({ error: "Provide either a URL or M3U content" });
  }

  try {
    let raw = content;

    if (url) {
      const response = await fetch(url, {
        headers: { "User-Agent": "StreamPulse/1.0" },
        signal: AbortSignal.timeout(15000),
      });
      if (!response.ok) throw new Error(`Failed to fetch: ${response.status}`);
      raw = await response.text();
    }

    if (!raw.trim().startsWith("#EXTM3U")) {
      return res.status(400).json({ error: "Invalid M3U format. File must start with #EXTM3U" });
    }

    const channels = parseM3U(raw);

    if (channels.length === 0) {
      return res.status(400).json({ error: "No channels found in playlist" });
    }

    return res.status(200).json({ success: true, count: channels.length, channels });

  } catch (err) {
    return res.status(500).json({ error: err.message || "Failed to import playlist" });
  }
}

function parseM3U(raw) {
  const lines = raw.split("\n").map(l => l.trim()).filter(Boolean);
  const channels = [];
  let current = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith("#EXTINF:")) {
      current = {};
      const commaIdx = line.lastIndexOf(",");
      current.name = commaIdx > -1 ? line.substring(commaIdx + 1).trim() : "Unknown Channel";
      current.group = extractAttr(line, "group-title") || "Uncategorized";
      current.logo = extractAttr(line, "tvg-logo") || "";
      current.country = extractCountryEmoji(extractAttr(line, "tvg-country") || "");

    } else if (line.startsWith("http") || line.startsWith("rtmp")) {
      if (current) {
        current.url = line;
        channels.push({
          name:    current.name,
          group:   current.group,
          country: current.country || "🌍",
          logo:    current.logo || current.name.slice(0, 4).toUpperCase(),
          color:   getColor(current.group),
          url:     current.url,
          desc:    `${current.group} channel`,
        });
        current = null;
      }
    }
  }

  return channels;
}

function getColor(group) {
  const g = (group || "").toLowerCase();
  if (g.includes("news")) return "#c8a84b";
  if (g.includes("sport")) return "#e4002b";
  if (g.includes("movie") || g.includes("film")) return "#003DA5";
  if (g.includes("entertain")) return "#8b1a7e";
  if (g.includes("doc")) return "#0b3d91";
  if (g.includes("kid") || g.includes("child")) return "#f58220";
  if (g.includes("music")) return "#ff1744";
  if (g.includes("life") || g.includes("food")) return "#006341";
  if (g.includes("sport")) return "#e4002b";
  return "#444";
}

function extractAttr(line, attr) {
  const match = line.match(new RegExp(`${attr}="([^"]*)"`, "i"));
  return match ? match[1].trim() : null;
}

function extractCountryEmoji(code) {
  if (!code || code.length !== 2) return "🌍";
  try {
    return String.fromCodePoint(
      ...[...code.toUpperCase()].map(c => 0x1F1E6 - 65 + c.charCodeAt(0))
    );
  } catch { return "🌍"; }
}