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
  const fallback = name ? name.split(" ").map(w => w[0]).join("").slice(0, 3).toUpperCase() : "CH";
  const shortText = logo && !logo.startsWith("http") ? logo : fallback;
  return (
    <div style={{ width: size, height: size, borderRadius: radius, flexShrink: 0, position: "relative", overflow: "hidden" }}>
      <div style={{ position:"absolute", inset:0, background: color||"#333", display:"flex", alignItems:"center", justifyContent:"center", fontSize: size*0.22, fontWeight:900, color:"#fff" }}>
        {shortText}
      </div>
      {isUrl && !imgFailed && (
        <img src={logo} alt={name} onLoad={() => setImgLoaded(true)} onError={() => setImgFailed(true)}
          style={{ position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"contain", background:"#fff", padding:size*0.1, opacity:imgLoaded?1:0, transition:"opacity 0.2s ease" }} />
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
    setLoading(true); setPlayerError(null);
    const video = videoRef.current;
    const tryPlay = async () => {
      if (video.canPlayType("application/vnd.apple.mpegurl")) { video.src = channel.url; video.load(); setLoading(false); return; }
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
      } catch { setPlayerError("Could not load player."); setLoading(false); }
    };
    tryPlay();
    return () => { if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null; } };
  }, [channel?.url]);

  if (!channel) return null;
  return (
    <div onClick={onClose} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.92)", zIndex:400, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", backdropFilter:"blur(8px)", padding:16 }}>
      <div onClick={e => e.stopPropagation()} style={{ width:"min(92vw,960px)", animation:"fadeUp 0.25s ease" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16, flexWrap:"wrap", gap:10 }}>
          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            <ChannelLogo logo={channel.logo} color={channel.color} name={channel.name} size={44} radius={13} />
            <div>
              <div style={{ fontFamily:"'Playfair Display',serif", fontSize:"clamp(16px,4vw,22px)", fontWeight:800 }}>{channel.name}</div>
              <div style={{ display:"flex", alignItems:"center", gap:8, marginTop:4, flexWrap:"wrap" }}>
                {channel.status==="online" && <span style={{ background:"rgba(239,68,68,0.85)", color:"#fff", fontSize:10, fontWeight:700, padding:"2px 8px", borderRadius:4, animation:"pulse 2s ease-in-out infinite" }}>● LIVE</span>}
                <span style={{ fontSize:11, color:"rgba(255,255,255,0.4)" }}>{channel.group} · {channel.country}</span>
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
        <div style={{ width:"100%", aspectRatio:"16/9", background:"#000", borderRadius:16, overflow:"hidden", position:"relative", border:"1px solid rgba(255,255,255,0.08)" }}>
          {channel.url && !playerError ? (
            <>
              <video ref={videoRef} controls autoPlay playsInline style={{ width:"100%", height:"100%", objectFit:"contain", display:loading?"none":"block" }} />
              {loading && (
                <div style={{ position:"absolute", inset:0, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:16, background:"radial-gradient(ellipse at center,#1a1a2e 0%,#000 100%)" }}>
                  <div style={{ width:48, height:48, border:"3px solid rgba(255,107,53,0.2)", borderTopColor:"#ff6b35", borderRadius:"50%", animation:"spin 0.8s linear infinite" }} />
                  <div style={{ fontSize:13, color:"rgba(255,255,255,0.4)" }}>Connecting to stream...</div>
                </div>
              )}
            </>
          ) : (
            <div style={{ width:"100%", height:"100%", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:16, background:`radial-gradient(ellipse at center,${channel.color}22 0%,#000 100%)`, padding:20, textAlign:"center" }}>
              <ChannelLogo logo={channel.logo} color={channel.color} name={channel.name} size={64} radius={20} />
              <div style={{ fontSize:13, color:"rgba(255,255,255,0.45)", lineHeight:1.7, maxWidth:360 }}>
                {playerError || "✅ Import your M3U playlist to watch live."}
              </div>
            </div>
          )}
        </div>
        <div style={{ display:"flex", gap:24, marginTop:16, flexWrap:"wrap" }}>
          {[
            { label:"STATUS", value:channel.status?.toUpperCase(), color:statusColor(channel.status) },
            { label:"LATENCY", value:channel.latency?`${channel.latency}ms`:"N/A", color:"#22c55e" },
            { label:"UPTIME", value:`${channel.uptime}%`, color:"#a78bfa" },
            { label:"GROUP", value:channel.group, color:"#f0f0f5" },
          ].map((d,i) => (
            <div key={i}>
              <div style={{ fontSize:10, color:"rgba(255,255,255,0.3)", letterSpacing:"0.1em", marginBottom:4 }}>{d.label}</div>
              <div style={{ fontSize:13, color:d.color, fontWeight:600 }}>{d.value}</div>
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
      style={{ borderRadius:14, overflow:"hidden", background:"#1a1a22", border:"1px solid rgba(255,255,255,0.06)", cursor:"pointer", transition:"transform 0.22s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.22s ease", transform:hovered?"translateY(-5px) scale(1.02)":"none", boxShadow:hovered?"0 20px 40px rgba(0,0,0,0.5)":"none" }}>
      <div style={{ height:100, background:`radial-gradient(ellipse at 30% 40%,${channel.color}55 0%,${channel.color}11 60%,#111 100%)`, display:"flex", alignItems:"center", justifyContent:"center", position:"relative" }}>
        <ChannelLogo logo={channel.logo} color={channel.color} name={channel.name} size={52} radius={14} />
        <div style={{ position:"absolute", top:9, right:9, width:8, height:8, borderRadius:"50%", background:statusColor(channel.status), boxShadow:"0 0 0 2px rgba(0,0,0,0.5)" }} />
        <button onClick={e => { e.stopPropagation(); onToggleWatchlist(channel.id); }} style={{ position:"absolute", top:7, left:9, background:"none", border:"none", fontSize:14, cursor:"pointer", color:isWatchlisted?"#ff6b35":"rgba(255,255,255,0.3)" }}>
          {isWatchlisted ? "♥" : "♡"}
        </button>
        {channel.status==="online" && <div style={{ position:"absolute", bottom:7, left:9, background:"rgba(239,68,68,0.85)", color:"#fff", fontSize:9, fontWeight:700, padding:"2px 6px", borderRadius:4 }}>LIVE</div>}
        {hovered && (
          <div style={{ position:"absolute", inset:0, background:"rgba(0,0,0,0.5)", display:"flex", alignItems:"center", justifyContent:"center", backdropFilter:"blur(2px)" }}>
            <div style={{ width:40, height:40, borderRadius:"50%", background:"linear-gradient(135deg,#ff6b35,#e85d04)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:15 }}>▶</div>
          </div>
        )}
      </div>
      <div style={{ padding:"10px 12px 12px" }}>
        <div style={{ fontWeight:600, fontSize:12, marginBottom:3, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis", color:"#f0f0f5" }}>{channel.name}</div>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <span style={{ fontSize:10, color:"rgba(255,255,255,0.35)" }}>{channel.country} {channel.group}</span>
          <span style={{ fontSize:10, color:channel.uptime>95?"#22c55e":channel.uptime>82?"#f59e0b":"#ef4444", fontWeight:600 }}>{channel.uptime}%</span>
        </div>
      </div>
    </div>
  );
}

function ContactFooter() {
  return (
    <footer style={{ background:"#0a0a0e", borderTop:"1px solid rgba(255,255,255,0.06)", padding:"48px 20px 32px" }}>
      <div style={{ maxWidth:900, margin:"0 auto" }}>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(240px,1fr))", gap:40 }}>
          <div>
            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:14 }}>
              <div style={{ width:32, height:32, borderRadius:10, background:"linear-gradient(135deg,#ff6b35,#f7c59f)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, fontWeight:900, color:"#0f0f13" }}>S</div>
              <span style={{ fontFamily:"'Playfair Display',serif", fontWeight:800, fontSize:18, background:"linear-gradient(135deg,#ff6b35,#f7c59f)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>StreamPulse</span>
            </div>
            <p style={{ color:"rgba(255,255,255,0.38)", fontSize:13, lineHeight:1.75, maxWidth:280 }}>
              A professional IPTV platform with live stream monitoring, M3U import, and a growing community channel database.
            </p>
          </div>
          <div>
            <div style={{ fontSize:11, fontWeight:700, color:"rgba(255,255,255,0.3)", letterSpacing:"0.1em", marginBottom:16 }}>BUILT BY A DEVELOPER</div>
            <p style={{ color:"rgba(255,255,255,0.55)", fontSize:13, lineHeight:1.75, marginBottom:18 }}>
              Need a custom IPTV platform, Telegram bot, or Web3 tool? Let's talk.
            </p>
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              <a href="https://wa.me/447463638975" target="_blank" rel="noopener noreferrer"
                style={{ display:"inline-flex", alignItems:"center", gap:10, background:"rgba(37,211,102,0.1)", border:"1px solid rgba(37,211,102,0.25)", color:"#25d366", padding:"11px 16px", borderRadius:12, fontSize:13, fontWeight:600, textDecoration:"none" }}>
                <span style={{ fontSize:18 }}>💬</span> WhatsApp: +44 7463 638975
              </a>
              <a href="https://t.me/bravevoice" target="_blank" rel="noopener noreferrer"
                style={{ display:"inline-flex", alignItems:"center", gap:10, background:"rgba(0,136,204,0.1)", border:"1px solid rgba(0,136,204,0.25)", color:"#29abe2", padding:"11px 16px", borderRadius:12, fontSize:13, fontWeight:600, textDecoration:"none" }}>
                <span style={{ fontSize:18 }}>✈️</span> Telegram: @bravevoice
              </a>
            </div>
          </div>
        </div>
        <div style={{ borderTop:"1px solid rgba(255,255,255,0.05)", marginTop:36, paddingTop:20, display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:10 }}>
          <span style={{ fontSize:12, color:"rgba(255,255,255,0.2)" }}>© 2025 StreamPulse. All rights reserved.</span>
          <span style={{ fontSize:12, color:"rgba(255,255,255,0.2)" }}>Built with Next.js · Supabase · Vercel</span>
        </div>
      </div>
    </footer>
  );
}

export default function StreamPulse() {
  const [allChannels, setAllChannels] = useState(BUILTIN_CHANNELS);
  const [importedChannels, setImportedChannels] = useState([]);
  const [sharedChannels, setSharedChannels] = useState([]);
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sharedCount, setSharedCount] = useState(0);

  useEffect(() => { setAllChannels(withMockHealth(BUILTIN_CHANNELS)); }, []);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/import-m3u", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ url:"https://iptv-org.github.io/iptv/categories/news.m3u" }) });
        const data = await res.json();
        if (res.ok) setImportedChannels(withMockHealth(data.channels.map((c,i) => ({ ...c, id:`auto_${i}` }))));
      } catch {} finally { setAutoLoading(false); }
    };
    load();
  }, []);

  useEffect(() => {
    const loadShared = async () => {
      try {
        const res = await fetch("/api/shared-channels");
        const data = await res.json();
        if (res.ok && data.channels?.length) {
          setSharedChannels(withMockHealth(data.channels));
          setSharedCount(data.count);
        }
      } catch {}
    };
    loadShared();
  }, []);

  const featured = getFeatured();
  const displayChannels = [...allChannels, ...importedChannels, ...sharedChannels];
  const seen = new Set();
  const uniqueChannels = displayChannels.filter(c => {
    const key = `${c.name}|${c.url}`;
    if (seen.has(key)) return false;
    seen.add(key); return true;
  });

  const categories = ["All", ...new Set(uniqueChannels.map(c => c.group))];
  const online = uniqueChannels.filter(c => c.status==="online").length;
  const offline = uniqueChannels.filter(c => c.status==="offline").length;
  const degraded = uniqueChannels.filter(c => c.status==="degraded").length;

  const filteredBrowse = uniqueChannels.filter(c => {
    const matchCat = activeCategory==="All" || c.group===activeCategory;
    const matchSearch = search ? c.name.toLowerCase().includes(search.toLowerCase()) : true;
    return matchCat && matchSearch;
  });

  const grouped = categories.slice(1).reduce((acc, cat) => {
    acc[cat] = uniqueChannels.filter(c => c.group===cat);
    return acc;
  }, {});

  const toggleWatchlist = useCallback((id) => {
    setWatchlist(w => w.includes(id) ? w.filter(x => x!==id) : [...w, id]);
  }, []);

  const handleImport = async () => {
    if (!m3uUrl && !m3uContent) { setImportMsg({ type:"error", text:"Please enter a URL or paste M3U content." }); return; }
    setImporting(true); setImportMsg(null);
    try {
      const res = await fetch("/api/import-m3u", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ url:m3uUrl||undefined, content:m3uContent||undefined }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      const withHealth = withMockHealth(data.channels.map((c,i) => ({ ...c, id:`imported_${i}_${Date.now()}` })));
      setImportedChannels(prev => [...prev, ...withHealth]);
      setImportMsg({ type:"success", text:`✅ ${data.count} channels imported and shared with all users!` });
      setTimeout(() => { setShowImport(false); setM3uUrl(""); setM3uContent(""); }, 2200);
    } catch (err) {
      setImportMsg({ type:"error", text:`❌ ${err.message}` });
    } finally { setImporting(false); }
  };

  const navLinks = ["Browse","Watchlist","Monitor"];

  return (
    <div style={{ background:"#0f0f13", minHeight:"100vh", color:"#f0f0f5", fontFamily:"'DM Sans','Segoe UI',sans-serif", overflowX:"hidden" }}>
      <style suppressHydrationWarning>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Playfair+Display:wght@700;800&display=swap');
        * { box-sizing:border-box; margin:0; padding:0; }
        ::-webkit-scrollbar { height:4px; width:5px; }
        ::-webkit-scrollbar-thumb { background:rgba(255,255,255,0.12); border-radius:4px; }
        .hscroll { display:flex; gap:12px; overflow-x:auto; padding-bottom:8px; -webkit-overflow-scrolling:touch; }
        .grid-auto { display:grid; grid-template-columns:repeat(auto-fill,minmax(150px,1fr)); gap:12px; }
        input:focus,textarea:focus { outline:none; border-color:#ff6b35 !important; }
        @keyframes fadeUp { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes spin { to{transform:rotate(360deg)} }
        @keyframes slideDown { from{opacity:0;transform:translateY(-8px)} to{opacity:1;transform:translateY(0)} }

        /* Desktop nav items */
        .desktop-only { display:flex; }
        .mobile-only { display:none; }

        @media (max-width:768px) {
          .desktop-only { display:none !important; }
          .mobile-only { display:flex !important; }
          .grid-auto { grid-template-columns:repeat(auto-fill,minmax(140px,1fr)); gap:10px; }
          .stats-row { grid-template-columns:repeat(2,1fr) !important; }
          .monitor-scroll { overflow-x:auto; -webkit-overflow-scrolling:touch; }
          .monitor-inner { min-width:560px; }
        }
        @media (max-width:480px) {
          .grid-auto { grid-template-columns:repeat(2,1fr); }
        }
      `}</style>

      {/* ── NAV ── */}
      <nav style={{ position:"fixed", top:0, left:0, right:0, zIndex:300, height:62, display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 16px", background:"rgba(15,15,19,0.97)", backdropFilter:"blur(16px)", borderBottom:"1px solid rgba(255,255,255,0.06)" }}>
        {/* Logo */}
        <div style={{ display:"flex", alignItems:"center", gap:9 }}>
          <div style={{ width:34, height:34, borderRadius:10, background:"linear-gradient(135deg,#ff6b35,#f7c59f)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:15, fontWeight:900, color:"#0f0f13", fontFamily:"'Playfair Display',serif" }}>S</div>
          <span style={{ fontFamily:"'Playfair Display',serif", fontWeight:800, fontSize:18, background:"linear-gradient(135deg,#ff6b35,#f7c59f)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>StreamPulse</span>
        </div>

        {/* Desktop: nav links + search + import */}
        <div className="desktop-only" style={{ alignItems:"center", gap:28 }}>
          {navLinks.map(n => (
            <span key={n} onClick={() => setActiveNav(n)} style={{ cursor:"pointer", fontSize:14, color:activeNav===n?"#fff":"rgba(255,255,255,0.42)", fontWeight:activeNav===n?600:400, paddingBottom:3, borderBottom:activeNav===n?"2px solid #ff6b35":"2px solid transparent" }}>{n}</span>
          ))}
        </div>
        <div className="desktop-only" style={{ alignItems:"center", gap:10 }}>
          {autoLoading && <span style={{ fontSize:11, color:"rgba(255,255,255,0.35)", animation:"pulse 1.5s ease-in-out infinite" }}>Loading...</span>}
          <div style={{ position:"relative" }}>
            <span style={{ position:"absolute", left:11, top:"50%", transform:"translateY(-50%)", fontSize:12, opacity:0.4 }}>🔍</span>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search channels..." style={{ background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.09)", borderRadius:24, padding:"7px 14px 7px 30px", color:"#f0f0f5", fontSize:12, fontFamily:"inherit", width:190 }} />
          </div>
          <button onClick={() => setShowImport(true)} style={{ background:"linear-gradient(135deg,#ff6b35,#e85d04)", border:"none", color:"#fff", padding:"8px 18px", borderRadius:24, fontSize:12, fontWeight:600, fontFamily:"inherit", cursor:"pointer" }}>+ Import M3U</button>
        </div>

        {/* Mobile: hamburger */}
        <button className="mobile-only" onClick={() => setMobileMenuOpen(o => !o)}
          style={{ background: mobileMenuOpen?"rgba(255,107,53,0.15)":"rgba(255,255,255,0.08)", border: mobileMenuOpen?"1px solid rgba(255,107,53,0.4)":"1px solid rgba(255,255,255,0.1)", color:"#fff", width:40, height:40, borderRadius:10, cursor:"pointer", fontSize:20, alignItems:"center", justifyContent:"center" }}>
          {mobileMenuOpen ? "✕" : "☰"}
        </button>
      </nav>

      {/* ── MOBILE MENU DROPDOWN ── */}
      {mobileMenuOpen && (
        <div style={{ position:"fixed", top:62, left:0, right:0, zIndex:290, background:"#111118", borderBottom:"1px solid rgba(255,255,255,0.08)", padding:"16px", animation:"slideDown 0.2s ease", display:"flex", flexDirection:"column", gap:10 }}>
          {/* Search */}
          <div style={{ position:"relative" }}>
            <span style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", fontSize:13, opacity:0.4 }}>🔍</span>
            <input value={search} onChange={e => { setSearch(e.target.value); setMobileMenuOpen(false); }} placeholder="Search channels..." style={{ width:"100%", background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:12, padding:"11px 14px 11px 34px", color:"#f0f0f5", fontSize:14, fontFamily:"inherit" }} />
          </div>
          {/* Nav links */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8 }}>
            {navLinks.map(n => (
              <button key={n} onClick={() => { setActiveNav(n); setMobileMenuOpen(false); }}
                style={{ background:activeNav===n?"rgba(255,107,53,0.15)":"rgba(255,255,255,0.05)", border:activeNav===n?"1px solid rgba(255,107,53,0.35)":"1px solid rgba(255,255,255,0.08)", color:activeNav===n?"#ff6b35":"rgba(255,255,255,0.7)", padding:"10px 8px", borderRadius:10, cursor:"pointer", fontSize:13, fontFamily:"inherit", fontWeight:activeNav===n?700:400 }}>{n}</button>
            ))}
          </div>
          {/* Import button */}
          <button onClick={() => { setShowImport(true); setMobileMenuOpen(false); }}
            style={{ background:"linear-gradient(135deg,#ff6b35,#e85d04)", border:"none", color:"#fff", padding:"13px", borderRadius:12, fontSize:14, fontWeight:700, fontFamily:"inherit", cursor:"pointer", letterSpacing:"0.02em" }}>
            + Import M3U Playlist
          </button>
        </div>
      )}

      {/* ── IMPORT MODAL ── */}
      {showImport && (
        <div onClick={() => !importing && setShowImport(false)} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.85)", zIndex:500, display:"flex", alignItems:"center", justifyContent:"center", backdropFilter:"blur(6px)", padding:16 }}>
          <div onClick={e => e.stopPropagation()} style={{ background:"#1a1a22", borderRadius:20, padding:"28px 22px", width:"min(96vw,520px)", border:"1px solid rgba(255,107,53,0.18)", animation:"fadeUp 0.2s ease", maxHeight:"90vh", overflowY:"auto" }}>
            <div style={{ fontFamily:"'Playfair Display',serif", fontSize:22, fontWeight:800, marginBottom:6 }}>Import Playlist</div>
            <div style={{ background:"rgba(255,107,53,0.08)", border:"1px solid rgba(255,107,53,0.2)", borderRadius:10, padding:"10px 14px", marginBottom:18, fontSize:12, color:"rgba(255,255,255,0.5)", lineHeight:1.6 }}>
              🌍 <strong style={{ color:"#ff6b35" }}>Community powered</strong> — URL imports are saved and shared with all StreamPulse users permanently.
            </div>
            <div style={{ marginBottom:14 }}>
              <div style={{ fontSize:11, fontWeight:600, color:"rgba(255,255,255,0.4)", letterSpacing:"0.08em", marginBottom:6 }}>M3U URL</div>
              <input value={m3uUrl} onChange={e => setM3uUrl(e.target.value)} placeholder="https://yourserver.com/playlist.m3u" style={{ width:"100%", background:"#0f0f13", border:"1px solid rgba(255,255,255,0.1)", borderRadius:10, padding:"11px 14px", color:"#f0f0f5", fontSize:13, fontFamily:"inherit" }} />
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:10, margin:"12px 0", color:"rgba(255,255,255,0.2)", fontSize:12 }}>
              <div style={{ flex:1, height:1, background:"rgba(255,255,255,0.08)" }} />OR<div style={{ flex:1, height:1, background:"rgba(255,255,255,0.08)" }} />
            </div>
            <div style={{ marginBottom:16 }}>
              <div style={{ fontSize:11, fontWeight:600, color:"rgba(255,255,255,0.4)", letterSpacing:"0.08em", marginBottom:6 }}>PASTE M3U CONTENT</div>
              <textarea value={m3uContent} onChange={e => setM3uContent(e.target.value)} placeholder={"#EXTM3U\n#EXTINF:-1 group-title=\"News\",BBC News\nhttp://stream.example.com/bbc.m3u8"} style={{ width:"100%", height:88, background:"#0f0f13", border:"1px solid rgba(255,255,255,0.1)", borderRadius:10, padding:"10px 14px", color:"#f0f0f5", fontSize:12, fontFamily:"monospace", resize:"none" }} />
            </div>
            {importMsg && (
              <div style={{ padding:"11px 14px", borderRadius:10, marginBottom:14, fontSize:13, background:importMsg.type==="success"?"rgba(34,197,94,0.1)":"rgba(239,68,68,0.1)", border:`1px solid ${importMsg.type==="success"?"rgba(34,197,94,0.25)":"rgba(239,68,68,0.25)"}`, color:importMsg.type==="success"?"#4ade80":"#f87171" }}>
                {importMsg.text}
              </div>
            )}
            <div style={{ display:"flex", gap:10 }}>
              <button onClick={() => setShowImport(false)} style={{ flex:1, background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", color:"#f0f0f5", padding:"11px", borderRadius:10, fontSize:14, fontFamily:"inherit", cursor:"pointer" }}>Cancel</button>
              <button onClick={handleImport} disabled={importing} style={{ flex:2, background:importing?"rgba(255,107,53,0.3)":"linear-gradient(135deg,#ff6b35,#e85d04)", border:"none", color:"#fff", padding:"11px", borderRadius:10, fontSize:14, fontWeight:600, fontFamily:"inherit", cursor:"pointer" }}>
                {importing ? "Importing..." : "Scan & Import"}
              </button>
            </div>
          </div>
        </div>
      )}

      <PlayerModal channel={playing} onClose={() => setPlaying(null)} onToggleWatchlist={toggleWatchlist} isWatchlisted={playing ? watchlist.includes(playing.id) : false} />

      {/* ── BROWSE ── */}
      {activeNav==="Browse" && (
        <>
          {!search && (
            <div style={{ position:"relative", minHeight:380, display:"flex", alignItems:"flex-end", padding:"0 20px 36px", overflow:"hidden", background:`radial-gradient(ellipse at 25% 60%,${featured.color}30 0%,transparent 55%),linear-gradient(to bottom,#1a0a00 0%,#0f0f13 100%)` }}>
              <div style={{ position:"absolute", inset:0, background:"linear-gradient(to bottom,rgba(15,15,19,0.3) 0%,rgba(15,15,19,0.95) 100%)" }} />
              <div style={{ maxWidth:560, zIndex:1, paddingTop:80, animation:"fadeUp 0.4s ease", width:"100%" }}>
                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12, flexWrap:"wrap" }}>
                  <span style={{ background:"#ef4444", color:"#fff", fontSize:10, fontWeight:700, padding:"3px 10px", borderRadius:5, animation:"pulse 2s ease-in-out infinite" }}>● LIVE NOW</span>
                  <span style={{ fontSize:12, color:"rgba(255,255,255,0.4)" }}>{featured.group} · {featured.country}</span>
                </div>
                <div style={{ fontFamily:"'Playfair Display',serif", fontSize:"clamp(26px,6vw,50px)", fontWeight:800, lineHeight:1.08, marginBottom:12 }}>{featured.name}</div>
                <div style={{ fontSize:"clamp(12px,3vw,14px)", color:"rgba(255,255,255,0.52)", lineHeight:1.7, marginBottom:22, maxWidth:420 }}>{featured.desc}</div>
                <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
                  <button onClick={() => setPlaying(allChannels[0])} style={{ background:"linear-gradient(135deg,#ff6b35,#e85d04)", border:"none", color:"#fff", padding:"12px 26px", borderRadius:14, fontSize:14, fontWeight:700, fontFamily:"inherit", cursor:"pointer" }}>▶ Watch Now</button>
                  <button onClick={() => toggleWatchlist(featured.id)} style={{ background:"rgba(255,255,255,0.08)", border:"1px solid rgba(255,255,255,0.15)", color:"#fff", padding:"12px 20px", borderRadius:14, fontSize:14, fontFamily:"inherit", cursor:"pointer" }}>
                    {watchlist.includes(featured.id) ? "♥ Saved" : "♡ Add to List"}
                  </button>
                </div>
              </div>
            </div>
          )}

          <div style={{ padding:search?"74px 16px 40px":"16px 16px 40px" }}>
            {!search && (
              <>
                <div className="stats-row" style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10, marginBottom:18 }}>
                  {[
                    { label:"Total", value:uniqueChannels.length, color:"#a78bfa" },
                    { label:"Online", value:online, color:"#22c55e" },
                    { label:"Degraded", value:degraded, color:"#f59e0b" },
                    { label:"Offline", value:offline, color:"#ef4444" },
                  ].map((s,i) => (
                    <div key={i} style={{ textAlign:"center", padding:"14px 8px", background:"rgba(255,255,255,0.04)", borderRadius:12, border:"1px solid rgba(255,255,255,0.06)" }}>
                      <div style={{ fontSize:"clamp(18px,4vw,24px)", fontWeight:700, color:s.color, fontFamily:"'Playfair Display',serif" }}>{s.value}</div>
                      <div style={{ fontSize:10, color:"rgba(255,255,255,0.35)", marginTop:2 }}>{s.label}</div>
                    </div>
                  ))}
                </div>
                {sharedCount > 0 && (
                  <div style={{ background:"rgba(167,139,250,0.07)", border:"1px solid rgba(167,139,250,0.18)", borderRadius:12, padding:"10px 14px", marginBottom:16, fontSize:12, color:"rgba(255,255,255,0.5)", display:"flex", alignItems:"center", gap:8 }}>
                    🌍 <span><strong style={{ color:"#a78bfa" }}>{sharedCount.toLocaleString()} community channels</strong> shared by other StreamPulse users are included.</span>
                  </div>
                )}
              </>
            )}

            <div style={{ display:"flex", gap:7, marginBottom:20, flexWrap:"wrap" }}>
              {categories.map(cat => (
                <button key={cat} onClick={() => setActiveCategory(cat)} style={{ background:activeCategory===cat?"linear-gradient(135deg,#ff6b35,#e85d04)":"rgba(255,255,255,0.06)", border:activeCategory===cat?"none":"1px solid rgba(255,255,255,0.09)", color:activeCategory===cat?"#fff":"rgba(255,255,255,0.5)", padding:"6px 14px", borderRadius:24, fontSize:12, fontWeight:activeCategory===cat?600:400, fontFamily:"inherit", cursor:"pointer" }}>{cat}</button>
              ))}
            </div>

            {search || activeCategory!=="All" ? (
              <>
                <div style={{ fontSize:13, color:"rgba(255,255,255,0.35)", marginBottom:14 }}>{filteredBrowse.length} channels</div>
                <div className="grid-auto">
                  {filteredBrowse.map(c => <ChannelCard key={c.id||c.name} channel={c} onPlay={setPlaying} isWatchlisted={watchlist.includes(c.id)} onToggleWatchlist={toggleWatchlist} />)}
                </div>
              </>
            ) : (
              Object.entries(grouped).map(([cat, channels]) => (
                <div key={cat} style={{ marginBottom:34 }}>
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
                    <div style={{ fontFamily:"'Playfair Display',serif", fontSize:"clamp(17px,4vw,22px)", fontWeight:700 }}>{cat}</div>
                    <button onClick={() => setActiveCategory(cat)} style={{ background:"none", border:"none", color:"#ff6b35", fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:"inherit", whiteSpace:"nowrap" }}>See all {channels.length} →</button>
                  </div>
                  <div className="hscroll">
                    {channels.map(c => (
                      <div key={c.id||c.name} style={{ flexShrink:0, width:"clamp(145px,38vw,175px)" }}>
                        <ChannelCard channel={c} onPlay={setPlaying} isWatchlisted={watchlist.includes(c.id)} onToggleWatchlist={toggleWatchlist} />
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
          <ContactFooter />
        </>
      )}

      {/* ── WATCHLIST ── */}
      {activeNav==="Watchlist" && (
        <div style={{ padding:"74px 16px 40px" }}>
          <div style={{ fontFamily:"'Playfair Display',serif", fontSize:"clamp(22px,6vw,32px)", fontWeight:800, marginBottom:6 }}>My Watchlist</div>
          <div style={{ color:"rgba(255,255,255,0.38)", fontSize:13, marginBottom:24 }}>{uniqueChannels.filter(c=>watchlist.includes(c.id)).length} channels saved</div>
          {uniqueChannels.filter(c=>watchlist.includes(c.id)).length > 0 ? (
            <div className="grid-auto">
              {uniqueChannels.filter(c=>watchlist.includes(c.id)).map(c => <ChannelCard key={c.id} channel={c} onPlay={setPlaying} isWatchlisted={true} onToggleWatchlist={toggleWatchlist} />)}
            </div>
          ) : (
            <div style={{ textAlign:"center", padding:"60px 0", color:"rgba(255,255,255,0.2)" }}>
              <div style={{ fontSize:48, marginBottom:14 }}>📺</div>
              <div style={{ fontFamily:"'Playfair Display',serif", fontSize:18, marginBottom:8 }}>Your watchlist is empty</div>
              <div style={{ fontSize:13 }}>Browse channels and tap ♡ to save them here</div>
            </div>
          )}
          <ContactFooter />
        </div>
      )}

      {/* ── MONITOR ── */}
      {activeNav==="Monitor" && (
        <div style={{ padding:"74px 16px 40px" }}>
          <div style={{ display:"flex", alignItems:"flex-end", justifyContent:"space-between", marginBottom:20, flexWrap:"wrap", gap:12 }}>
            <div>
              <div style={{ fontFamily:"'Playfair Display',serif", fontSize:"clamp(22px,6vw,32px)", fontWeight:800, marginBottom:4 }}>Stream Monitor</div>
              <div style={{ color:"rgba(255,255,255,0.38)", fontSize:13 }}>{uniqueChannels.length} channels tracked</div>
            </div>
            <input value={monitorSearch} onChange={e => setMonitorSearch(e.target.value)} placeholder="Filter channels..." style={{ background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.09)", borderRadius:12, padding:"9px 14px", color:"#f0f0f5", fontSize:13, fontFamily:"inherit", width:"min(100%,220px)" }} />
          </div>

          <div className="stats-row" style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10, marginBottom:20 }}>
            {[
              { label:"Total", value:uniqueChannels.length, color:"#a78bfa", icon:"📡" },
              { label:"Online", value:online, color:"#22c55e", icon:"✅" },
              { label:"Degraded", value:degraded, color:"#f59e0b", icon:"⚡" },
              { label:"Offline", value:offline, color:"#ef4444", icon:"❌" },
            ].map((s,i) => (
              <div key={i} style={{ background:"#1a1a22", borderRadius:14, padding:"16px 12px", border:`1px solid ${s.color}22`, textAlign:"center" }}>
                <div style={{ fontSize:16, marginBottom:6 }}>{s.icon}</div>
                <div style={{ fontSize:"clamp(20px,4vw,28px)", fontWeight:800, color:s.color, fontFamily:"'Playfair Display',serif", marginBottom:2 }}>{s.value}</div>
                <div style={{ fontSize:11, color:"rgba(255,255,255,0.38)" }}>{s.label}</div>
              </div>
            ))}
          </div>

          <div className="monitor-scroll" style={{ background:"#1a1a22", borderRadius:14, overflow:"hidden", border:"1px solid rgba(255,255,255,0.06)" }}>
            <div className="monitor-inner">
              <div style={{ display:"grid", gridTemplateColumns:"1fr 80px 95px 85px 70px 80px", padding:"11px 16px", fontSize:10, color:"rgba(255,255,255,0.28)", letterSpacing:"0.1em", borderBottom:"1px solid rgba(255,255,255,0.06)", fontWeight:600 }}>
                <span>CHANNEL</span><span>GROUP</span><span>STATUS</span><span>LATENCY</span><span>UPTIME</span><span>ACTION</span>
              </div>
              {uniqueChannels.filter(c => !monitorSearch || c.name.toLowerCase().includes(monitorSearch.toLowerCase())).map((c,i,arr) => (
                <div key={c.id||c.name} style={{ display:"grid", gridTemplateColumns:"1fr 80px 95px 85px 70px 80px", padding:"10px 16px", borderBottom:i<arr.length-1?"1px solid rgba(255,255,255,0.04)":"none", alignItems:"center", fontSize:12 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:9 }}>
                    <ChannelLogo logo={c.logo} color={c.color} name={c.name} size={30} radius={8} />
                    <div style={{ overflow:"hidden" }}>
                      <div style={{ fontWeight:600, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis", maxWidth:110 }}>{c.name}</div>
                      <div style={{ fontSize:10, color:"rgba(255,255,255,0.3)" }}>{c.country}</div>
                    </div>
                  </div>
                  <span style={{ fontSize:11, color:"rgba(255,255,255,0.38)" }}>{c.group}</span>
                  <span style={{ display:"inline-flex", alignItems:"center", gap:5, fontSize:11, fontWeight:600, color:statusColor(c.status) }}>
                    <span style={{ width:6, height:6, borderRadius:"50%", background:statusColor(c.status), flexShrink:0 }} />{c.status}
                  </span>
                  <span style={{ color:c.latency?(c.latency<300?"#22c55e":"#f59e0b"):"#ef4444", fontWeight:500 }}>{c.latency?`${c.latency}ms`:"—"}</span>
                  <span style={{ color:c.uptime>95?"#22c55e":c.uptime>82?"#f59e0b":"#ef4444", fontWeight:500 }}>{c.uptime}%</span>
                  <button onClick={() => setPlaying(c)} style={{ background:"rgba(255,107,53,0.1)", border:"1px solid rgba(255,107,53,0.22)", color:"#ff6b35", padding:"5px 10px", borderRadius:7, cursor:"pointer", fontSize:11, fontFamily:"inherit", fontWeight:600 }}>Watch</button>
                </div>
              ))}
            </div>
          </div>
          <ContactFooter />
        </div>
      )}
    </div>
  );
}