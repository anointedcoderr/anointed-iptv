// Viewer profiles + parental controls (localStorage — demo-appropriate, per browser).
// Pure helpers (restriction logic) are unit-tested; storage accessors wrap them.

export const KID_GROUPS = ["Kids", "Music", "Culture", "Documentary", "Lifestyle", "Demo"]

const PROFILES_KEY = "iptv_profiles"
const ACTIVE_KEY = "iptv_active_profile"
const PIN_KEY = "iptv_parental_pin"

export const DEFAULT_PROFILES = [
  { id: "main", name: "Main", kids: false, color: "#6d35ff" },
  { id: "kids", name: "Kids", kids: true, color: "#22c55e" },
]

// ── Pure restriction logic ──────────────────────────────────────────────────
export function isAllowed(channel, profile) {
  if (!profile?.kids) return true
  return KID_GROUPS.includes(channel?.group)
}

export function restrictChannels(channels, profile) {
  if (!profile?.kids) return channels
  return channels.filter((c) => KID_GROUPS.includes(c.group))
}

// ── Storage accessors (guarded for SSR) ─────────────────────────────────────
function read(key, fallback) {
  if (typeof window === "undefined") return fallback
  try {
    const v = JSON.parse(localStorage.getItem(key) || "null")
    return v == null ? fallback : v
  } catch {
    return fallback
  }
}

export function getProfiles() {
  const list = read(PROFILES_KEY, null)
  return Array.isArray(list) && list.length ? list : DEFAULT_PROFILES
}

export function saveProfiles(list) {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(PROFILES_KEY, JSON.stringify(list))
  } catch {}
}

export function getActiveProfileId() {
  return read(ACTIVE_KEY, "main")
}

export function setActiveProfileId(id) {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(ACTIVE_KEY, JSON.stringify(id))
  } catch {}
}

export function getActiveProfile() {
  const profiles = getProfiles()
  return profiles.find((p) => p.id === getActiveProfileId()) || profiles[0]
}

export function getPin() {
  return read(PIN_KEY, "")
}

export function setPin(pin) {
  if (typeof window === "undefined") return
  try {
    if (pin) localStorage.setItem(PIN_KEY, JSON.stringify(pin))
    else localStorage.removeItem(PIN_KEY)
  } catch {}
}

export function hasPin() {
  return !!getPin()
}

export function verifyPin(pin) {
  return getPin() === pin
}
