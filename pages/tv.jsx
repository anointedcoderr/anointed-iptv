import { useEffect, useMemo, useRef, useState, useCallback } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { Play, X, LogOut, Loader2, ShieldCheck } from "lucide-react"
import { BUILTIN_CHANNELS } from "../lib/channels"
import { stableChannelId } from "../lib/channel-id"
import { restrictChannels, getActiveProfile } from "../lib/profiles"

const COLS = 5 // keyboard grid columns (leanback / big-screen)

function initials(name) {
  return (name || "CH")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 3)
    .toUpperCase()
}

// Compact, self-contained player for TV mode (HLS + native + progressive MP4).
function TvPlayer({ channel, onClose }) {
  const videoRef = useRef(null)
  const hlsRef = useRef(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose()
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [onClose])

  useEffect(() => {
    if (!channel?.url || !videoRef.current) return
    const video = videoRef.current
    setLoading(true)
    setError(null)
    const isHls = /\.m3u8(\?|$)/i.test(channel.url)
    const run = async () => {
      if (!isHls) {
        video.src = channel.url
        video.load()
        setLoading(false)
        video.play().catch(() => {})
        return
      }
      if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = channel.url
        video.load()
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
          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            setLoading(false)
            video.play().catch(() => {})
          })
          hls.on(Hls.Events.ERROR, (_, d) => {
            if (d.fatal) {
              setError("Stream unavailable or blocked by CORS.")
              setLoading(false)
            }
          })
        } else {
          setError("Your browser can't play this stream.")
          setLoading(false)
        }
      } catch {
        setError("Could not load player.")
        setLoading(false)
      }
    }
    run()
    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy()
        hlsRef.current = null
      }
    }
  }, [channel?.url])

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-6 backdrop-blur-xl"
        role="dialog"
        aria-modal="true"
        aria-label={`${channel.name} player`}
      >
        <motion.div
          initial={{ scale: 0.96, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.96, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-5xl"
        >
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white">{channel.name}</h2>
            <button
              onClick={onClose}
              autoFocus
              className="flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white hover:bg-white/20"
              aria-label="Close player"
            >
              <X className="size-5" />
            </button>
          </div>
          <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-white/10 bg-black">
            {channel.url && !error ? (
              <>
                <video ref={videoRef} controls autoPlay playsInline className="h-full w-full object-contain" style={{ display: loading ? "none" : "block" }} />
                {loading && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                    <Loader2 className="size-12 animate-spin text-[#6d35ff]" />
                    <div className="text-sm text-white/60">Connecting to stream…</div>
                  </div>
                )}
              </>
            ) : (
              <div className="flex h-full w-full items-center justify-center p-6 text-center text-sm text-white/60">
                {error || "Stream not available."}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export default function TvMode() {
  const [activeProfile, setActiveProfile] = useState({ id: "main", name: "Main", kids: false, color: "#6d35ff" })
  const [category, setCategory] = useState("All")
  const [focusIndex, setFocusIndex] = useState(0)
  const [playing, setPlaying] = useState(null)
  const tileRefs = useRef([])
  const railRef = useRef(null)

  useEffect(() => {
    setActiveProfile(getActiveProfile())
  }, [])

  const channels = useMemo(() => {
    const withCid = BUILTIN_CHANNELS.map((c) => ({ ...c, cid: stableChannelId(c) }))
    return restrictChannels(withCid, activeProfile)
  }, [activeProfile])

  const categories = useMemo(() => ["All", ...new Set(channels.map((c) => c.group))], [channels])
  const tiles = useMemo(
    () => (category === "All" ? channels : channels.filter((c) => c.group === category)),
    [channels, category],
  )

  useEffect(() => {
    setFocusIndex(0)
  }, [category])

  useEffect(() => {
    if (playing) return
    tileRefs.current[focusIndex]?.focus()
  }, [focusIndex, tiles, playing])

  const onGridKey = useCallback(
    (e) => {
      const n = tiles.length
      if (n === 0) return
      let next = focusIndex
      if (e.key === "ArrowRight") next = Math.min(n - 1, focusIndex + 1)
      else if (e.key === "ArrowLeft") next = Math.max(0, focusIndex - 1)
      else if (e.key === "ArrowDown") next = Math.min(n - 1, focusIndex + COLS)
      else if (e.key === "ArrowUp") {
        if (focusIndex < COLS) {
          railRef.current?.focus()
          e.preventDefault()
          return
        }
        next = Math.max(0, focusIndex - COLS)
      } else if (e.key === "Enter") {
        setPlaying(tiles[focusIndex])
        e.preventDefault()
        return
      } else {
        return
      }
      e.preventDefault()
      setFocusIndex(next)
    },
    [focusIndex, tiles],
  )

  return (
    <div className="min-h-dvh bg-[#0a0a0a] text-white">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-white/10 px-8 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-white ring-2 ring-violet-500/50">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/logo.png" alt="Anointed Coder" className="h-full w-full object-contain" />
          </div>
          <span className="text-2xl font-bold">
            Anointed{" "}
            <span className="bg-gradient-to-r from-[#6d35ff] to-[#2ebfff] bg-clip-text text-transparent">IPTV</span>
            <span className="ml-2 rounded-md bg-white/10 px-2 py-0.5 align-middle text-xs font-semibold text-white/70">TV MODE</span>
          </span>
          {activeProfile.kids && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs font-semibold text-emerald-400">
              <ShieldCheck className="size-3" /> Kids
            </span>
          )}
        </div>
        <Link href="/" className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white/80 hover:bg-white/10">
          <LogOut className="size-4" /> Exit TV
        </Link>
      </header>

      <p className="px-8 pt-4 text-sm text-white/40">
        Use ← ↑ → ↓ to navigate and Enter to play. Optimised for a remote / keyboard.
      </p>

      {/* Category rail */}
      <div
        ref={railRef}
        tabIndex={0}
        onKeyDown={(e) => {
          const i = categories.indexOf(category)
          if (e.key === "ArrowRight") {
            setCategory(categories[Math.min(categories.length - 1, i + 1)])
            e.preventDefault()
          } else if (e.key === "ArrowLeft") {
            setCategory(categories[Math.max(0, i - 1)])
            e.preventDefault()
          } else if (e.key === "ArrowDown") {
            setFocusIndex(0)
            tileRefs.current[0]?.focus()
            e.preventDefault()
          }
        }}
        className="hide-scrollbar flex gap-2 overflow-x-auto px-8 py-4 outline-none focus-visible:ring-2 focus-visible:ring-[#6d35ff]"
        aria-label="Categories — use left and right arrows"
      >
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            tabIndex={-1}
            className={`whitespace-nowrap rounded-full px-5 py-2 text-sm font-semibold transition-colors ${
              cat === category
                ? "bg-gradient-to-r from-[#6d35ff] to-[#2ebfff] text-white"
                : "border border-white/15 bg-white/5 text-white/60"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Channel grid */}
      <div
        onKeyDown={onGridKey}
        className="grid gap-4 px-8 pb-16 pt-2"
        style={{ gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))` }}
      >
        {tiles.map((c, i) => (
          <button
            key={c.cid}
            ref={(el) => (tileRefs.current[i] = el)}
            tabIndex={i === focusIndex ? 0 : -1}
            onFocus={() => setFocusIndex(i)}
            onClick={() => setPlaying(c)}
            className="group relative aspect-video overflow-hidden rounded-2xl border-2 border-transparent bg-white/5 outline-none transition-transform duration-150 focus:scale-[1.04] focus:border-[#6d35ff] focus:shadow-[0_0_30px_rgba(109,53,255,0.5)]"
          >
            <div
              className="flex h-full w-full items-center justify-center text-2xl font-black text-white"
              style={{ background: `radial-gradient(ellipse at 40% 35%, ${c.color}aa, ${c.color}33 60%, rgba(10,10,10,0.9))` }}
            >
              {initials(c.name)}
            </div>
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent p-3 text-left">
              <div className="truncate text-sm font-semibold text-white">{c.name}</div>
              <div className="truncate text-xs text-white/60">{c.country} {c.group}</div>
            </div>
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-focus:opacity-100">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-[#6d35ff] to-[#2ebfff]">
                <Play className="size-6 fill-white text-white" />
              </div>
            </div>
          </button>
        ))}
      </div>

      {playing && <TvPlayer channel={playing} onClose={() => setPlaying(null)} />}
    </div>
  )
}
