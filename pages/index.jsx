import { useState, useEffect, useRef, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Search,
  Tv,
  Heart,
  Activity,
  X,
  Play,
  Download,
  Menu,
  Wifi,
  Loader2,
  ExternalLink,
  Lock,
  Shield,
  LogIn,
  LogOut,
  UserPlus,
  RefreshCw,
  AlertTriangle,
  Maximize,
  PictureInPicture2,
  Captions,
  Volume2,
  Gauge,
  History,
} from "lucide-react"
import Link from "next/link"
import { BUILTIN_CHANNELS, getFeatured } from "../lib/channels"
import { useAuth } from "../lib/auth-context"
import { stableChannelId } from "../lib/channel-id"
import { toggleId, fetchWatchlist, persistToggle } from "../lib/watchlist"
import { saveProgress, getProgress, clearProgress, getProgressList } from "../lib/progress"
import DemoNotice from "../components/DemoNotice"

// ─── Helpers ─────────────────────────────────────────────────────────────────

const statusColor = (s) =>
  s === "online"
    ? "text-emerald-400"
    : s === "degraded"
    ? "text-amber-400"
    : s === "unknown"
    ? "text-muted-foreground"
    : "text-rose-400"

const statusDot = (s) =>
  s === "online"
    ? "bg-emerald-400"
    : s === "degraded"
    ? "bg-amber-400"
    : s === "unknown"
    ? "bg-muted-foreground"
    : "bg-rose-400"

const withMockHealth = (channels) =>
  channels.map((c) => ({
    ...c,
    cid: stableChannelId(c),
    status: Math.random() > 0.12 ? "online" : Math.random() > 0.5 ? "degraded" : "offline",
    latency: Math.floor(Math.random() * 300) + 60,
    uptime: parseFloat((Math.random() * 15 + 84).toFixed(1)),
  }))

// ─── Channel logo with image fallback ────────────────────────────────────────

function ChannelLogo({ logo, color, name, size = "md" }) {
  const [imgFailed, setImgFailed] = useState(false)
  const [imgLoaded, setImgLoaded] = useState(false)
  const isUrl = logo && logo.startsWith("http")
  const fallback = name
    ? name
        .split(" ")
        .map((w) => w[0])
        .join("")
        .slice(0, 3)
        .toUpperCase()
    : "CH"
  const shortText = logo && !logo.startsWith("http") ? logo : fallback

  const sizes = {
    sm: "w-8 h-8 text-[11px] rounded-md",
    md: "w-14 h-14 text-xs rounded-xl",
    lg: "w-16 h-16 text-sm rounded-2xl",
  }

  return (
    <div className={`${sizes[size]} relative overflow-hidden flex-shrink-0`}>
      <div
        className="absolute inset-0 flex items-center justify-center font-black text-white"
        style={{ background: color || "#333" }}
      >
        {shortText}
      </div>
      {isUrl && !imgFailed && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={logo}
          alt={name}
          onLoad={() => setImgLoaded(true)}
          onError={() => setImgFailed(true)}
          className="absolute inset-0 w-full h-full object-contain bg-white p-1.5 transition-opacity duration-200"
          style={{ opacity: imgLoaded ? 1 : 0 }}
        />
      )}
    </div>
  )
}

// ─── HLS Player Modal ────────────────────────────────────────────────────────

function TrackSelect({ icon: Icon, label, value, onChange, options }) {
  if (!options || options.length <= 1) return null
  return (
    <label className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-muted px-2.5 py-1.5 text-xs font-semibold text-muted-foreground">
      <Icon className="size-3.5" aria-hidden="true" />
      <span className="sr-only">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="bg-transparent text-foreground focus:outline-none"
        aria-label={label}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value} className="bg-card text-foreground">
            {o.label}
          </option>
        ))}
      </select>
    </label>
  )
}

