import { useState } from "react"
import { motion } from "framer-motion"
import { Play, ArrowLeft, Star, Clock } from "lucide-react"
import { MOVIES, SERIES, movieToPlayable, episodeToPlayable } from "../lib/catalog"

function Poster({ item, onClick }) {
  return (
    <motion.button
      whileHover={{ y: -6 }}
      transition={{ duration: 0.25 }}
      onClick={onClick}
      className="group relative aspect-[2/3] w-full overflow-hidden rounded-2xl border border-border text-left"
      style={{
        background: `linear-gradient(160deg, ${item.color}cc 0%, ${item.color}55 45%, rgba(10,10,10,0.95) 100%)`,
      }}
    >
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <span className="text-center text-lg font-black uppercase tracking-tight text-white/90 drop-shadow">
          {item.title}
        </span>
      </div>
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3">
        <div className="truncate text-sm font-semibold text-white">{item.title}</div>
        <div className="mt-0.5 flex items-center gap-2 text-[11px] text-white/70">
          <span>{item.year}</span>
          <span>·</span>
          <span>{item.genre}</span>
        </div>
      </div>
      <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[#6d35ff] to-[#2ebfff] shadow-lg glow-violet">
          <Play className="size-5 fill-white text-white" />
        </div>
      </div>
    </motion.button>
  )
}

function MovieGrid({ onPlay }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {MOVIES.map((m) => (
        <div key={m.id}>
          <Poster item={m} onClick={() => onPlay(movieToPlayable(m))} />
        </div>
      ))}
    </div>
  )
}

function SeriesDetail({ series, onBack, onPlay }) {
  const [season, setSeason] = useState(series.seasons[0].season)
  const active = series.seasons.find((s) => s.season === season) || series.seasons[0]
  return (
    <div>
      <button
        onClick={onBack}
        className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> All series
      </button>

      <div className="flex flex-col gap-6 sm:flex-row">
        <div
          className="aspect-[2/3] w-40 flex-shrink-0 overflow-hidden rounded-2xl border border-border"
          style={{ background: `linear-gradient(160deg, ${series.color}cc, rgba(10,10,10,0.95))` }}
        >
          <div className="flex h-full items-center justify-center p-3 text-center text-base font-black uppercase text-white/90">
            {series.title}
          </div>
        </div>
        <div className="min-w-0">
          <h2 className="text-2xl font-bold tracking-tight text-foreground">{series.title}</h2>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span>{series.year}</span>
            <span>·</span>
            <span>{series.genre}</span>
            <span className="inline-flex items-center gap-1 rounded border border-border px-1.5 py-0.5">
              <Star className="size-3" /> {series.rating}
            </span>
          </div>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">{series.synopsis}</p>
          {series.seasons.length > 1 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {series.seasons.map((s) => (
                <button
                  key={s.season}
                  onClick={() => setSeason(s.season)}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                    s.season === season
                      ? "bg-gradient-to-r from-[#6d35ff] to-[#2ebfff] text-white"
                      : "border border-border bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Season {s.season}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mt-8 space-y-2">
        {active.episodes.map((e) => (
          <button
            key={e.ep}
            onClick={() => onPlay(episodeToPlayable(series, active.season, e))}
            className="flex w-full items-center gap-4 rounded-xl border border-border bg-muted/40 p-3 text-left transition-colors hover:border-[#6d35ff]/40 hover:bg-muted"
          >
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#6d35ff] to-[#2ebfff] text-sm font-bold text-white">
              {e.ep}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold text-foreground">{e.title}</div>
              <div className="truncate text-xs text-muted-foreground">{e.synopsis}</div>
            </div>
            <div className="flex flex-shrink-0 items-center gap-3 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1"><Clock className="size-3" /> {e.runtime}</span>
              <Play className="size-4 fill-[#a78bfa] text-[#a78bfa]" />
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

export default function Catalog({ kind, onPlay }) {
  const [selected, setSelected] = useState(null)
  const isMovies = kind === "movies"

  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
        {isMovies ? "Movies" : "Series"}
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Sample on-demand library — public-domain open films, fully legal demo content.
      </p>

      <div className="mt-8">
        {isMovies ? (
          <MovieGrid onPlay={onPlay} />
        ) : selected ? (
          <SeriesDetail series={selected} onBack={() => setSelected(null)} onPlay={onPlay} />
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {SERIES.map((s) => (
              <div key={s.id}>
                <Poster item={s} onClick={() => setSelected(s)} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
