import { supabase } from "../../lib/supabase";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { channelId, streamUrl } = req.body;

  if (!streamUrl) {
    return res.status(400).json({ error: "streamUrl is required" });
  }

  const result = await pingStream(streamUrl);

  // Save result to Supabase if a channelId was provided
  if (channelId) {
    await supabase.from("health_logs").insert({
      channel_id: channelId,
      status:     result.status,
      latency_ms: result.latency,
    });
  }

  return res.status(200).json(result);
}

async function pingStream(url) {
  const start = Date.now();

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(url, {
      method: "HEAD",
      signal: controller.signal,
      headers: { "User-Agent": "StreamPulse-Healthcheck/1.0" },
    });

    clearTimeout(timeout);
    const latency = Date.now() - start;

    if (!response.ok && response.status !== 206) {
      return { status: "offline", latency: null, error: `HTTP ${response.status}` };
    }

    // If it responds but slowly, mark as degraded
    const status = latency > 5000 ? "degraded" : "online";
    return { status, latency };

  } catch (err) {
    if (err.name === "AbortError") {
      return { status: "offline", latency: null, error: "Timeout" };
    }
    // CORS errors usually mean the stream exists but blocks direct pings
    if (err.message.includes("fetch")) {
      return { status: "online", latency: null, corsBlocked: true };
    }
    return { status: "offline", latency: null, error: err.message };
  }
}