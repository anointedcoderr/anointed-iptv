import { useState, useEffect, useRef, useCallback } from "react";
import { BUILTIN_CHANNELS, getFeatured } from "../lib/channels";

const statusColor = (s) => s === "online" ? "#22c55e" : s === "degraded" ? "#f59e0b" : "#ef4444";

const withMockHealth = (channels) => channels.map(c => ({
  ...c,
  status: Math.random() > 0.12 ? "online" : Math.random() > 0.5 ? "degraded" : "offline",
  latency: Math.floor(Math.random() * 300) + 60,
  uptime: parseFloat((Math.random() * 15 + 84).toFixed(1)),
}));

function ChannelLogo({ logo, color, name, size = 54, radius = 16 }) {
  const [imgFailed, setImgFailed] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const isUrl = logo && logo.startsWith("http");
  const fallback = name
    ? name.split(" ").map(w => w[0]).join("").slice(0, 3).toUpperCase()
    : "CH";
  const shortText = logo && !logo.startsWith("http") ? logo : fallback;

  const showFallback = !isUrl || imgFailed;

  return (
    <div style={{ width: size, height: size, borderRadius: radius, flexShrink: 0, position: "relative", overflow: "hidden" }}>
      {/* Always render fallback behind */}
      <div style={{
        position: "absolute", inset: 0,
        background: color || "#333",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: size * 0.22, fontWeight: 900, color: "#fff",
        boxShadow: `0 8px 24px ${color || "#333"}55`,
      }}>
        {shortText}
      </div>
      {/* Render image on top — disappears on error */}
      {isUrl && !imgFailed && (
        <img
          src={logo}
          alt={name}
          onLoad={() => setImgLoaded(true)}
          onError={() => setImgFailed(true)}
          style={{
            position: "absolute", inset: 0,
            width: "100%", height: "100%",
            objectFit: "contain",
            background: "#fff",
            padding: size * 0.1,
            opacity: imgLoaded ? 1 : 0,
            transition: "opacity 0.2s ease",
          }}
        />
      )}
    </div>
  );
}

