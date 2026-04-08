// Anointed IPTV — built-in channel list.
// Every URL here is a verified, free, public HLS test stream or an
// official public broadcaster feed. No copyrighted content. Safe to
// host publicly under anointedcoder.com.

export const BUILTIN_CHANNELS = [
  // ── DEMO STREAMS (free reference HLS feeds shipped by streaming providers) ──
  {
    id: 1,
    name: "Big Buck Bunny",
    group: "Demo",
    country: "🌍",
    logo: "BBB",
    color: "#f97316",
    url: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8",
    desc: "The classic open-source animated short. Mux's reference HLS test stream — perfect for verifying playback quality.",
  },
  {
    id: 2,
    name: "Mux Test Stream",
    group: "Demo",
    country: "🌍",
    logo: "MUX",
    color: "#ec4899",
    url: "https://stream.mux.com/v69RSHhFelSm4701snP22dYz2jICy4E4FUyk02rW4gxRM.m3u8",
    desc: "Mux's official 16:9 HLS reference stream. Used by HLS player developers worldwide for testing.",
  },
  {
    id: 3,
    name: "Apple BipBop",
    group: "Demo",
    country: "🇺🇸",
    logo: "BIP",
    color: "#0ea5e9",
    url: "https://devstreaming-cdn.apple.com/videos/streaming/examples/img_bipbop_adv_example_ts/master.m3u8",
    desc: "Apple's canonical HLS reference stream from developer.apple.com. Multi-bitrate adaptive playback.",
  },
  {
    id: 4,
    name: "Akamai HLS Live",
    group: "Demo",
    country: "🌍",
    logo: "AKM",
    color: "#a855f7",
    url: "https://cph-p2p-msl.akamaized.net/hls/live/2000341/test/master.m3u8",
    desc: "Akamai's public live HLS test stream. Continuous 24/7 broadcast loop.",
  },
  {
    id: 5,
    name: "Tears of Steel",
    group: "Demo",
    country: "🌍",
    logo: "TOS",
    color: "#10b981",
    url: "https://test-streams.mux.dev/tos_ismc/main.m3u8",
    desc: "Open-source Blender Foundation sci-fi short, served as multi-bitrate HLS by Mux.",
  },
  {
    id: 6,
    name: "Apple BipBop 4x3",
    group: "Demo",
    country: "🇺🇸",
    logo: "B43",
    color: "#0284c7",
    url: "https://devstreaming-cdn.apple.com/videos/streaming/examples/bipbop_4x3/bipbop_4x3_variant.m3u8",
    desc: "Apple's classic 4:3 BipBop test feed with chapter markers and subtitles.",
  },
  {
    id: 7,
    name: "Mux PTS Shift",
    group: "Demo",
    country: "🌍",
    logo: "PTS",
    color: "#f43f5e",
    url: "https://test-streams.mux.dev/pts_shift/master.m3u8",
    desc: "Edge-case HLS test stream used to validate PTS handling in players.",
  },
  {
    id: 8,
    name: "Akamai 8-Bit Live",
    group: "Demo",
    country: "🌍",
    logo: "8BT",
    color: "#fbbf24",
    url: "https://moctobpltc-i.akamaihd.net/hls/live/571329/eight/playlist.m3u8",
    desc: "Akamai's long-running public 8-bit demo HLS live stream.",
  },

  // ── PUBLIC BROADCASTERS (official, free, legal HLS feeds) ──
  {
    id: 9,
    name: "DW English",
    group: "News",
    country: "🇩🇪",
    logo: "https://logo.clearbit.com/dw.com",
    color: "#001c56",
    url: "https://dwamdstream102.akamaized.net/hls/live/2015525/dwstream102/index.m3u8",
    desc: "Deutsche Welle — Germany's international public broadcaster, English service.",
  },
  {
    id: 10,
    name: "DW Spanish",
    group: "News",
    country: "🇩🇪",
    logo: "https://logo.clearbit.com/dw.com",
    color: "#001c56",
    url: "https://dwamdstream103.akamaized.net/hls/live/2015526/dwstream103/index.m3u8",
    desc: "Deutsche Welle — Spanish-language news for Latin America and Spain.",
  },
  {
    id: 11,
    name: "CGTN English",
    group: "News",
    country: "🇨🇳",
    logo: "https://logo.clearbit.com/cgtn.com",
    color: "#cc0000",
    url: "https://news.cgtn.com/resource/live/english/cgtn-news.m3u8",
    desc: "China Global Television Network — international English news service.",
  },

  // ── DOCUMENTARY / SPACE ──
  {
    id: 12,
    name: "NASA TV Public",
    group: "Space",
    country: "🇺🇸",
    logo: "https://logo.clearbit.com/nasa.gov",
    color: "#0b3d91",
    url: "https://ntv1.akamaized.net/hls/live/2014075/NASA-NTV1-HLS/master.m3u8",
    desc: "Live rocket launches, ISS coverage, spacewalks, and space science from NASA's public channel.",
  },
]

export const CATEGORIES = ["All", ...new Set(BUILTIN_CHANNELS.map((c) => c.group))]

export const getFeatured = () => BUILTIN_CHANNELS.find((c) => c.url) || BUILTIN_CHANNELS[0]
