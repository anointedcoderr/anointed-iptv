// Demo VOD + Series catalog. Uses legal, public-domain media (Blender open
// movies + Google's public sample bucket) so playback genuinely works without
// any rights issues — mirroring the "free public test streams" ethos of the
// live channel list.

const BUCKET = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample"

export const MOVIES = [
  {
    id: "bbb",
    title: "Big Buck Bunny",
    year: 2008,
    genre: "Animation",
    runtime: "9 min",
    rating: "G",
    color: "#f97316",
    synopsis:
      "A large, good-natured rabbit takes revenge on three rodents who torment him. The Blender Foundation's iconic open-source short.",
    url: `${BUCKET}/BigBuckBunny.mp4`,
  },
  {
    id: "sintel",
    title: "Sintel",
    year: 2010,
    genre: "Fantasy",
    runtime: "15 min",
    rating: "PG",
    color: "#6d35ff",
    synopsis:
      "A lonely young woman, Sintel, helps and befriends a dragon she names Scales — an award-winning Blender open movie.",
    url: `${BUCKET}/Sintel.mp4`,
  },
  {
    id: "tos",
    title: "Tears of Steel",
    year: 2012,
    genre: "Sci-Fi",
    runtime: "12 min",
    rating: "PG",
    color: "#2ebfff",
    synopsis:
      "In a future Amsterdam, a group of warriors and scientists try to save the world from rogue robots — Blender's live-action/VFX short.",
    url: `${BUCKET}/TearsOfSteel.mp4`,
  },
  {
    id: "ed",
    title: "Elephant's Dream",
    year: 2006,
    genre: "Animation",
    runtime: "11 min",
    rating: "PG",
    color: "#10b981",
    synopsis:
      "Two characters explore a strange mechanical world in the first-ever open movie produced with open-source tools.",
    url: `${BUCKET}/ElephantsDream.mp4`,
  },
]

export const SERIES = [
  {
    id: "forbigger",
    title: "For Bigger",
    year: 2013,
    genre: "Shorts",
    rating: "G",
    color: "#a855f7",
    synopsis:
      "A demo anthology of short showcase films — perfect for verifying episode navigation, resume, and playback.",
    seasons: [
      {
        season: 1,
        episodes: [
          { ep: 1, title: "For Bigger Blazes", runtime: "15s", synopsis: "Showcase short #1.", url: `${BUCKET}/ForBiggerBlazes.mp4` },
          { ep: 2, title: "For Bigger Escapes", runtime: "15s", synopsis: "Showcase short #2.", url: `${BUCKET}/ForBiggerEscapes.mp4` },
          { ep: 3, title: "For Bigger Fun", runtime: "60s", synopsis: "Showcase short #3.", url: `${BUCKET}/ForBiggerFun.mp4` },
          { ep: 4, title: "For Bigger Joyrides", runtime: "15s", synopsis: "Showcase short #4.", url: `${BUCKET}/ForBiggerJoyrides.mp4` },
        ],
      },
    ],
  },
]

// Map a catalog item to the shape PlayerModal expects.
export function movieToPlayable(m) {
  return {
    name: m.title,
    url: m.url,
    cid: `movie_${m.id}`,
    group: m.genre,
    country: "🎬",
    logo: "",
    color: m.color,
    status: "online",
  }
}

export function episodeToPlayable(series, season, e) {
  return {
    name: `${series.title} — S${season}E${e.ep}: ${e.title}`,
    url: e.url,
    cid: `ep_${series.id}_s${season}_e${e.ep}`,
    group: series.genre,
    country: "🎬",
    logo: "",
    color: series.color,
    status: "online",
  }
}
