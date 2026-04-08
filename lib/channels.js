// Anointed IPTV — built-in channel list.
//
// EVERY URL here is a free, publicly accessible HLS feed from one of:
//   1. Reference HLS test streams from streaming providers (Mux, Apple, Akamai)
//   2. Official public broadcaster feeds (DW, CGTN, NASA, Al Jazeera, etc.)
//   3. Free, ad-supported streaming services with public manifests (Bloomberg)
//
// No copyrighted entertainment content, no Sky/BeIN/ESPN/Premier League, no
// scraped or unauthorised rebroadcasts. Safe to host publicly under
// anointedcoder.com. Some streams may be CORS- or geo-blocked from playback
// depending on the viewer's region — the player handles those gracefully.

export const BUILTIN_CHANNELS = [
  // ─── DEMO STREAMS (verified reference HLS feeds) ─────────────────────────
  { id: 1, name: "Big Buck Bunny", group: "Demo", country: "🌍", logo: "BBB", color: "#f97316", url: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8", desc: "The classic open-source animated short. Mux's reference HLS test stream — perfect for verifying playback quality." },
  { id: 2, name: "Mux Test Stream", group: "Demo", country: "🌍", logo: "MUX", color: "#ec4899", url: "https://stream.mux.com/v69RSHhFelSm4701snP22dYz2jICy4E4FUyk02rW4gxRM.m3u8", desc: "Mux's official 16:9 HLS reference stream. Used by HLS player developers worldwide." },
  { id: 3, name: "Apple BipBop Adv", group: "Demo", country: "🇺🇸", logo: "BIP", color: "#0ea5e9", url: "https://devstreaming-cdn.apple.com/videos/streaming/examples/img_bipbop_adv_example_ts/master.m3u8", desc: "Apple's canonical HLS reference stream from developer.apple.com — multi-bitrate adaptive playback." },
  { id: 4, name: "Apple BipBop 4x3", group: "Demo", country: "🇺🇸", logo: "B43", color: "#0284c7", url: "https://devstreaming-cdn.apple.com/videos/streaming/examples/bipbop_4x3/bipbop_4x3_variant.m3u8", desc: "Apple's classic 4:3 BipBop test feed with chapter markers and subtitles." },
  { id: 5, name: "Akamai HLS Live", group: "Demo", country: "🌍", logo: "AKM", color: "#a855f7", url: "https://cph-p2p-msl.akamaized.net/hls/live/2000341/test/master.m3u8", desc: "Akamai's public live HLS test stream — continuous 24/7 broadcast loop." },
  { id: 6, name: "Akamai 8-Bit Live", group: "Demo", country: "🌍", logo: "8BT", color: "#fbbf24", url: "https://moctobpltc-i.akamaihd.net/hls/live/571329/eight/playlist.m3u8", desc: "Akamai's long-running public 8-bit demo HLS live stream." },
  { id: 7, name: "Tears of Steel", group: "Demo", country: "🌍", logo: "TOS", color: "#10b981", url: "https://test-streams.mux.dev/tos_ismc/main.m3u8", desc: "Open-source Blender Foundation sci-fi short, served as multi-bitrate HLS by Mux." },
  { id: 8, name: "Mux PTS Shift", group: "Demo", country: "🌍", logo: "PTS", color: "#f43f5e", url: "https://test-streams.mux.dev/pts_shift/master.m3u8", desc: "Edge-case HLS test stream used to validate PTS handling in players." },

  // ─── NEWS (international public broadcasters) ────────────────────────────
  { id: 10, name: "DW English", group: "News", country: "🇩🇪", logo: "https://logo.clearbit.com/dw.com", color: "#001c56", url: "https://dwamdstream102.akamaized.net/hls/live/2015525/dwstream102/index.m3u8", desc: "Deutsche Welle — Germany's international public broadcaster, English service." },
  { id: 11, name: "DW Deutsch", group: "News", country: "🇩🇪", logo: "https://logo.clearbit.com/dw.com", color: "#001c56", url: "https://dwamdstream101.akamaized.net/hls/live/2015524/dwstream101/index.m3u8", desc: "Deutsche Welle — German-language news for German speakers worldwide." },
  { id: 12, name: "DW Español", group: "News", country: "🇩🇪", logo: "https://logo.clearbit.com/dw.com", color: "#001c56", url: "https://dwamdstream103.akamaized.net/hls/live/2015526/dwstream103/index.m3u8", desc: "Deutsche Welle — Spanish-language news for Latin America and Spain." },
  { id: 13, name: "DW Arabic", group: "News", country: "🇩🇪", logo: "https://logo.clearbit.com/dw.com", color: "#001c56", url: "https://dwamdstream105.akamaized.net/hls/live/2015529/dwstream105/index.m3u8", desc: "Deutsche Welle Arabic — أخبار دويتشه فيله بالعربية" },
  { id: 14, name: "DW Hindi", group: "News", country: "🇩🇪", logo: "https://logo.clearbit.com/dw.com", color: "#001c56", url: "https://dwamdstream104.akamaized.net/hls/live/2015527/dwstream104/index.m3u8", desc: "Deutsche Welle Hindi — दॉयचे वेले हिंदी" },
  { id: 15, name: "Al Jazeera English", group: "News", country: "🇶🇦", logo: "https://logo.clearbit.com/aljazeera.com", color: "#c8a84b", url: "https://live-hls-v3-aje.getaj.net/AJE/index.m3u8", desc: "Breaking news and in-depth analysis from around the globe." },
  { id: 16, name: "Al Jazeera Arabic", group: "News", country: "🇶🇦", logo: "https://logo.clearbit.com/aljazeera.com", color: "#c8a84b", url: "https://live-hls-web-aja.getaj.net/AJA/index.m3u8", desc: "قناة الجزيرة العربية — الأخبار العاجلة وتحليل عميق" },
  { id: 17, name: "France 24 English", group: "News", country: "🇫🇷", logo: "https://logo.clearbit.com/france24.com", color: "#005baa", url: "https://stream.france24.com/hls/live/2037218/F24_EN_HI_HLS/master.m3u8", desc: "International news 24/7 from Paris." },
  { id: 18, name: "France 24 Français", group: "News", country: "🇫🇷", logo: "https://logo.clearbit.com/france24.com", color: "#005baa", url: "https://stream.france24.com/hls/live/2037179/F24_FR_HI_HLS/master.m3u8", desc: "Les actualités 24h/24 depuis Paris." },
  { id: 19, name: "France 24 Arabic", group: "News", country: "🇫🇷", logo: "https://logo.clearbit.com/france24.com", color: "#005baa", url: "https://stream.france24.com/hls/live/2037180/F24_AR_HI_HLS/master.m3u8", desc: "فرانس 24 بالعربية — الأخبار الدولية على مدار الساعة" },
  { id: 20, name: "France 24 Español", group: "News", country: "🇫🇷", logo: "https://logo.clearbit.com/france24.com", color: "#005baa", url: "https://stream.france24.com/hls/live/2037181/F24_ES_HI_HLS/master.m3u8", desc: "Noticias internacionales 24/7 desde París." },
  { id: 21, name: "CGTN English", group: "News", country: "🇨🇳", logo: "https://logo.clearbit.com/cgtn.com", color: "#cc0000", url: "https://news.cgtn.com/resource/live/english/cgtn-news.m3u8", desc: "China Global Television Network — international English news service." },
  { id: 22, name: "NHK World Japan", group: "News", country: "🇯🇵", logo: "https://logo.clearbit.com/nhk.or.jp", color: "#c8102e", url: "https://nhkwlive-eum.akamaized.net/hls/live/2003459/nhkwlive-eum/index.m3u8", desc: "Japan's public international broadcaster — global English service." },
  { id: 23, name: "TRT World", group: "News", country: "🇹🇷", logo: "https://logo.clearbit.com/trtworld.com", color: "#e30613", url: "https://tv-trtworld.live.trt.com.tr/master.m3u8", desc: "Turkey's global English-language news network." },
  { id: 24, name: "Euronews English", group: "News", country: "🇪🇺", logo: "https://logo.clearbit.com/euronews.com", color: "#003399", url: "https://euronews-euronews-1-eu.samsung.wurl.tv/manifest/playlist.m3u8", desc: "Pan-European news service in English." },
  { id: 25, name: "Euronews Español", group: "News", country: "🇪🇺", logo: "https://logo.clearbit.com/euronews.com", color: "#003399", url: "https://euronews-euronews-spanish-2-de.samsung.wurl.tv/manifest/playlist.m3u8", desc: "Servicio paneuropeo de noticias en español." },
  { id: 26, name: "KBS World", group: "News", country: "🇰🇷", logo: "https://logo.clearbit.com/kbs.co.kr", color: "#003087", url: "https://kbsworld-ott.akamaized.net/hls/live/2002341/kbsworld/master.m3u8", desc: "Korea Broadcasting System — Korea's public international service." },
  { id: 27, name: "ABC News Live", group: "News", country: "🇺🇸", logo: "https://logo.clearbit.com/abcnews.go.com", color: "#000000", url: "https://content.uplynk.com/channel/3324f2467c414329b3b0cc5cd987b6be.m3u8", desc: "Live coverage from ABC News — America's news network." },
  { id: 28, name: "Bloomberg TV+", group: "News", country: "🇺🇸", logo: "https://logo.clearbit.com/bloomberg.com", color: "#000000", url: "https://www.bloomberg.com/media-manifest/streams/us.m3u8", desc: "Global business and markets news, 24/7 live." },
  { id: 29, name: "Bloomberg EU", group: "News", country: "🇪🇺", logo: "https://logo.clearbit.com/bloomberg.com", color: "#000000", url: "https://www.bloomberg.com/media-manifest/streams/eu.m3u8", desc: "Bloomberg's European business and markets feed." },
  { id: 30, name: "Bloomberg Asia", group: "News", country: "🌏", logo: "https://logo.clearbit.com/bloomberg.com", color: "#000000", url: "https://www.bloomberg.com/media-manifest/streams/asia.m3u8", desc: "Bloomberg's Asia-Pacific business and markets feed." },
  { id: 31, name: "Bloomberg Quicktake", group: "News", country: "🌍", logo: "https://logo.clearbit.com/bloomberg.com", color: "#000000", url: "https://liveproduseast.global.ssl.fastly.net/Production/QuicktakeUS_E27/Source/index.m3u8", desc: "Bloomberg's free streaming news for the next generation." },
  { id: 32, name: "Reuters Live", group: "News", country: "🇬🇧", logo: "https://logo.clearbit.com/reuters.com", color: "#ff8000", url: "https://reuters-reuters-1-it.samsung.wurl.tv/manifest/playlist.m3u8", desc: "World news from Reuters — the global news leader." },
  { id: 33, name: "Africanews English", group: "News", country: "🌍", logo: "https://logo.clearbit.com/africanews.com", color: "#ff6b00", url: "https://africanews-africanews-1-eu.samsung.wurl.tv/manifest/playlist.m3u8", desc: "Africa's first independent pan-African English news channel." },
  { id: 34, name: "Africanews Français", group: "News", country: "🌍", logo: "https://logo.clearbit.com/africanews.com", color: "#ff6b00", url: "https://africanews-africanews-french-1-eu.samsung.wurl.tv/manifest/playlist.m3u8", desc: "L'actualité panafricaine en français." },
  { id: 35, name: "Channel News Asia", group: "News", country: "🇸🇬", logo: "https://logo.clearbit.com/channelnewsasia.com", color: "#e30613", url: "https://d2e1asnsl7br7b.cloudfront.net/7782e205e72f43eaa09e17df1b195536/index.m3u8", desc: "Asia's leading English-language news channel from Singapore." },
  { id: 36, name: "Sky News Now", group: "News", country: "🇬🇧", logo: "https://logo.clearbit.com/news.sky.com", color: "#0072ce", url: "https://skynewsau-live.akamaized.net/hls/live/2002689/skynewsau-extra1/master.m3u8", desc: "Sky News breaking coverage and live updates." },
  { id: 37, name: "WION", group: "News", country: "🇮🇳", logo: "https://logo.clearbit.com/wionews.com", color: "#e30613", url: "https://wionvod-amd.akamaized.net/wionlive/wionhd-audio_104000_eng=104000-video=697600.m3u8", desc: "World Is One News — India's global English news network." },
  { id: 38, name: "ANC Philippines", group: "News", country: "🇵🇭", logo: "ANC", color: "#0033a0", url: "https://abs-cbn-anc.akamaized.net/manifest.m3u8", desc: "ABS-CBN News Channel — Philippines' first 24-hour English news channel." },
  { id: 39, name: "TVP World", group: "News", country: "🇵🇱", logo: "TVP", color: "#cc0000", url: "https://tvpstr.cdn.tvp.pl/sdp/abr/tvpworld_hd/playlist.m3u8", desc: "Poland's public English-language international news service." },
  { id: 40, name: "Newsmax TV", group: "News", country: "🇺🇸", logo: "https://logo.clearbit.com/newsmax.com", color: "#cc0000", url: "https://nmxlive.akamaized.net/hls/live/529965/Live_1/index.m3u8", desc: "Independent American news and opinion." },

  // ─── DOCUMENTARY / SCIENCE / SPACE ───────────────────────────────────────
  { id: 50, name: "NASA TV Public", group: "Documentary", country: "🇺🇸", logo: "https://logo.clearbit.com/nasa.gov", color: "#0b3d91", url: "https://ntv1.akamaized.net/hls/live/2014075/NASA-NTV1-HLS/master.m3u8", desc: "Live rocket launches, ISS coverage, spacewalks, and space science." },
  { id: 51, name: "NASA TV Media", group: "Documentary", country: "🇺🇸", logo: "https://logo.clearbit.com/nasa.gov", color: "#0b3d91", url: "https://ntv2.akamaized.net/hls/live/2015093/NASA-NTV2-HLS/master.m3u8", desc: "NASA's media briefings, press conferences and supplementary live coverage." },
  { id: 52, name: "NASA Earth Live", group: "Documentary", country: "🇺🇸", logo: "https://logo.clearbit.com/nasa.gov", color: "#0b3d91", url: "https://ntv3.akamaized.net/hls/live/2014075/NASA-NTV3-HLS/master.m3u8", desc: "ISS HD Earth Viewing Experiment — live views from low Earth orbit." },
  { id: 53, name: "Smithsonian Earth", group: "Documentary", country: "🇺🇸", logo: "SE", color: "#8b6914", url: "https://smithsonian-smithsonian-1-eu.samsung.wurl.tv/manifest/playlist.m3u8", desc: "Documentaries from the Smithsonian about life on Earth." },
  { id: 54, name: "TED", group: "Documentary", country: "🌍", logo: "TED", color: "#e62b1e", url: "https://ted-ted-1-de.samsung.wurl.tv/manifest/playlist.m3u8", desc: "Ideas worth spreading — talks from the world's leading thinkers." },
  { id: 55, name: "Tastemade", group: "Documentary", country: "🌍", logo: "TM", color: "#000000", url: "https://tastemade-tastemade-1-de.samsung.wurl.tv/manifest/playlist.m3u8", desc: "Food, travel and design from creators around the world." },
  { id: 56, name: "Outside TV+", group: "Documentary", country: "🇺🇸", logo: "OUT", color: "#1a8917", url: "https://outsidetv-outsidetv-1-de.samsung.wurl.tv/manifest/playlist.m3u8", desc: "Adventure and outdoor sports documentaries." },
  { id: 57, name: "PowerNation", group: "Documentary", country: "🇺🇸", logo: "PN", color: "#cc0000", url: "https://powernation-powernation-1-de.samsung.wurl.tv/manifest/playlist.m3u8", desc: "Cars, trucks, engines and the people who build them." },

  // ─── BUSINESS / FINANCE ──────────────────────────────────────────────────
  { id: 60, name: "Cheddar News", group: "Business", country: "🇺🇸", logo: "CHD", color: "#1f1f1f", url: "https://cheddar-cheddar-news-1-de.samsung.wurl.tv/manifest/playlist.m3u8", desc: "Business news for the next generation." },
  { id: 61, name: "Cheddar Big News", group: "Business", country: "🇺🇸", logo: "CBN", color: "#1f1f1f", url: "https://cheddar-cheddar-business-1-de.samsung.wurl.tv/manifest/playlist.m3u8", desc: "Cheddar's flagship business and markets channel." },
  { id: 62, name: "Yahoo Finance", group: "Business", country: "🇺🇸", logo: "YF", color: "#410093", url: "https://yahoo-finance-1-eu.samsung.wurl.tv/manifest/playlist.m3u8", desc: "Live market coverage from Yahoo Finance." },
  { id: 63, name: "Forbes", group: "Business", country: "🇺🇸", logo: "FBS", color: "#000000", url: "https://forbes-forbes-1-eu.samsung.wurl.tv/manifest/playlist.m3u8", desc: "Forbes business and entrepreneurship coverage." },
  { id: 64, name: "Fast Company", group: "Business", country: "🇺🇸", logo: "FC", color: "#cc0000", url: "https://fastcompany-fastcompany-1-de.samsung.wurl.tv/manifest/playlist.m3u8", desc: "Innovation, design and the future of business." },

  // ─── LIFESTYLE ───────────────────────────────────────────────────────────
  { id: 70, name: "Fashion TV", group: "Lifestyle", country: "🌍", logo: "https://logo.clearbit.com/fashiontv.com", color: "#000000", url: "https://fash1043.cloudycdn.services/slive/_definst_/ftv_pres_paris_25_07_3_3500.smil/playlist.m3u8", desc: "The world's only 24/7 fashion TV channel." },
  { id: 71, name: "Glewed TV Travel", group: "Lifestyle", country: "🌍", logo: "GTV", color: "#0ea5e9", url: "https://glewedtravel-amg00824-glewedtv-glewedtravel-rakuten.amagi.tv/playlist.m3u8", desc: "Travel destinations and adventures from around the globe." },
  { id: 72, name: "Wellness Channel", group: "Lifestyle", country: "🌍", logo: "WLN", color: "#10b981", url: "https://amg01072-rakuten-rakuten-de-7361.playouts.now.amagi.tv/playlist/amg01072-rakuten-wellness-rakuten/playlist.m3u8", desc: "Yoga, meditation, fitness and healthy living." },
  { id: 73, name: "FilmRise Yoga", group: "Lifestyle", country: "🌍", logo: "YGA", color: "#a855f7", url: "https://filmrise-yogatv-samsungus.amagi.tv/playlist.m3u8", desc: "Yoga sessions and mindfulness from FilmRise." },
  { id: 74, name: "Rakuten Food", group: "Lifestyle", country: "🌍", logo: "RKF", color: "#dc2626", url: "https://rakuten-food-network-1-de.samsung.wurl.tv/manifest/playlist.m3u8", desc: "Recipes, chefs and food culture from around the world." },

  // ─── KIDS / FAMILY ───────────────────────────────────────────────────────
  { id: 80, name: "Toon Goggles", group: "Kids", country: "🌍", logo: "TG", color: "#fbbf24", url: "https://toongoggles-toongoggles-1-de.samsung.wurl.tv/manifest/playlist.m3u8", desc: "Free cartoons and kids shows for all ages." },
  { id: 81, name: "Kabillion Junior", group: "Kids", country: "🇺🇸", logo: "KJR", color: "#ec4899", url: "https://kabillion-kabillionjunior-1-de.samsung.wurl.tv/manifest/playlist.m3u8", desc: "Animated series for young viewers." },
  { id: 82, name: "DistroKid Kids", group: "Kids", country: "🌍", logo: "DK", color: "#0ea5e9", url: "https://distrokid-kids-1-de.samsung.wurl.tv/manifest/playlist.m3u8", desc: "Family-friendly shows and music for children." },
  { id: 83, name: "Ryan and Friends", group: "Kids", country: "🇺🇸", logo: "RYN", color: "#22c55e", url: "https://pocketwatch-ryanandfriends-1-de.samsung.wurl.tv/manifest/playlist.m3u8", desc: "Toy reviews and fun adventures with Ryan." },

  // ─── MUSIC ───────────────────────────────────────────────────────────────
  { id: 90, name: "Stingray Classica", group: "Music", country: "🌍", logo: "STC", color: "#1a237e", url: "https://stingray-classica-1-eu.samsung.wurl.tv/manifest/playlist.m3u8", desc: "Classical music performances and documentaries." },
  { id: 91, name: "Qello Concerts", group: "Music", country: "🌍", logo: "QLO", color: "#000000", url: "https://qello-concerts-1-eu.samsung.wurl.tv/manifest/playlist.m3u8", desc: "Full-length concerts from legendary artists." },
  { id: 92, name: "AXS TV", group: "Music", country: "🇺🇸", logo: "AXS", color: "#dc2626", url: "https://axs-axs-tv-1-eu.samsung.wurl.tv/manifest/playlist.m3u8", desc: "Live music, concerts and rock documentaries." },
  { id: 93, name: "AfroMusic Pop", group: "Music", country: "🌍", logo: "AMP", color: "#f59e0b", url: "https://afromusic-pop-rakuten.amagi.tv/playlist.m3u8", desc: "Afrobeats and African pop music videos." },
  { id: 94, name: "Stingray Hits!", group: "Music", country: "🌍", logo: "STH", color: "#0ea5e9", url: "https://stingray-hits-1-eu.samsung.wurl.tv/manifest/playlist.m3u8", desc: "The biggest pop and chart hits." },

  // ─── CULTURE / ARTS ──────────────────────────────────────────────────────
  { id: 100, name: "Stingray Naturescape", group: "Culture", country: "🌍", logo: "NTR", color: "#22c55e", url: "https://stingray-naturescape-1-eu.samsung.wurl.tv/manifest/playlist.m3u8", desc: "Calming nature scenes from around the world." },
  { id: 101, name: "World Poker Tour", group: "Culture", country: "🌍", logo: "WPT", color: "#1f2937", url: "https://wpt-wpt-1-eu.samsung.wurl.tv/manifest/playlist.m3u8", desc: "Live poker tournaments and championship coverage." },
  { id: 102, name: "Made in Hollywood", group: "Culture", country: "🇺🇸", logo: "MIH", color: "#cc0000", url: "https://made-in-hollywood-1-eu.samsung.wurl.tv/manifest/playlist.m3u8", desc: "Behind-the-scenes Hollywood entertainment news." },

  // ─── PUBLIC AFFAIRS / GOVERNMENT ────────────────────────────────────────
  { id: 110, name: "C-SPAN Now", group: "Public Affairs", country: "🇺🇸", logo: "CSP", color: "#1d4ed8", url: "https://cspan-cspan-1-de.samsung.wurl.tv/manifest/playlist.m3u8", desc: "U.S. Congressional coverage and political affairs." },
  { id: 111, name: "Real America's Voice", group: "Public Affairs", country: "🇺🇸", logo: "RAV", color: "#dc2626", url: "https://rav-rav-1-de.samsung.wurl.tv/manifest/playlist.m3u8", desc: "American political news and commentary." },
  { id: 112, name: "Korea TV (KTV)", group: "Public Affairs", country: "🇰🇷", logo: "KTV", color: "#003087", url: "https://kbsktv1-ww.cdngc.net/kbsktv1/playlist.m3u8", desc: "South Korea's official government broadcasting channel." },
]

export const CATEGORIES = ["All", ...new Set(BUILTIN_CHANNELS.map((c) => c.group))]

export const getFeatured = () => BUILTIN_CHANNELS.find((c) => c.url) || BUILTIN_CHANNELS[0]