function PlayerModal({ channel, onClose, onToggleWatchlist, isWatchlisted }) {
  const videoRef = useRef(null);
  const hlsRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [playerError, setPlayerError] = useState(null);

  useEffect(() => {
    if (!channel?.url || !videoRef.current) { setLoading(false); return; }
    setLoading(true);
    setPlayerError(null);
    const video = videoRef.current;

    const tryPlay = async () => {
      if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = channel.url;
        video.load();
        setLoading(false);
        return;
      }
      try {
        const Hls = (await import("hls.js")).default;
        if (Hls.isSupported()) {
          const hls = new Hls({ enableWorker: false });
          hlsRef.current = hls;
          hls.loadSource(channel.url);
          hls.attachMedia(video);
          hls.on(Hls.Events.MANIFEST_PARSED, () => { setLoading(false); video.play().catch(() => {}); });
          hls.on(Hls.Events.ERROR, (_, data) => { if (data.fatal) { setPlayerError("Stream unavailable or blocked."); setLoading(false); } });
        }
      } catch (err) { setPlayerError("Could not load player."); setLoading(false); }
    };

    tryPlay();
    return () => { if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null; } };
  }, [channel?.url]);

  if (!channel) return null;

  return (
    <div onClick={onClose} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.92)", zIndex:400, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", backdropFilter:"blur(8px)" }}>
      <div onClick={e => e.stopPropagation()} style={{ width:"min(88vw,960px)", animation:"fadeUp 0.25s ease" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16 }}>
          <div style={{ display:"flex", alignItems:"center", gap:14 }}>
            <ChannelLogo logo={channel.logo} color={channel.color} name={channel.name} size={46} radius={14} />
            <div>
              <div style={{ fontFamily:"'Playfair Display',serif", fontSize:22, fontWeight:800 }}>{channel.name}</div>
              <div style={{ display:"flex", alignItems:"center", gap:8, marginTop:5 }}>
                {channel.status==="online" && <span style={{ background:"rgba(239,68,68,0.85)", color:"#fff", fontSize:10, fontWeight:700, padding:"2px 8px", borderRadius:4, animation:"pulse 2s ease-in-out infinite" }}>● LIVE</span>}
                <span style={{ fontSize:12, color:"rgba(255,255,255,0.4)" }}>{channel.group} · {channel.country}</span>
                <span style={{ fontSize:12, color:statusColor(channel.status), fontWeight:600 }}>● {channel.status}</span>
              </div>
            </div>
          </div>
          <div style={{ display:"flex", gap:10 }}>
            <button onClick={() => onToggleWatchlist(channel.id)} style={{ background:isWatchlisted?"rgba(255,107,53,0.15)":"rgba(255,255,255,0.08)", border:`1px solid ${isWatchlisted?"#ff6b35":"rgba(255,255,255,0.15)"}`, color:isWatchlisted?"#ff6b35":"#fff", width:40, height:40, borderRadius:"50%", cursor:"pointer", fontSize:16 }}>
              {isWatchlisted ? "♥" : "♡"}
            </button>
            <button onClick={onClose} style={{ background:"rgba(255,255,255,0.1)", border:"none", color:"#fff", width:40, height:40, borderRadius:"50%", cursor:"pointer", fontSize:18 }}>✕</button>
          </div>
        </div>

        <div style={{ width:"100%", aspectRatio:"16/9", background:"#000", borderRadius:18, overflow:"hidden", position:"relative", border:"1px solid rgba(255,255,255,0.08)" }}>
          {channel.url && !playerError ? (
            <>
              <video ref={videoRef} controls autoPlay playsInline style={{ width:"100%", height:"100%", objectFit:"contain", display:loading?"none":"block" }} />
              {loading && (
                <div style={{ position:"absolute", inset:0, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:16, background:"radial-gradient(ellipse at center,#1a1a2e 0%,#000 100%)" }}>
                  <div style={{ width:56, height:56, border:"3px solid rgba(255,107,53,0.2)", borderTopColor:"#ff6b35", borderRadius:"50%", animation:"spin 0.8s linear infinite" }} />
                  <div style={{ fontSize:13, color:"rgba(255,255,255,0.4)" }}>Connecting to stream...</div>
                </div>
              )}
            </>
          ) : (
            <div style={{ width:"100%", height:"100%", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:18, background:`radial-gradient(ellipse at center,${channel.color}22 0%,#000 100%)` }}>
              <ChannelLogo logo={channel.logo} color={channel.color} name={channel.name} size={72} radius={22} />
              <div style={{ textAlign:"center", maxWidth:400 }}>
                <div style={{ fontFamily:"'Playfair Display',serif", fontSize:20, fontWeight:700, marginBottom:10 }}>{channel.name}</div>
                <div style={{ fontSize:13, color:"rgba(255,255,255,0.45)", lineHeight:1.7 }}>
                  {playerError || (channel.status==="offline" ? "⚠️ Stream is currently offline." : channel.status==="degraded" ? "⚡ Stream is experiencing high latency." : "✅ Stream is healthy. Import your M3U playlist to watch live.")}
                </div>
              </div>
            </div>
          )}
        </div>

        <div style={{ display:"flex", gap:32, marginTop:18 }}>
          {[
            { label:"STATUS", value:channel.status?.toUpperCase(), color:statusColor(channel.status) },
            { label:"LATENCY", value:channel.latency?`${channel.latency}ms`:"N/A", color:channel.latency<300?"#22c55e":"#f59e0b" },
            { label:"UPTIME", value:`${channel.uptime}%`, color:"#a78bfa" },
            { label:"GROUP", value:channel.group, color:"#f0f0f5" },
          ].map((d,i) => (
            <div key={i}>
              <div style={{ fontSize:10, color:"rgba(255,255,255,0.3)", letterSpacing:"0.1em", marginBottom:5 }}>{d.label}</div>
              <div style={{ fontSize:14, color:d.color, fontWeight:600 }}>{d.value}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ChannelCard({ channel, onPlay, isWatchlisted, onToggleWatchlist }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)} onClick={() => onPlay(channel)}
      style={{ borderRadius:16, overflow:"hidden", background:"#1a1a22", border:"1px solid rgba(255,255,255,0.06)", cursor:"pointer", transition:"transform 0.22s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.22s ease", transform:hovered?"translateY(-6px) scale(1.03)":"none", boxShadow:hovered?"0 24px 48px rgba(0,0,0,0.5)":"none", position:"relative" }}>

      <div style={{ height:110, background:`radial-gradient(ellipse at 30% 40%,${channel.color}55 0%,${channel.color}11 60%,#111 100%)`, display:"flex", alignItems:"center", justifyContent:"center", position:"relative" }}>
        <ChannelLogo logo={channel.logo} color={channel.color} name={channel.name} size={54} radius={16} />
        <div style={{ position:"absolute", top:10, right:10, width:9, height:9, borderRadius:"50%", background:statusColor(channel.status), boxShadow:`0 0 0 2px rgba(0,0,0,0.5)` }} />
        <button onClick={e => { e.stopPropagation(); onToggleWatchlist(channel.id); }} style={{ position:"absolute", top:8, left:10, background:"none", border:"none", fontSize:15, cursor:"pointer", color:isWatchlisted?"#ff6b35":"rgba(255,255,255,0.3)" }}>
          {isWatchlisted ? "♥" : "♡"}
        </button>
        {channel.status==="online" && <div style={{ position:"absolute", bottom:8, left:10, background:"rgba(239,68,68,0.85)", color:"#fff", fontSize:9, fontWeight:700, padding:"2px 7px", borderRadius:4 }}>LIVE</div>}
        {hovered && (
          <div style={{ position:"absolute", inset:0, background:"rgba(0,0,0,0.5)", display:"flex", alignItems:"center", justifyContent:"center", backdropFilter:"blur(2px)" }}>
            <div style={{ width:44, height:44, borderRadius:"50%", background:"linear-gradient(135deg,#ff6b35,#e85d04)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:16 }}>▶</div>
          </div>
        )}
      </div>

      <div style={{ padding:"11px 13px 13px" }}>
        <div style={{ fontWeight:600, fontSize:13, marginBottom:4, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis", color:"#f0f0f5" }}>{channel.name}</div>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <span style={{ fontSize:11, color:"rgba(255,255,255,0.35)" }}>{channel.country} {channel.group}</span>
          <span style={{ fontSize:11, color:channel.uptime>95?"#22c55e":channel.uptime>82?"#f59e0b":"#ef4444", fontWeight:600 }}>{channel.uptime}%</span>
        </div>
      </div>
    </div>
  );
}

export default function StreamPulse() {
  const [allChannels, setAllChannels] = useState(BUILTIN_CHANNELS);
  const [importedChannels, setImportedChannels] = useState([]);
  const [watchlist, setWatchlist] = useState([]);
  const [playing, setPlaying] = useState(null);
  const [search, setSearch] = useState("");
  const [activeNav, setActiveNav] = useState("Browse");
  const [activeCategory, setActiveCategory] = useState("All");
  const [showImport, setShowImport] = useState(false);
  const [m3uUrl, setM3uUrl] = useState("");
  const [m3uContent, setM3uContent] = useState("");
  const [importing, setImporting] = useState(false);
  const [importMsg, setImportMsg] = useState(null);
  const [monitorSearch, setMonitorSearch] = useState("");
  const [autoLoading, setAutoLoading] = useState(true);

  useEffect(() => {
    setAllChannels(withMockHealth(BUILTIN_CHANNELS));
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/import-m3u", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: "https://iptv-org.github.io/iptv/categories/news.m3u" }),
        });
        const data = await res.json();
        if (res.ok) {
          const withHealth = withMockHealth(data.channels.map((c, i) => ({ ...c, id: `auto_${i}` })));
          setImportedChannels(withHealth);
        }
      } catch (e) {}
      finally { setAutoLoading(false); }
    };
    load();
  }, []);

  const featured = getFeatured();
  const displayChannels = [...allChannels, ...importedChannels];
  const categories = ["All", ...new Set(displayChannels.map(c => c.group))];
  const online = displayChannels.filter(c => c.status==="online").length;
  const offline = displayChannels.filter(c => c.status==="offline").length;
  const degraded = displayChannels.filter(c => c.status==="degraded").length;

  const filteredBrowse = displayChannels.filter(c => {
    const matchCat = activeCategory==="All" || c.group===activeCategory;
    const matchSearch = search ? c.name.toLowerCase().includes(search.toLowerCase()) : true;
    return matchCat && matchSearch;
  });

  const grouped = categories.slice(1).reduce((acc, cat) => {
    acc[cat] = displayChannels.filter(c => c.group===cat);
    return acc;
  }, {});

  const toggleWatchlist = useCallback((id) => {
    setWatchlist(w => w.includes(id) ? w.filter(x => x!==id) : [...w, id]);
  }, []);

  const handleImport = async () => {
    if (!m3uUrl && !m3uContent) { setImportMsg({ type:"error", text:"Please enter a URL or paste M3U content." }); return; }
    setImporting(true);
    setImportMsg(null);
    try {
      const res = await fetch("/api/import-m3u", {
        method:"POST",
        headers:{ "Content-Type":"application/json" },
        body: JSON.stringify({ url:m3uUrl||undefined, content:m3uContent||undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      const withHealth = withMockHealth(data.channels.map((c,i) => ({ ...c, id:`imported_${i}_${Date.now()}` })));
      setImportedChannels(prev => [...prev, ...withHealth]);
      setImportMsg({ type:"success", text:`✅ ${data.count} channels imported!` });
      setTimeout(() => setShowImport(false), 1800);
    } catch (err) {
      setImportMsg({ type:"error", text:`❌ ${err.message}` });
    } finally {
      setImporting(false);
    }
  };

  return (
    <div style={{ background:"#0f0f13", minHeight:"100vh", color:"#f0f0f5", fontFamily:"'DM Sans','Segoe UI',sans-serif", overflowX:"hidden" }}>
      <style suppressHydrationWarning>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Playfair+Display:wght@700;800&display=swap');
        * { box-sizing:border-box; margin:0; padding:0; }
        ::-webkit-scrollbar { height:4px; width:5px; }
        ::-webkit-scrollbar-thumb { background:rgba(255,255,255,0.12); border-radius:4px; }
        .hscroll { display:flex; gap:14px; overflow-x:auto; padding-bottom:8px; }
        .grid-auto { display:grid; grid-template-columns:repeat(auto-fill,minmax(175px,1fr)); gap:16px; }
        input:focus { outline:none; border-color:#ff6b35 !important; }
        textarea:focus { outline:none; border-color:#ff6b35 !important; }
        @keyframes fadeUp { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes spin { to{transform:rotate(360deg)} }
      `}</style>

      {/* NAV */}
      <nav style={{ position:"fixed", top:0, left:0, right:0, zIndex:200, padding:"0 36px", height:66, display:"flex", alignItems:"center", justifyContent:"space-between", background:"rgba(15,15,19,0.95)", backdropFilter:"blur(14px)", borderBottom:"1px solid rgba(255,255,255,0.05)" }}>
        <div style={{ display:"flex", alignItems:"center", gap:32 }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ width:36, height:36, borderRadius:11, background:"linear-gradient(135deg,#ff6b35,#f7c59f)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, fontWeight:900, color:"#0f0f13", fontFamily:"'Playfair Display',serif" }}>S</div>
            <span style={{ fontFamily:"'Playfair Display',serif", fontWeight:800, fontSize:20, background:"linear-gradient(135deg,#ff6b35,#f7c59f)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>StreamPulse</span>
          </div>
          <div style={{ display:"flex", gap:26, fontSize:14 }}>
            {["Browse","Watchlist","Monitor"].map(n => (
              <span key={n} onClick={() => setActiveNav(n)} style={{ cursor:"pointer", color:activeNav===n?"#fff":"rgba(255,255,255,0.42)", fontWeight:activeNav===n?600:400, paddingBottom:3, borderBottom:activeNav===n?"2px solid #ff6b35":"2px solid transparent" }}>{n}</span>
            ))}
          </div>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          {autoLoading && <span style={{ fontSize:12, color:"rgba(255,255,255,0.35)", animation:"pulse 1.5s ease-in-out infinite" }}>Loading channels...</span>}
          <div style={{ position:"relative" }}>
            <span style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", fontSize:13, opacity:0.4 }}>🔍</span>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search channels..." style={{ background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.09)", borderRadius:24, padding:"8px 16px 8px 34px", color:"#f0f0f5", fontSize:13, fontFamily:"inherit", width:210 }} />
          </div>
          <button onClick={() => setShowImport(true)} style={{ background:"linear-gradient(135deg,#ff6b35,#e85d04)", border:"none", color:"#fff", padding:"9px 20px", borderRadius:24, fontSize:13, fontWeight:600, fontFamily:"inherit", cursor:"pointer" }}>+ Import M3U</button>
        </div>
      </nav>

      {/* IMPORT MODAL */}
      {showImport && (
        <div onClick={() => !importing && setShowImport(false)} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.8)", zIndex:500, display:"flex", alignItems:"center", justifyContent:"center", backdropFilter:"blur(6px)" }}>
          <div onClick={e => e.stopPropagation()} style={{ background:"#1a1a22", borderRadius:22, padding:"36px 40px", width:540, border:"1px solid rgba(255,107,53,0.18)", animation:"fadeUp 0.2s ease" }}>
            <div style={{ fontFamily:"'Playfair Display',serif", fontSize:26, fontWeight:800, marginBottom:8 }}>Import Your Playlist</div>
            <div style={{ color:"rgba(255,255,255,0.42)", fontSize:14, marginBottom:28, lineHeight:1.65 }}>Paste your M3U URL or raw content. We'll scan all channels and add them to your library.</div>
            <div style={{ marginBottom:16 }}>
              <div style={{ fontSize:11, fontWeight:600, color:"rgba(255,255,255,0.4)", letterSpacing:"0.08em", marginBottom:7 }}>M3U URL</div>
              <input value={m3uUrl} onChange={e => setM3uUrl(e.target.value)} placeholder="https://yourserver.com/playlist.m3u" style={{ width:"100%", background:"#0f0f13", border:"1px solid rgba(255,255,255,0.1)", borderRadius:10, padding:"11px 15px", color:"#f0f0f5", fontSize:13, fontFamily:"inherit" }} />
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:12, margin:"16px 0", color:"rgba(255,255,255,0.2)", fontSize:12 }}>
              <div style={{ flex:1, height:1, background:"rgba(255,255,255,0.08)" }} />OR<div style={{ flex:1, height:1, background:"rgba(255,255,255,0.08)" }} />
            </div>
            <div style={{ marginBottom:20 }}>
              <div style={{ fontSize:11, fontWeight:600, color:"rgba(255,255,255,0.4)", letterSpacing:"0.08em", marginBottom:7 }}>PASTE M3U CONTENT</div>
              <textarea value={m3uContent} onChange={e => setM3uContent(e.target.value)} placeholder={"#EXTM3U\n#EXTINF:-1 group-title=\"News\",BBC News\nhttp://stream.example.com/bbc.m3u8"} style={{ width:"100%", height:100, background:"#0f0f13", border:"1px solid rgba(255,255,255,0.1)", borderRadius:10, padding:"11px 15px", color:"#f0f0f5", fontSize:12, fontFamily:"monospace", resize:"none" }} />
            </div>
            {importMsg && (
              <div style={{ padding:"12px 16px", borderRadius:10, marginBottom:16, fontSize:13, background:importMsg.type==="success"?"rgba(34,197,94,0.1)":"rgba(239,68,68,0.1)", border:`1px solid ${importMsg.type==="success"?"rgba(34,197,94,0.25)":"rgba(239,68,68,0.25)"}`, color:importMsg.type==="success"?"#4ade80":"#f87171" }}>
                {importMsg.text}
              </div>
            )}
            <div style={{ display:"flex", gap:12 }}>
              <button onClick={() => setShowImport(false)} style={{ flex:1, background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", color:"#f0f0f5", padding:"12px", borderRadius:10, fontSize:14, fontFamily:"inherit", cursor:"pointer" }}>Cancel</button>
              <button onClick={handleImport} disabled={importing} style={{ flex:2, background:importing?"rgba(255,107,53,0.3)":"linear-gradient(135deg,#ff6b35,#e85d04)", border:"none", color:"#fff", padding:"12px", borderRadius:10, fontSize:14, fontWeight:600, fontFamily:"inherit", cursor:"pointer" }}>
                {importing ? "Importing..." : "Scan & Import"}
              </button>
            </div>
          </div>
        </div>
      )}

      <PlayerModal channel={playing} onClose={() => setPlaying(null)} onToggleWatchlist={toggleWatchlist} isWatchlisted={playing ? watchlist.includes(playing.id) : false} />

      {/* BROWSE */}
      {activeNav==="Browse" && (
        <>
          {!search && (
            <div style={{ position:"relative", minHeight:480, display:"flex", alignItems:"flex-end", padding:"0 36px 56px", overflow:"hidden", background:`radial-gradient(ellipse at 25% 60%,${featured.color}30 0%,transparent 55%),linear-gradient(to bottom,#1a0a00 0%,#0f0f13 100%)` }}>
              <div style={{ position:"absolute", inset:0, background:"linear-gradient(to bottom,rgba(15,15,19,0.3) 0%,rgba(15,15,19,0.95) 100%)" }} />
              <div style={{ maxWidth:600, zIndex:1, paddingTop:100, animation:"fadeUp 0.4s ease" }}>
                <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:18 }}>
                  <span style={{ background:"#ef4444", color:"#fff", fontSize:11, fontWeight:700, padding:"3px 10px", borderRadius:5, animation:"pulse 2s ease-in-out infinite" }}>● LIVE NOW</span>
                  <span style={{ fontSize:13, color:"rgba(255,255,255,0.4)" }}>{featured.group} · {featured.country}</span>
                </div>
                <div style={{ fontFamily:"'Playfair Display',serif", fontSize:52, fontWeight:800, lineHeight:1.05, marginBottom:16 }}>{featured.name}</div>
                <div style={{ fontSize:15, color:"rgba(255,255,255,0.52)", lineHeight:1.72, marginBottom:30, maxWidth:460 }}>{featured.desc}</div>
                <div style={{ display:"flex", gap:12 }}>
                  <button onClick={() => setPlaying(allChannels[0])} style={{ background:"linear-gradient(135deg,#ff6b35,#e85d04)", border:"none", color:"#fff", padding:"14px 34px", borderRadius:14, fontSize:15, fontWeight:700, fontFamily:"inherit", cursor:"pointer" }}>▶ Watch Now</button>
                  <button onClick={() => toggleWatchlist(featured.id)} style={{ background:"rgba(255,255,255,0.08)", border:"1px solid rgba(255,255,255,0.15)", color:"#fff", padding:"14px 28px", borderRadius:14, fontSize:15, fontFamily:"inherit", cursor:"pointer" }}>
                    {watchlist.includes(featured.id) ? "♥ Saved" : "♡ Add to List"}
                  </button>
                </div>
              </div>
            </div>
          )}

          <div style={{ padding:search?"90px 36px 40px":"36px" }}>
            {!search && (
              <div style={{ display:"flex", gap:24, marginBottom:32, padding:"14px 22px", background:"rgba(255,255,255,0.04)", borderRadius:14, border:"1px solid rgba(255,255,255,0.06)", width:"fit-content" }}>
                {[
                  { label:"Total", value:displayChannels.length, color:"#a78bfa" },
                  { label:"Online", value:online, color:"#22c55e" },
                  { label:"Degraded", value:degraded, color:"#f59e0b" },
                  { label:"Offline", value:offline, color:"#ef4444" },
                ].map((s,i) => (
                  <div key={i} style={{ textAlign:"center", padding:"0 16px", borderRight:i<3?"1px solid rgba(255,255,255,0.07)":"none" }}>
                    <div style={{ fontSize:22, fontWeight:700, color:s.color, fontFamily:"'Playfair Display',serif" }}>{s.value}</div>
                    <div style={{ fontSize:11, color:"rgba(255,255,255,0.35)", marginTop:2 }}>{s.label}</div>
                  </div>
                ))}
              </div>
            )}

            <div style={{ display:"flex", gap:9, marginBottom:32, flexWrap:"wrap" }}>
              {categories.map(cat => (
                <button key={cat} onClick={() => setActiveCategory(cat)} style={{ background:activeCategory===cat?"linear-gradient(135deg,#ff6b35,#e85d04)":"rgba(255,255,255,0.06)", border:activeCategory===cat?"none":"1px solid rgba(255,255,255,0.09)", color:activeCategory===cat?"#fff":"rgba(255,255,255,0.5)", padding:"7px 18px", borderRadius:24, fontSize:13, fontWeight:activeCategory===cat?600:400, fontFamily:"inherit", cursor:"pointer" }}>{cat}</button>
              ))}
            </div>

            {search || activeCategory!=="All" ? (
              <>
                <div style={{ fontSize:13, color:"rgba(255,255,255,0.35)", marginBottom:20 }}>{filteredBrowse.length} channels</div>
                <div className="grid-auto">
                  {filteredBrowse.map(c => <ChannelCard key={c.id||c.name} channel={c} onPlay={setPlaying} isWatchlisted={watchlist.includes(c.id)} onToggleWatchlist={toggleWatchlist} />)}
                </div>
              </>
            ) : (
              Object.entries(grouped).map(([cat, channels]) => (
                <div key={cat} style={{ marginBottom:44 }}>
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:18 }}>
                    <div style={{ fontFamily:"'Playfair Display',serif", fontSize:22, fontWeight:700 }}>{cat}</div>
                    <button onClick={() => setActiveCategory(cat)} style={{ background:"none", border:"none", color:"#ff6b35", fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>See all {channels.length} →</button>
                  </div>
                  <div className="hscroll">
                    {channels.map(c => (
                      <div key={c.id||c.name} style={{ flexShrink:0, width:185 }}>
                        <ChannelCard channel={c} onPlay={setPlaying} isWatchlisted={watchlist.includes(c.id)} onToggleWatchlist={toggleWatchlist} />
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}

      {/* WATCHLIST */}
      {activeNav==="Watchlist" && (
        <div style={{ padding:"90px 36px 40px" }}>
          <div style={{ fontFamily:"'Playfair Display',serif", fontSize:34, fontWeight:800, marginBottom:6 }}>My Watchlist</div>
          <div style={{ color:"rgba(255,255,255,0.38)", fontSize:14, marginBottom:32 }}>{displayChannels.filter(c=>watchlist.includes(c.id)).length} channels saved</div>
          {displayChannels.filter(c=>watchlist.includes(c.id)).length > 0 ? (
            <div className="grid-auto">
              {displayChannels.filter(c=>watchlist.includes(c.id)).map(c => <ChannelCard key={c.id} channel={c} onPlay={setPlaying} isWatchlisted={true} onToggleWatchlist={toggleWatchlist} />)}
            </div>
          ) : (
            <div style={{ textAlign:"center", padding:"80px 0", color:"rgba(255,255,255,0.2)" }}>
              <div style={{ fontSize:52, marginBottom:16 }}>📺</div>
              <div style={{ fontFamily:"'Playfair Display',serif", fontSize:18, marginBottom:10 }}>Your watchlist is empty</div>
              <div style={{ fontSize:13 }}>Browse channels and tap ♡ to save them here</div>
            </div>
          )}
        </div>
      )}

      {/* MONITOR */}
      {activeNav==="Monitor" && (
        <div style={{ padding:"90px 36px 40px" }}>
          <div style={{ display:"flex", alignItems:"flex-end", justifyContent:"space-between", marginBottom:32 }}>
            <div>
              <div style={{ fontFamily:"'Playfair Display',serif", fontSize:34, fontWeight:800, marginBottom:6 }}>Stream Monitor</div>
              <div style={{ color:"rgba(255,255,255,0.38)", fontSize:14 }}>Real-time health across all {displayChannels.length} channels</div>
            </div>
            <input value={monitorSearch} onChange={e => setMonitorSearch(e.target.value)} placeholder="Filter channels..." style={{ background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.09)", borderRadius:12, padding:"10px 16px", color:"#f0f0f5", fontSize:13, fontFamily:"inherit", width:230 }} />
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14, marginBottom:30 }}>
            {[
              { label:"Total Channels", value:displayChannels.length, color:"#a78bfa", icon:"📡" },
              { label:"Online", value:online, color:"#22c55e", icon:"✅" },
              { label:"Degraded", value:degraded, color:"#f59e0b", icon:"⚡" },
              { label:"Offline", value:offline, color:"#ef4444", icon:"❌" },
            ].map((s,i) => (
              <div key={i} style={{ background:"#1a1a22", borderRadius:16, padding:"22px 24px", border:`1px solid ${s.color}22` }}>
                <div style={{ fontSize:22, marginBottom:10 }}>{s.icon}</div>
                <div style={{ fontSize:32, fontWeight:800, color:s.color, fontFamily:"'Playfair Display',serif", marginBottom:4 }}>{s.value}</div>
                <div style={{ fontSize:13, color:"rgba(255,255,255,0.38)" }}>{s.label}</div>
              </div>
            ))}
          </div>

          <div style={{ background:"#1a1a22", borderRadius:16, overflow:"hidden", border:"1px solid rgba(255,255,255,0.06)" }}>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 100px 110px 100px 85px 90px", padding:"13px 22px", fontSize:11, color:"rgba(255,255,255,0.28)", letterSpacing:"0.1em", borderBottom:"1px solid rgba(255,255,255,0.06)", fontWeight:600 }}>
              <span>CHANNEL</span><span>GROUP</span><span>STATUS</span><span>LATENCY</span><span>UPTIME</span><span>ACTION</span>
            </div>
            {displayChannels.filter(c => !monitorSearch || c.name.toLowerCase().includes(monitorSearch.toLowerCase())).map((c,i,arr) => (
              <div key={c.id||c.name} style={{ display:"grid", gridTemplateColumns:"1fr 100px 110px 100px 85px 90px", padding:"13px 22px", borderBottom:i<arr.length-1?"1px solid rgba(255,255,255,0.04)":"none", alignItems:"center", fontSize:13 }}>
                <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                  <ChannelLogo logo={c.logo} color={c.color} name={c.name} size={36} radius={10} />
                  <div>
                    <div style={{ fontWeight:600, marginBottom:2 }}>{c.name}</div>
                    <div style={{ fontSize:11, color:"rgba(255,255,255,0.3)" }}>{c.country}</div>
                  </div>
                </div>
                <span style={{ fontSize:12, color:"rgba(255,255,255,0.38)" }}>{c.group}</span>
                <span style={{ display:"inline-flex", alignItems:"center", gap:6, fontSize:12, fontWeight:600, color:statusColor(c.status) }}>
                  <span style={{ width:7, height:7, borderRadius:"50%", background:statusColor(c.status) }} />{c.status}
                </span>
                <span style={{ color:c.latency?(c.latency<300?"#22c55e":"#f59e0b"):"#ef4444", fontWeight:500 }}>{c.latency?`${c.latency}ms`:"—"}</span>
                <span style={{ color:c.uptime>95?"#22c55e":c.uptime>82?"#f59e0b":"#ef4444", fontWeight:500 }}>{c.uptime}%</span>
                <button onClick={() => setPlaying(c)} style={{ background:"rgba(255,107,53,0.1)", border:"1px solid rgba(255,107,53,0.22)", color:"#ff6b35", padding:"6px 14px", borderRadius:8, cursor:"pointer", fontSize:12, fontFamily:"inherit", fontWeight:600 }}>Watch</button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}