function PlayerModal({ channel, onClose, onToggleWatchlist, isWatchlisted }) {
  const videoRef = useRef(null)
  const hlsRef = useRef(null)
  const lastSaveRef = useRef(0)
  const [loading, setLoading] = useState(true)
  const [playerError, setPlayerError] = useState(null)
  const [levels, setLevels] = useState([])
  const [currentLevel, setCurrentLevel] = useState(-1)
  const [audioTracks, setAudioTracks] = useState([])
  const [currentAudio, setCurrentAudio] = useState(-1)
  const [subtitleTracks, setSubtitleTracks] = useState([])
  const [currentSubtitle, setCurrentSubtitle] = useState(-1)
  const [canPiP, setCanPiP] = useState(false)
  const [resumed, setResumed] = useState(null)

  const cid = channel ? (channel.cid ?? stableChannelId(channel)) : null

  // Persist playback position for "Continue watching" (VOD-style finite streams).
  const handleTimeUpdate = useCallback(() => {
    const v = videoRef.current
    if (!v || !cid || !isFinite(v.duration)) return
    const now = Date.now()
    if (now - lastSaveRef.current < 5000) return
    lastSaveRef.current = now
    saveProgress(cid, v.currentTime, v.duration, now)
  }, [cid])

  useEffect(() => {
    if (!channel?.url || !videoRef.current) {
      setLoading(false)
      return
    }
    setLoading(true)
    setPlayerError(null)
    setLevels([])
    setAudioTracks([])
    setSubtitleTracks([])
    setCurrentLevel(-1)
    const video = videoRef.current
    if (typeof document !== "undefined") {
      setCanPiP(!!document.pictureInPictureEnabled)
    }

    const saved = cid ? getProgress(cid) : null
    const seekToSaved = () => {
      if (saved?.position && isFinite(video.duration) && video.duration > 0) {
        video.currentTime = Math.min(saved.position, video.duration - 5)
        setResumed(Math.floor(saved.position))
      }
    }

    const tryPlay = async () => {
      if (video.canPlayType("application/vnd.apple.mpegurl")) {
        // Native HLS (Safari/iOS) — track menus handled by the OS player.
        video.src = channel.url
        video.load()
        video.addEventListener("loadedmetadata", seekToSaved, { once: true })
        setLoading(false)
        return
      }
      try {
        const Hls = (await import("hls.js")).default
        if (Hls.isSupported()) {
          const hls = new Hls({ enableWorker: false })
          hlsRef.current = hls
          hls.loadSource(channel.url)
          hls.attachMedia(video)
          hls.on(Hls.Events.MANIFEST_PARSED, (_, data) => {
            setLoading(false)
            setLevels(hls.levels || [])
            setCurrentLevel(hls.currentLevel)
            setAudioTracks(hls.audioTracks || [])
            setCurrentAudio(hls.audioTrack)
            setSubtitleTracks(hls.subtitleTracks || [])
            setCurrentSubtitle(hls.subtitleTrack)
            seekToSaved()
            video.play().catch(() => {})
          })
          hls.on(Hls.Events.LEVEL_SWITCHED, (_, d) => setCurrentLevel(d.level))
          hls.on(Hls.Events.AUDIO_TRACK_SWITCHED, (_, d) => setCurrentAudio(d.id))
          hls.on(Hls.Events.SUBTITLE_TRACK_SWITCH, (_, d) => setCurrentSubtitle(d.id))
          hls.on(Hls.Events.ERROR, (_, data) => {
            if (data.fatal) {
              setPlayerError("Stream unavailable or blocked by CORS.")
              setLoading(false)
            }
          })
        } else {
          setPlayerError("Your browser can't play this stream.")
          setLoading(false)
        }
      } catch {
        setPlayerError("Could not load player.")
        setLoading(false)
      }
    }
    tryPlay()
    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy()
        hlsRef.current = null
      }
    }
  }, [channel?.url, cid])

  const setQuality = (idx) => {
    setCurrentLevel(idx)
    if (hlsRef.current) hlsRef.current.currentLevel = idx
  }
  const setAudio = (id) => {
    setCurrentAudio(id)
    if (hlsRef.current) hlsRef.current.audioTrack = id
  }
  const setSubtitle = (id) => {
    setCurrentSubtitle(id)
    if (hlsRef.current) {
      hlsRef.current.subtitleTrack = id
      hlsRef.current.subtitleDisplay = id !== -1
    }
  }
  const togglePiP = async () => {
    const v = videoRef.current
    if (!v) return
    try {
      if (document.pictureInPictureElement) await document.exitPictureInPicture()
      else await v.requestPictureInPicture()
    } catch {}
  }
  const goFullscreen = () => {
    const v = videoRef.current
    if (v?.requestFullscreen) v.requestFullscreen().catch(() => {})
    else if (v?.webkitEnterFullscreen) v.webkitEnterFullscreen()
  }

  if (!channel) return null

  const qualityOptions = [
    { value: -1, label: "Auto" },
    ...levels.map((l, i) => ({ value: i, label: l.height ? `${l.height}p` : `${Math.round((l.bitrate || 0) / 1000)}k` })),
  ]
  const audioOptions = audioTracks.map((t) => ({ value: t.id, label: t.name || t.lang || `Audio ${t.id + 1}` }))
  const subtitleOptions = [
    { value: -1, label: "Off" },
    ...subtitleTracks.map((t) => ({ value: t.id, label: t.name || t.lang || `Sub ${t.id + 1}` })),
  ]

  return (
    <AnimatePresence>
      <motion.div
        key="player-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/95 backdrop-blur-xl"
      >
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 20, opacity: 0 }}
          transition={{ duration: 0.25 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-4xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
            <div className="flex items-center gap-3">
              <ChannelLogo logo={channel.logo} color={channel.color} name={channel.name} size="md" />
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-foreground">{channel.name}</h2>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  {channel.status === "online" && (
                    <span className="inline-flex items-center gap-1 rounded bg-[#6d35ff] px-2 py-0.5 text-[11px] font-bold text-white animate-pulse-live">
                      ● LIVE
                    </span>
                  )}
                  <span className="text-xs text-muted-foreground">
                    {channel.group} · {channel.country}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => onToggleWatchlist(channel.cid ?? stableChannelId(channel))}
                className={`flex h-10 w-10 items-center justify-center rounded-full border transition-colors ${
                  isWatchlisted
                    ? "border-rose-500/50 bg-rose-500/10 text-rose-400"
                    : "border-border bg-muted text-muted-foreground hover:text-foreground"
                }`}
                aria-label={`${isWatchlisted ? "Remove" : "Add"} ${channel.name} ${isWatchlisted ? "from" : "to"} watchlist`}
                aria-pressed={isWatchlisted}
              >
                <Heart className={`size-4 ${isWatchlisted ? "fill-rose-400" : ""}`} />
              </button>
              <button
                onClick={onClose}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-muted text-muted-foreground hover:text-foreground"
                aria-label="Close player"
              >
                <X className="size-4" />
              </button>
            </div>
          </div>

          {/* Video frame */}
          <div className="relative w-full aspect-video overflow-hidden rounded-2xl border border-border bg-black">
            {channel.url && !playerError ? (
              <>
                <video
                  ref={videoRef}
                  controls
                  autoPlay
                  playsInline
                  onTimeUpdate={handleTimeUpdate}
                  onEnded={() => cid && clearProgress(cid)}
                  className="h-full w-full object-contain"
                  style={{ display: loading ? "none" : "block" }}
                />
                {loading && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-gradient-to-br from-background to-black">
                    <Loader2 className="size-12 animate-spin text-[#6d35ff]" />
                    <div className="text-sm text-muted-foreground">Connecting to stream…</div>
                  </div>
                )}
              </>
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center gap-4 p-6 text-center">
                <ChannelLogo logo={channel.logo} color={channel.color} name={channel.name} size="lg" />
                <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
                  {playerError ||
                    "Stream not available. Try importing your own M3U playlist instead."}
                </p>
              </div>
            )}
          </div>

          {/* Player controls — quality / audio / subtitles / PiP / fullscreen */}
          {channel.url && !playerError && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <TrackSelect icon={Gauge} label="Stream quality" value={currentLevel} onChange={setQuality} options={qualityOptions} />
              <TrackSelect icon={Volume2} label="Audio track" value={currentAudio} onChange={setAudio} options={audioOptions} />
              <TrackSelect icon={Captions} label="Subtitles" value={currentSubtitle} onChange={setSubtitle} options={subtitleOptions} />
              {resumed != null && (
                <span className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-muted px-2.5 py-1.5 text-xs text-muted-foreground">
                  <History className="size-3.5" aria-hidden="true" /> Resumed
                </span>
              )}
              <div className="ml-auto flex items-center gap-2">
                {canPiP && (
                  <button
                    onClick={togglePiP}
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-muted text-muted-foreground hover:text-foreground"
                    aria-label="Picture in picture"
                  >
                    <PictureInPicture2 className="size-4" />
                  </button>
                )}
                <button
                  onClick={goFullscreen}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-muted text-muted-foreground hover:text-foreground"
                  aria-label="Fullscreen"
                >
                  <Maximize className="size-4" />
                </button>
              </div>
            </div>
          )}

          {/* Stats row */}
          <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { label: "STATUS", value: channel.status?.toUpperCase(), tone: statusColor(channel.status) },
              { label: "LATENCY", value: channel.latency ? `${channel.latency}ms` : "—", tone: "text-emerald-400" },
              { label: "UPTIME", value: `${channel.uptime}%`, tone: "text-foreground" },
              { label: "GROUP", value: channel.group, tone: "text-foreground" },
            ].map((s) => (
              <div key={s.label}>
                <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {s.label}
                </div>
                <div className={`text-sm font-semibold ${s.tone}`}>{s.value}</div>
              </div>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

// ─── Channel Card ────────────────────────────────────────────────────────────

function ChannelCard({ channel, onPlay, isWatchlisted, onToggleWatchlist, isLocked }) {
  return (
    <motion.div
      whileHover={{ y: -6 }}
      transition={{ duration: 0.25 }}
      onClick={() => onPlay(channel)}
      className="group relative cursor-pointer overflow-hidden rounded-2xl glass-card flex flex-col"
    >
      {/* Header gradient block */}
      <div
        className="relative h-28 flex items-center justify-center"
        style={{
          background: `radial-gradient(ellipse at 30% 40%, ${channel.color}55 0%, ${channel.color}22 60%, transparent 100%)`,
        }}
      >
        <ChannelLogo logo={channel.logo} color={channel.color} name={channel.name} size="md" />

        {/* Status dot */}
        <div
          className={`absolute right-2.5 top-2.5 h-2 w-2 rounded-full ring-2 ring-background ${statusDot(
            channel.status,
          )}`}
        />

        {/* Watchlist heart */}
        <button
          onClick={(e) => {
            e.stopPropagation()
            onToggleWatchlist(channel.cid ?? stableChannelId(channel))
          }}
          className="absolute left-2 top-2 flex h-9 w-9 items-center justify-center rounded-md transition-colors"
          aria-label={`${isWatchlisted ? "Remove" : "Add"} ${channel.name} ${isWatchlisted ? "from" : "to"} watchlist`}
          aria-pressed={isWatchlisted}
        >
          <Heart
            className={`size-4 ${
              isWatchlisted ? "fill-rose-400 text-rose-400" : "text-white/40 group-hover:text-white/70"
            }`}
          />
        </button>

        {/* LIVE badge */}
        {channel.status === "online" && !isLocked && (
          <div className="absolute bottom-2 left-2 rounded bg-[#6d35ff] px-1.5 py-0.5 text-[11px] font-bold text-white">
            LIVE
          </div>
        )}

        {/* Lock badge for non-free channels */}
        {isLocked && (
          <div className="absolute bottom-2 left-2 flex items-center gap-1 rounded bg-amber-600/90 px-1.5 py-0.5 text-[11px] font-bold text-white">
            <Lock className="size-2.5" /> VERIFIED
          </div>
        )}

        {/* Hover overlay — play or lock */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100">
          {isLocked ? (
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-amber-600 shadow-lg shadow-amber-500/50">
              <Lock className="size-4 text-white" />
            </div>
          ) : (
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-[#6d35ff] to-[#2ebfff] shadow-lg shadow-[#6d35ff]/50">
              <Play className="size-4 fill-white text-white" />
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="px-3 pb-3 pt-2.5">
        <div className="truncate text-sm font-semibold text-foreground">{channel.name}</div>
        <div className="mt-0.5 flex items-center justify-between text-[11px]">
          <span className="text-muted-foreground">
            {channel.country} {channel.group}
          </span>
          {isLocked ? (
            <span className="flex items-center gap-0.5 font-semibold text-amber-400">
              <Lock className="size-2.5" /> Locked
            </span>
          ) : (
            <span
              className={`font-semibold ${
                channel.uptime > 95
                  ? "text-emerald-400"
                  : channel.uptime > 82
                  ? "text-amber-400"
                  : "text-rose-400"
              }`}
            >
              {channel.uptime}%
            </span>
          )}
        </div>
      </div>
    </motion.div>
  )
}

// ─── Footer ──────────────────────────────────────────────────────────────────

function ContactFooter() {
  return (
    <footer className="mt-20 border-t border-border bg-background/60">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-2">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-white ring-2 ring-violet-500/50 shadow-lg shadow-violet-500/30">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/images/logo.png"
                  alt="Anointed Coder logo"
                  className="h-full w-full object-contain"
                />
              </div>
              <span className="text-lg font-bold tracking-tight text-foreground">
                Anointed{" "}
                <span className="bg-gradient-to-r from-[#6d35ff] to-[#2ebfff] bg-clip-text text-transparent">
                  IPTV
                </span>
              </span>
            </div>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-muted-foreground">
              A live demo by{" "}
              <a
                href="https://anointedcoder.com"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-foreground hover:text-rose-400"
              >
                Anointed Coder
              </a>{" "}
              showcasing live HLS playback, account-saved watchlists, M3U playlist import, and
              simulated stream-health monitoring. Ships with free public test streams — fully legal
              demo content.
            </p>
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Need a custom build?
            </div>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Anointed Coder builds production-grade web apps, automation, and live demos like this
              one. Streaming platforms, dashboards, bots, AI tools.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <a
                href="https://anointedcoder.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#6d35ff] to-[#2ebfff] px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-[#6d35ff]/30 hover:opacity-90"
              >
                Visit Anointed Coder <ExternalLink className="size-4" />
              </a>
              <a
                href="mailto:info@anointedcoder.com"
                className="inline-flex items-center gap-2 rounded-xl border border-border bg-muted px-5 py-2.5 text-sm font-semibold text-foreground hover:bg-accent"
              >
                info@anointedcoder.com
              </a>
            </div>
          </div>
        </div>
        <div className="mt-10 border-t border-border pt-6 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} Anointed Coder. All rights reserved.
        </div>
      </div>
    </footer>
  )
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function AnointedIPTV() {
  const { user, logout, resendVerification } = useAuth()
  const [allChannels, setAllChannels] = useState(BUILTIN_CHANNELS)
  const [importedChannels, setImportedChannels] = useState([])
  const [watchlist, setWatchlist] = useState([])
  const [resendState, setResendState] = useState(null) // null | "sending" | "sent" | "error"
  const [playing, setPlaying] = useState(null)
  const [search, setSearch] = useState("")
  const [activeNav, setActiveNav] = useState("Browse")
  const [activeCategory, setActiveCategory] = useState("All")
  const [showImport, setShowImport] = useState(false)
  const [m3uUrl, setM3uUrl] = useState("")
  const [m3uContent, setM3uContent] = useState("")
  const [importing, setImporting] = useState(false)
  const [importMsg, setImportMsg] = useState(null)
  const [monitorSearch, setMonitorSearch] = useState("")
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [showLockedModal, setShowLockedModal] = useState(false)
  const [healthChecks, setHealthChecks] = useState({}) // cid -> { status, latency, checking }
  const [continueCids, setContinueCids] = useState([]) // continue-watching, newest first

  // Verified users can access all channels, others see only isFree channels unlocked
  const isVerifiedUser = user?.is_verified

  const handlePlayChannel = useCallback(
    (channel) => {
      const locked = !channel.isFree && !isVerifiedUser
      if (locked) {
        setShowLockedModal(true)
        return
      }
      setPlaying(channel)
    },
    [isVerifiedUser],
  )

  useEffect(() => {
    setAllChannels(withMockHealth(BUILTIN_CHANNELS))
  }, [])

  // Load any previously-saved shared/imported channels (best-effort).
  useEffect(() => {
    fetch("/api/shared-channels")
      .then((r) => r.json())
      .then((d) => {
        if (d?.channels?.length) {
          setImportedChannels((prev) => {
            const have = new Set(prev.map((c) => c.cid))
            const fresh = withMockHealth(d.channels).filter((c) => !have.has(c.cid))
            return [...prev, ...fresh]
          })
        }
      })
      .catch(() => {})
  }, [])

  // Continue-watching: refresh from localStorage on mount and whenever the player closes.
  useEffect(() => {
    if (!playing) setContinueCids(getProgressList().map((e) => e.cid))
  }, [playing])

  // Hydrate the watchlist: from the account when signed in, else from localStorage.
  useEffect(() => {
    if (user) {
      fetchWatchlist().then((ids) => {
        if (ids) setWatchlist(ids)
      })
    } else {
      try {
        const saved = JSON.parse(localStorage.getItem("iptv_watchlist") || "[]")
        if (Array.isArray(saved)) setWatchlist(saved)
      } catch {}
    }
  }, [user])

  const featured = getFeatured()
  const featuredCid = stableChannelId(featured)
  const displayChannels = [...allChannels, ...importedChannels]
  const seen = new Set()
  const uniqueChannels = displayChannels.filter((c) => {
    const key = `${c.name}|${c.url}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })

  const categories = ["All", ...new Set(uniqueChannels.map((c) => c.group))]
  const online = uniqueChannels.filter((c) => c.status === "online").length
  const offline = uniqueChannels.filter((c) => c.status === "offline").length
  const degraded = uniqueChannels.filter((c) => c.status === "degraded").length

  const filteredBrowse = uniqueChannels.filter((c) => {
    const matchCat = activeCategory === "All" || c.group === activeCategory
    const matchSearch = search ? c.name.toLowerCase().includes(search.toLowerCase()) : true
    return matchCat && matchSearch
  })

  const grouped = categories.slice(1).reduce((acc, cat) => {
    acc[cat] = uniqueChannels.filter((c) => c.group === cat)
    return acc
  }, {})

  const toggleWatchlist = useCallback(
    (cid) => {
      if (!cid) return
      setWatchlist((w) => {
        const next = toggleId(w, cid)
        const action = next.includes(cid) ? "add" : "remove"
        if (user) persistToggle(cid, action)
        else {
          try {
            localStorage.setItem("iptv_watchlist", JSON.stringify(next))
          } catch {}
        }
        return next
      })
    },
    [user],
  )

  const runHealthCheck = useCallback(async (channel) => {
    const cid = channel.cid ?? stableChannelId(channel)
    setHealthChecks((h) => ({ ...h, [cid]: { ...h[cid], checking: true } }))
    try {
      const res = await fetch("/api/health-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ streamUrl: channel.url }),
      })
      const data = await res.json()
      setHealthChecks((h) => ({
        ...h,
        [cid]: { status: data.status, latency: data.latency, checking: false, real: true },
      }))
    } catch {
      setHealthChecks((h) => ({ ...h, [cid]: { status: "unknown", latency: null, checking: false, real: true } }))
    }
  }, [])

  const handleResendVerification = useCallback(async () => {
    setResendState("sending")
    try {
      await resendVerification()
      setResendState("sent")
    } catch {
      setResendState("error")
    }
  }, [resendVerification])

  const handleImport = async () => {
    if (!m3uUrl && !m3uContent) {
      setImportMsg({ type: "error", text: "Please enter a URL or paste M3U content." })
      return
    }
    setImporting(true)
    setImportMsg(null)
    try {
      const res = await fetch("/api/import-m3u", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: m3uUrl || undefined, content: m3uContent || undefined }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      const withHealth = withMockHealth(
        data.channels.map((c) => ({ ...c, id: stableChannelId(c) })),
      )
      setImportedChannels((prev) => {
        const have = new Set(prev.map((c) => c.cid))
        return [...prev, ...withHealth.filter((c) => !have.has(c.cid))]
      })
      setImportMsg({ type: "success", text: `Loaded ${data.count} channels from playlist.` })

      // Best-effort persistence so imports survive a refresh (silent if Supabase unset).
      fetch("/api/save-channels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channels: data.channels, sourceUrl: m3uUrl || null }),
      }).catch(() => {})

      setTimeout(() => {
        setShowImport(false)
        setM3uUrl("")
        setM3uContent("")
      }, 2000)
    } catch (err) {
      setImportMsg({ type: "error", text: err.message || "Import failed." })
    } finally {
      setImporting(false)
    }
  }

  const navLinks = [
    { name: "Browse", icon: Tv },
    { name: "Watchlist", icon: Heart },
    { name: "Monitor", icon: Activity },
  ]

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ── NAV ─────────────────────────────────────────────────────── */}
      <nav className="fixed inset-x-0 top-0 z-40 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-white ring-2 ring-violet-500/50 shadow-lg shadow-violet-500/30">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/logo.png"
                alt="Anointed Coder logo"
                className="h-full w-full object-contain"
              />
            </div>
            <span className="text-base font-bold tracking-tight text-foreground sm:text-lg">
              Anointed{" "}
              <span className="bg-gradient-to-r from-[#6d35ff] to-[#2ebfff] bg-clip-text text-transparent">
                IPTV
              </span>
            </span>
          </div>

          {/* Desktop nav */}
          <div className="hidden items-center gap-1 md:flex">
            {navLinks.map((link) => {
              const Icon = link.icon
              const active = activeNav === link.name
              return (
                <button
                  key={link.name}
                  onClick={() => setActiveNav(link.name)}
                  className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${
                    active
                      ? "bg-muted text-foreground"
                      : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                  }`}
                >
                  <Icon className="size-4" />
                  {link.name}
                </button>
              )
            })}
          </div>

          {/* Search + Import + Auth (desktop) */}
          <div className="hidden items-center gap-2 md:flex">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search channels…"
                className="w-48 rounded-xl border border-border bg-muted py-2 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-[#6d35ff] focus:outline-none"
              />
            </div>
            <button
              onClick={() => setShowImport(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#6d35ff] to-[#2ebfff] px-4 py-2 text-sm font-bold text-white shadow-lg shadow-[#6d35ff]/30 hover:opacity-90"
            >
              <Download className="size-4" /> Import M3U
            </button>
            {user ? (
              <div className="flex items-center gap-2">
                {user.is_admin && (
                  <Link href="/admin" className="flex items-center gap-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs font-semibold text-amber-400 hover:bg-amber-500/20">
                    <Shield className="size-3" /> Admin
                  </Link>
                )}
                <button
                  onClick={logout}
                  className="flex items-center gap-1.5 rounded-xl border border-border bg-muted px-3 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground"
                >
                  <LogOut className="size-3" /> Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/login" className="flex items-center gap-1.5 rounded-xl border border-border bg-muted px-3 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground">
                  <LogIn className="size-3" /> Log in
                </Link>
                <Link href="/signup" className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#6d35ff] to-[#2ebfff] px-3 py-2 text-xs font-bold text-white hover:opacity-90">
                  <UserPlus className="size-3" /> Sign up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileMenuOpen((o) => !o)}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-muted text-foreground md:hidden"
            aria-label="Open menu"
          >
            {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>

        {/* Mobile menu dropdown */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="border-b border-border bg-background md:hidden"
            >
              <div className="space-y-3 px-4 py-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value)
                      setMobileMenuOpen(false)
                    }}
                    placeholder="Search channels…"
                    className="w-full rounded-xl border border-border bg-muted py-2.5 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-[#6d35ff] focus:outline-none"
                  />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {navLinks.map((link) => {
                    const active = activeNav === link.name
                    const Icon = link.icon
                    return (
                      <button
                        key={link.name}
                        onClick={() => {
                          setActiveNav(link.name)
                          setMobileMenuOpen(false)
                        }}
                        className={`flex flex-col items-center gap-1 rounded-xl px-3 py-3 text-xs font-semibold transition-colors ${
                          active
                            ? "bg-rose-500/10 text-rose-400"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        <Icon className="size-4" />
                        {link.name}
                      </button>
                    )
                  })}
                </div>
                <button
                  onClick={() => {
                    setShowImport(true)
                    setMobileMenuOpen(false)
                  }}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#6d35ff] to-[#2ebfff] px-4 py-3 text-sm font-bold text-white"
                >
                  <Download className="size-4" /> Import M3U Playlist
                </button>
                {user ? (
                  <div className="flex gap-2">
                    {user.is_admin && (
                      <Link href="/admin" onClick={() => setMobileMenuOpen(false)} className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm font-semibold text-amber-400">
                        <Shield className="size-4" /> Admin
                      </Link>
                    )}
                    <button
                      onClick={() => { logout(); setMobileMenuOpen(false) }}
                      className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-border bg-muted px-4 py-3 text-sm font-semibold text-muted-foreground"
                    >
                      <LogOut className="size-4" /> Logout
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <Link href="/login" onClick={() => setMobileMenuOpen(false)} className="flex items-center justify-center gap-2 rounded-xl border border-border bg-muted px-4 py-3 text-sm font-semibold text-muted-foreground">
                      <LogIn className="size-4" /> Log in
                    </Link>
                    <Link href="/signup" onClick={() => setMobileMenuOpen(false)} className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#6d35ff] to-[#2ebfff] px-4 py-3 text-sm font-bold text-white">
                      <UserPlus className="size-4" /> Sign up
                    </Link>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* ── UNVERIFIED EMAIL BANNER ──────────────────────────────────── */}
      {user && !user.is_verified && (
        <div className="pt-16">
          <div className="border-b border-amber-500/20 bg-amber-500/10">
            <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-2.5 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
              <div className="flex items-start gap-2 text-xs text-amber-200">
                <AlertTriangle className="mt-0.5 size-4 flex-shrink-0" aria-hidden="true" />
                <span>
                  Verify your email to unlock all channels.{" "}
                  <span className="text-amber-200/70">
                    Demo — the email is sent via an external service and may not always arrive.
                  </span>
                </span>
              </div>
              <button
                onClick={handleResendVerification}
                disabled={resendState === "sending" || resendState === "sent"}
                className="inline-flex flex-shrink-0 items-center justify-center gap-1.5 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-200 hover:bg-amber-500/20 disabled:opacity-70"
              >
                {resendState === "sending"
                  ? "Sending…"
                  : resendState === "sent"
                  ? "Email sent ✓"
                  : resendState === "error"
                  ? "Failed — retry"
                  : "Resend verification email"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── LOCKED CHANNEL MODAL ─────────────────────────────────────── */}
      <AnimatePresence>
        {showLockedModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowLockedModal(false)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 p-4 backdrop-blur-xl"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 20, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center"
            >
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/10">
                <Lock className="size-8 text-amber-400" />
              </div>
              <h2 className="mt-4 text-2xl font-bold text-foreground">Verified Members Only — Free</h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {user && !user.is_verified
                  ? "Your account isn't verified yet. Check your email and click the verification link to unlock all channels."
                  : "Create a free account and verify your email to unlock 60+ live channels — news, documentaries, music, kids' shows and more."}
              </p>
              <DemoNotice k="payments" className="mt-4 text-left" />
              <div className="mt-6 flex flex-col gap-3">
                {user && !user.is_verified ? (
                  <button
                    onClick={() => setShowLockedModal(false)}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#6d35ff] to-[#2ebfff] px-6 py-3 text-sm font-bold text-white"
                  >
                    OK, I'll check my email
                  </button>
                ) : (
                  <>
                    <Link
                      href="/signup"
                      onClick={() => setShowLockedModal(false)}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#6d35ff] to-[#2ebfff] px-6 py-3 text-sm font-bold text-white"
                    >
                      <UserPlus className="size-4" /> Sign Up Free
                    </Link>
                    <Link
                      href="/login"
                      onClick={() => setShowLockedModal(false)}
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-muted px-6 py-3 text-sm font-semibold text-foreground hover:bg-accent"
                    >
                      <LogIn className="size-4" /> I already have an account
                    </Link>
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── IMPORT MODAL ────────────────────────────────────────────── */}
      <AnimatePresence>
        {showImport && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => !importing && setShowImport(false)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 p-4 backdrop-blur-xl"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 20, opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl"
            >
              <h3 className="text-2xl font-bold tracking-tight text-foreground">
                Import M3U Playlist
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Paste a public M3U playlist URL or the raw content. Channels load instantly into
                the browse view.
              </p>

              <DemoNotice k="import" className="mt-4" />

              <div className="mt-5 space-y-4">
                <div>
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    M3U URL
                  </label>
                  <input
                    value={m3uUrl}
                    onChange={(e) => setM3uUrl(e.target.value)}
                    placeholder="https://example.com/playlist.m3u"
                    className="mt-1.5 w-full rounded-xl border border-border bg-muted px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-[#6d35ff] focus:outline-none"
                  />
                </div>

                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <div className="h-px flex-1 bg-border" />
                  OR
                  <div className="h-px flex-1 bg-border" />
                </div>

                <div>
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Paste M3U Content
                  </label>
                  <textarea
                    value={m3uContent}
                    onChange={(e) => setM3uContent(e.target.value)}
                    placeholder={'#EXTM3U\n#EXTINF:-1,Channel Name\nhttps://example.com/stream.m3u8'}
                    rows={4}
                    className="mt-1.5 w-full resize-none rounded-xl border border-border bg-muted px-4 py-2.5 font-mono text-xs text-foreground placeholder:text-muted-foreground focus:border-[#6d35ff] focus:outline-none"
                  />
                </div>

                {importMsg && (
                  <div
                    className={`rounded-xl border px-4 py-3 text-sm ${
                      importMsg.type === "success"
                        ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                        : "border-rose-500/30 bg-rose-500/10 text-rose-300"
                    }`}
                  >
                    {importMsg.text}
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowImport(false)}
                    className="flex-1 rounded-xl border border-border bg-muted px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-accent"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleImport}
                    disabled={importing}
                    className="flex-[2] inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#6d35ff] to-[#2ebfff] px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-[#6d35ff]/30 hover:opacity-90 disabled:opacity-60"
                  >
                    {importing ? (
                      <>
                        <Loader2 className="size-4 animate-spin" /> Importing…
                      </>
                    ) : (
                      <>
                        <Download className="size-4" /> Scan & Import
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <PlayerModal
        channel={playing}
        onClose={() => setPlaying(null)}
        onToggleWatchlist={toggleWatchlist}
        isWatchlisted={playing ? watchlist.includes(playing.cid ?? stableChannelId(playing)) : false}
      />

      {/* ── BROWSE ──────────────────────────────────────────────────── */}
      {activeNav === "Browse" && (
        <main>
          {!search && (
            <section className="relative overflow-hidden pt-24 pb-16 sm:pt-28">
              {/* Ambient brand background: violet/cyan wash + signature grid */}
              <div
                className="pointer-events-none absolute inset-0 bg-violet-grid opacity-60"
                aria-hidden="true"
              />
              <div
                className="pointer-events-none absolute inset-0"
                aria-hidden="true"
                style={{
                  background: `radial-gradient(ellipse at 20% 30%, rgba(109,53,255,0.18) 0%, transparent 55%), radial-gradient(ellipse at 80% 15%, rgba(46,191,255,0.12) 0%, transparent 55%), radial-gradient(ellipse at 50% 60%, ${featured.color}22 0%, transparent 60%)`,
                }}
              />
              <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                  className="max-w-2xl"
                >
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 rounded-md bg-[#6d35ff] px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-white animate-pulse-live">
                      ● Live now
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {featured.group} · {featured.country}
                    </span>
                  </div>
                  <h1 className="mt-4 text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
                    {featured.name}
                  </h1>
                  <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
                    {featured.desc}
                  </p>
                  <DemoNotice k="epg" className="mt-5 max-w-md" />
                  <div className="mt-8 flex flex-wrap gap-3">
                    <button
                      onClick={() => handlePlayChannel(allChannels.find((c) => c.url) || allChannels[0])}
                      className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#6d35ff] to-[#2ebfff] px-6 py-3 text-sm font-bold text-white shadow-lg shadow-[#6d35ff]/40 hover:opacity-90"
                    >
                      <Play className="size-4 fill-white" /> Watch Now
                    </button>
                    <button
                      onClick={() => toggleWatchlist(featuredCid)}
                      className="inline-flex items-center gap-2 rounded-xl border border-border bg-muted px-6 py-3 text-sm font-bold text-foreground hover:bg-accent"
                    >
                      <Heart
                        className={`size-4 ${
                          watchlist.includes(featuredCid) ? "fill-rose-400 text-rose-400" : ""
                        }`}
                      />
                      {watchlist.includes(featuredCid) ? "Saved" : "Add to List"}
                    </button>
                  </div>
                </motion.div>
              </div>
            </section>
          )}

          <div className={`mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 ${search ? "pt-24" : ""} pb-16`}>
            {!search && (
              <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  { label: "Total", value: uniqueChannels.length, tone: "text-foreground" },
                  { label: "Online", value: online, tone: "text-emerald-400" },
                  { label: "Degraded", value: degraded, tone: "text-amber-400" },
                  { label: "Offline", value: offline, tone: "text-rose-400" },
                ].map((s, i) => (
                  <motion.div
                    key={s.label}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="rounded-2xl glass-card p-4 text-center"
                  >
                    <div className={`text-2xl font-bold sm:text-3xl ${s.tone}`}>{s.value}</div>
                    <div className="mt-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {s.label}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {/* Category pills */}
            <div className="mb-6 flex flex-wrap gap-2">
              {categories.map((cat) => {
                const active = activeCategory === cat
                return (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${
                      active
                        ? "bg-gradient-to-r from-[#6d35ff] to-[#2ebfff] text-white shadow-lg shadow-[#6d35ff]/30"
                        : "border border-border bg-muted text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {cat}
                  </button>
                )
              })}
            </div>

            {!search && activeCategory === "All" && (() => {
              const continueChannels = continueCids
                .map((id) => uniqueChannels.find((c) => c.cid === id))
                .filter(Boolean)
              if (continueChannels.length === 0) return null
              return (
                <div className="mb-12">
                  <div className="mb-4 flex items-end justify-between">
                    <h2 className="flex items-center gap-2 text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                      <History className="size-5 text-[#a78bfa]" /> Continue Watching
                    </h2>
                  </div>
                  <div className="hide-scrollbar -mx-4 flex gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
                    {continueChannels.map((c) => (
                      <div key={c.cid} className="w-44 flex-shrink-0 sm:w-48">
                        <ChannelCard
                          channel={c}
                          onPlay={handlePlayChannel}
                          isWatchlisted={watchlist.includes(c.cid)}
                          onToggleWatchlist={toggleWatchlist}
                          isLocked={!c.isFree && !isVerifiedUser}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )
            })()}

            {search || activeCategory !== "All" ? (
              <>
                <div className="mb-4 text-sm text-muted-foreground">
                  {filteredBrowse.length} {filteredBrowse.length === 1 ? "channel" : "channels"}
                </div>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                  {filteredBrowse.map((c) => (
                    <ChannelCard
                      key={c.id || c.name}
                      channel={c}
                      onPlay={handlePlayChannel}
                      isWatchlisted={watchlist.includes(c.cid)}
                      onToggleWatchlist={toggleWatchlist}
                      isLocked={!c.isFree && !isVerifiedUser}
                    />
                  ))}
                </div>
              </>
            ) : (
              Object.entries(grouped).map(([cat, channels]) => (
                <div key={cat} className="mb-12">
                  <div className="mb-4 flex items-end justify-between">
                    <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                      {cat}
                    </h2>
                    <button
                      onClick={() => setActiveCategory(cat)}
                      className="text-xs font-semibold text-[#8b5cf6] hover:text-[#a78bfa]"
                    >
                      See all {channels.length} →
                    </button>
                  </div>
                  <div className="hide-scrollbar -mx-4 flex gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
                    {channels.map((c) => (
                      <div key={c.id || c.name} className="w-44 flex-shrink-0 sm:w-48">
                        <ChannelCard
                          channel={c}
                          onPlay={handlePlayChannel}
                          isWatchlisted={watchlist.includes(c.cid)}
                          onToggleWatchlist={toggleWatchlist}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
          <ContactFooter />
        </main>
      )}

      {/* ── WATCHLIST ───────────────────────────────────────────────── */}
      {activeNav === "Watchlist" && (
        <main className="mx-auto max-w-7xl px-4 pt-24 pb-16 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            My{" "}
            <span className="bg-gradient-to-r from-[#6d35ff] to-[#2ebfff] bg-clip-text text-transparent">
              Watchlist
            </span>
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {uniqueChannels.filter((c) => watchlist.includes(c.cid)).length} channels saved
          </p>
          {!user && <DemoNotice k="watchlist" className="mt-4 max-w-xl" />}

          {uniqueChannels.filter((c) => watchlist.includes(c.cid)).length > 0 ? (
            <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {uniqueChannels
                .filter((c) => watchlist.includes(c.cid))
                .map((c) => (
                  <ChannelCard
                    key={c.id}
                    channel={c}
                    onPlay={handlePlayChannel}
                    isWatchlisted
                    onToggleWatchlist={toggleWatchlist}
                  />
                ))}
            </div>
          ) : (
            <div className="mt-16 flex flex-col items-center gap-4 text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl glass-card">
                <Heart className="size-8 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-bold text-foreground">Your watchlist is empty</h3>
              <p className="max-w-sm text-sm text-muted-foreground">
                Browse channels and tap the heart icon to save them here for quick access.
              </p>
            </div>
          )}
          <ContactFooter />
        </main>
      )}

      {/* ── MONITOR ─────────────────────────────────────────────────── */}
      {activeNav === "Monitor" && (
        <main className="mx-auto max-w-7xl px-4 pt-24 pb-16 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                Stream{" "}
                <span className="bg-gradient-to-r from-[#6d35ff] to-[#2ebfff] bg-clip-text text-transparent">
                  Monitor
                </span>
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                {uniqueChannels.length} channels tracked · stream health &amp; latency (simulated)
              </p>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={monitorSearch}
                onChange={(e) => setMonitorSearch(e.target.value)}
                placeholder="Filter channels…"
                className="w-full rounded-xl border border-border bg-muted py-2 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-[#6d35ff] focus:outline-none sm:w-56"
              />
            </div>
          </div>

          <DemoNotice k="monitor" className="mt-6" />

          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: "Total", value: uniqueChannels.length, tone: "text-foreground", Icon: Wifi },
              { label: "Online", value: online, tone: "text-emerald-400", Icon: Activity },
              { label: "Degraded", value: degraded, tone: "text-amber-400", Icon: Activity },
              { label: "Offline", value: offline, tone: "text-rose-400", Icon: Activity },
            ].map((s) => {
              const Icon = s.Icon
              return (
                <div key={s.label} className="rounded-2xl glass-card p-4">
                  <Icon className={`size-5 ${s.tone}`} />
                  <div className={`mt-2 text-2xl font-bold sm:text-3xl ${s.tone}`}>{s.value}</div>
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {s.label}
                  </div>
                </div>
              )
            })}
          </div>

          <div className="mt-8 overflow-hidden rounded-2xl border border-border">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-sm">
                <thead className="border-b border-border bg-muted/40 text-[11px] uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">Channel</th>
                    <th className="px-4 py-3 text-left font-semibold">Group</th>
                    <th className="px-4 py-3 text-left font-semibold">Status</th>
                    <th className="px-4 py-3 text-left font-semibold">Latency</th>
                    <th className="px-4 py-3 text-left font-semibold">Uptime</th>
                    <th className="px-4 py-3 text-right font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {uniqueChannels
                    .filter(
                      (c) => !monitorSearch || c.name.toLowerCase().includes(monitorSearch.toLowerCase()),
                    )
                    .map((c) => {
                      const hc = healthChecks[c.cid]
                      const status = hc?.status ?? c.status
                      const latency = hc?.latency ?? c.latency
                      return (
                      <tr key={c.id || c.name} className="hover:bg-muted/30">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <ChannelLogo
                              logo={c.logo}
                              color={c.color}
                              name={c.name}
                              size="sm"
                            />
                            <div className="min-w-0">
                              <div className="truncate font-semibold text-foreground">{c.name}</div>
                              <div className="text-[11px] text-muted-foreground">{c.country}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">{c.group}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-2 text-xs font-semibold ${statusColor(status)}`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${statusDot(status)}`} />
                            {status}
                            {hc?.real && <span className="text-[11px] font-normal text-muted-foreground">(live)</span>}
                          </span>
                        </td>
                        <td
                          className={`px-4 py-3 text-xs font-semibold tabular-nums ${
                            latency
                              ? latency < 200
                                ? "text-emerald-400"
                                : "text-amber-400"
                              : "text-muted-foreground"
                          }`}
                        >
                          {latency ? `${latency}ms` : "—"}
                        </td>
                        <td
                          className={`px-4 py-3 text-xs font-semibold tabular-nums ${
                            c.uptime > 95
                              ? "text-emerald-400"
                              : c.uptime > 82
                              ? "text-amber-400"
                              : "text-rose-400"
                          }`}
                        >
                          {c.uptime}%
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              onClick={() => runHealthCheck(c)}
                              disabled={hc?.checking}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-muted px-2.5 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground disabled:opacity-60"
                              title="Ping this stream for a real health status"
                            >
                              <RefreshCw className={`size-3 ${hc?.checking ? "animate-spin" : ""}`} />
                              Run check
                            </button>
                            <button
                              onClick={() => handlePlayChannel(c)}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-[#6d35ff]/30 bg-[#6d35ff]/10 px-3 py-1.5 text-xs font-semibold text-[#a78bfa] hover:bg-[#6d35ff]/20"
                            >
                              <Play className="size-3 fill-[#a78bfa]" /> Watch
                            </button>
                          </div>
                        </td>
                      </tr>
                      )
                    })}
                </tbody>
              </table>
            </div>
          </div>
          <ContactFooter />
        </main>
      )}
    </div>
  )
}
