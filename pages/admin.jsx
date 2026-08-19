import { useState, useEffect } from "react"
import { useAuth } from "../lib/auth-context"
import { useRouter } from "next/router"
import { motion } from "framer-motion"
import {
  Users,
  Tv,
  Shield,
  CheckCircle,
  ArrowLeft,
  Loader2,
  ShieldCheck,
  ShieldOff,
  Trash2,
  BadgeCheck,
  AlertCircle,
  Radio,
  Plus,
  BarChart3,
} from "lucide-react"
import Link from "next/link"
import { TableRowsSkeleton } from "../components/Skeleton"

// Group an array of ISO date strings into the last `days` daily counts.
function signupsByDay(users, days = 14) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const buckets = []
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    buckets.push({ date: d, label: `${d.getMonth() + 1}/${d.getDate()}`, count: 0 })
  }
  for (const u of users) {
    if (!u.created_at) continue
    const c = new Date(u.created_at)
    c.setHours(0, 0, 0, 0)
    const b = buckets.find((x) => x.date.getTime() === c.getTime())
    if (b) b.count++
  }
  return buckets
}

export default function AdminPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [tab, setTab] = useState("dashboard")
  const [stats, setStats] = useState(null)
  const [users, setUsers] = useState([])
  const [loadingData, setLoadingData] = useState(true)
  const [usersError, setUsersError] = useState("")
  const [channels, setChannels] = useState([])
  const [loadingChannels, setLoadingChannels] = useState(true)
  const [channelsError, setChannelsError] = useState("")
  const [newCh, setNewCh] = useState({ name: "", url: "", group: "" })
  const [addingCh, setAddingCh] = useState(false)

  useEffect(() => {
    if (authLoading) return
    if (!user?.is_admin) {
      router.push("/")
      return
    }
    loadStats()
    loadUsers()
    loadChannels()
  }, [user, authLoading])

  const loadStats = async () => {
    try {
      const res = await fetch("/api/admin/stats")
      const data = await res.json()
      if (res.ok) setStats(data)
    } catch {}
  }

  const loadUsers = async () => {
    setLoadingData(true)
    setUsersError("")
    try {
      const res = await fetch("/api/admin/users")
      const data = await res.json()
      if (res.ok) setUsers(data.users || [])
      else setUsersError(data.error || "Failed to load users.")
    } catch {
      setUsersError("Network error while loading users.")
    } finally {
      setLoadingData(false)
    }
  }

  const patchUser = async (userId, patch) => {
    await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, ...patch }),
    })
    loadUsers()
    loadStats()
  }

  const toggleAdmin = (userId, makeAdmin) => patchUser(userId, { is_admin: makeAdmin })
  const toggleVerified = (userId, makeVerified) => patchUser(userId, { is_verified: makeVerified })

  const removeUser = async (userId) => {
    if (!window.confirm("Delete this user permanently? This cannot be undone.")) return
    await fetch("/api/admin/users", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    })
    loadUsers()
    loadStats()
  }

  const loadChannels = async () => {
    setLoadingChannels(true)
    setChannelsError("")
    try {
      const res = await fetch("/api/admin/channels")
      const data = await res.json()
      if (res.ok) setChannels(data.channels || [])
      else setChannelsError(data.error || "Failed to load channels.")
    } catch {
      setChannelsError("Network error while loading channels.")
    } finally {
      setLoadingChannels(false)
    }
  }

  const addChannel = async (e) => {
    e.preventDefault()
    if (!newCh.name || !newCh.url) return
    setAddingCh(true)
    try {
      await fetch("/api/admin/channels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newCh),
      })
      setNewCh({ name: "", url: "", group: "" })
      loadChannels()
    } finally {
      setAddingCh(false)
    }
  }

  const removeChannel = async (ch) => {
    if (!window.confirm(`Remove "${ch.name}" from the shared library?`)) return
    await fetch("/api/admin/channels", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: ch.name, url: ch.stream_url }),
    })
    loadChannels()
  }

  if (authLoading || !user?.is_admin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <nav className="border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
              <ArrowLeft className="size-4" /> Back to app
            </Link>
            <div className="h-5 w-px bg-border" />
            <div className="flex items-center gap-2">
              <Shield className="size-5 text-[#8b5cf6]" />
              <span className="text-base font-bold">Admin Panel</span>
            </div>
          </div>
          <span className="text-xs text-muted-foreground">{user.email}</span>
        </div>
      </nav>

      <div className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="sr-only">Admin Panel</h1>
        {/* Tabs */}
        <div className="mb-8 flex gap-2">
          {[
            { key: "dashboard", label: "Dashboard", icon: Tv },
            { key: "users", label: "Users", icon: Users },
            { key: "channels", label: "Channels", icon: Radio },
          ].map((t) => {
            const Icon = t.icon
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${
                  tab === t.key ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted/50"
                }`}
              >
                <Icon className="size-4" /> {t.label}
              </button>
            )
          })}
        </div>

        {/* Dashboard */}
        {tab === "dashboard" && stats && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="grid gap-4 sm:grid-cols-3">
              {[
                { label: "Total Users", value: stats.totalUsers, tone: "text-foreground" },
                { label: "Verified Users", value: stats.verifiedUsers, tone: "text-emerald-400" },
                { label: "Admins", value: stats.adminUsers, tone: "text-amber-400" },
              ].map((s) => (
                <div key={s.label} className="rounded-2xl glass-card p-6">
                  <div className={`text-3xl font-bold ${s.tone}`}>{s.value}</div>
                  <div className="mt-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {s.label}
                  </div>
                </div>
              ))}
            </div>

            {/* Signups over time (real data from user join dates) */}
            <div className="mt-6 rounded-2xl glass-card p-6">
              <h2 className="flex items-center gap-2 text-sm font-bold">
                <BarChart3 className="size-4 text-[#a78bfa]" /> Signups · last 14 days
              </h2>
              {(() => {
                const data = signupsByDay(users, 14)
                const max = Math.max(1, ...data.map((d) => d.count))
                return (
                  <div className="mt-5 flex h-32 items-end gap-1.5" role="img" aria-label="Daily signups for the last 14 days">
                    {data.map((d) => (
                      <div key={d.label} className="flex flex-1 flex-col items-center gap-1.5">
                        <div
                          className="w-full rounded-t bg-gradient-to-t from-[#6d35ff] to-[#2ebfff]"
                          style={{ height: `${(d.count / max) * 100}%`, minHeight: d.count ? "4px" : "0" }}
                          title={`${d.label}: ${d.count} signup${d.count === 1 ? "" : "s"}`}
                        />
                        <span className="text-[10px] tabular-nums text-muted-foreground">{d.label}</span>
                      </div>
                    ))}
                  </div>
                )
              })()}
            </div>
          </motion.div>
        )}

        {/* Users */}
        {tab === "users" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {loadingData ? (
              <div className="overflow-hidden rounded-2xl border border-border">
                <TableRowsSkeleton rows={6} cols={5} />
              </div>
            ) : usersError ? (
              <div className="flex flex-col items-center gap-3 rounded-2xl border border-rose-500/30 bg-rose-500/10 py-16 text-center">
                <AlertCircle className="size-8 text-rose-400" />
                <p className="text-sm text-rose-300">{usersError}</p>
                <button
                  onClick={loadUsers}
                  className="rounded-lg border border-border bg-muted px-4 py-2 text-xs font-semibold text-foreground hover:bg-accent"
                >
                  Retry
                </button>
              </div>
            ) : users.length === 0 ? (
              <div className="flex flex-col items-center gap-2 rounded-2xl border border-border py-16 text-center">
                <Users className="size-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">No users yet.</p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-2xl border border-border">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[600px] text-sm">
                    <thead className="border-b border-border bg-muted/40 text-[11px] uppercase tracking-wider text-muted-foreground">
                      <tr>
                        <th className="px-4 py-3 text-left font-semibold">User</th>
                        <th className="px-4 py-3 text-left font-semibold">Verified</th>
                        <th className="px-4 py-3 text-left font-semibold">Admin</th>
                        <th className="px-4 py-3 text-left font-semibold">Joined</th>
                        <th className="px-4 py-3 text-right font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {users.map((u) => (
                        <tr key={u.id} className="hover:bg-muted/30">
                          <td className="px-4 py-3">
                            <div className="font-semibold text-foreground">{u.name || "-"}</div>
                            <div className="text-xs text-muted-foreground">{u.email}</div>
                          </td>
                          <td className="px-4 py-3">
                            {u.is_verified ? (
                              <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400">
                                <CheckCircle className="size-3" /> Yes
                              </span>
                            ) : (
                              <span className="text-xs text-muted-foreground">No</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {u.is_admin ? (
                              <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-400">
                                <Shield className="size-3" /> Admin
                              </span>
                            ) : (
                              <span className="text-xs text-muted-foreground">User</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-xs text-muted-foreground">
                            {new Date(u.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3 text-right">
                            {u.id !== user.id && (
                              <div className="inline-flex items-center justify-end gap-1.5">
                                {!u.is_verified && (
                                  <button
                                    onClick={() => toggleVerified(u.id, true)}
                                    className="inline-flex items-center gap-1 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1.5 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/20"
                                    title="Manually verify this user"
                                  >
                                    <BadgeCheck className="size-3" /> Verify
                                  </button>
                                )}
                                <button
                                  onClick={() => toggleAdmin(u.id, !u.is_admin)}
                                  className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold ${
                                    u.is_admin
                                      ? "border border-amber-500/30 bg-amber-500/10 text-amber-400"
                                      : "border border-border bg-muted text-muted-foreground hover:text-foreground"
                                  }`}
                                >
                                  {u.is_admin ? (
                                    <><ShieldOff className="size-3" /> Demote</>
                                  ) : (
                                    <><ShieldCheck className="size-3" /> Make Admin</>
                                  )}
                                </button>
                                <button
                                  onClick={() => removeUser(u.id)}
                                  className="inline-flex items-center gap-1 rounded-lg border border-rose-500/30 bg-rose-500/10 px-2.5 py-1.5 text-xs font-semibold text-rose-400 hover:bg-rose-500/20"
                                  title="Delete this user"
                                >
                                  <Trash2 className="size-3" /> Remove
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Channels */}
        {tab === "channels" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <p className="mb-5 rounded-xl border border-border bg-muted/40 px-4 py-3 text-xs text-muted-foreground">
              Manage the shared / imported channel library. The 60+ built-in channels are curated in
              code (lib/channels.js).
            </p>

            <form onSubmit={addChannel} className="mb-6 grid gap-3 sm:grid-cols-[1.2fr_1.8fr_0.9fr_auto]">
              <input
                value={newCh.name}
                onChange={(e) => setNewCh({ ...newCh, name: e.target.value })}
                placeholder="Channel name"
                aria-label="Channel name"
                className="rounded-xl border border-border bg-muted px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-[#6d35ff] focus:outline-none"
              />
              <input
                value={newCh.url}
                onChange={(e) => setNewCh({ ...newCh, url: e.target.value })}
                placeholder="Stream URL (.m3u8)"
                aria-label="Stream URL"
                className="rounded-xl border border-border bg-muted px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-[#6d35ff] focus:outline-none"
              />
              <input
                value={newCh.group}
                onChange={(e) => setNewCh({ ...newCh, group: e.target.value })}
                placeholder="Group"
                aria-label="Group"
                className="rounded-xl border border-border bg-muted px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-[#6d35ff] focus:outline-none"
              />
              <button
                type="submit"
                disabled={addingCh}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-[#6d35ff] to-[#2ebfff] px-4 py-2.5 text-sm font-bold text-white hover:opacity-90 disabled:opacity-60"
              >
                {addingCh ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />} Add
              </button>
            </form>

            {loadingChannels ? (
              <div className="overflow-hidden rounded-2xl border border-border">
                <TableRowsSkeleton rows={5} cols={3} />
              </div>
            ) : channelsError ? (
              <div className="flex flex-col items-center gap-3 rounded-2xl border border-rose-500/30 bg-rose-500/10 py-16 text-center">
                <AlertCircle className="size-8 text-rose-400" />
                <p className="text-sm text-rose-300">{channelsError}</p>
                <button
                  onClick={loadChannels}
                  className="rounded-lg border border-border bg-muted px-4 py-2 text-xs font-semibold text-foreground hover:bg-accent"
                >
                  Retry
                </button>
              </div>
            ) : channels.length === 0 ? (
              <div className="flex flex-col items-center gap-2 rounded-2xl border border-border py-16 text-center">
                <Radio className="size-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">No shared channels yet. Add one above or import an M3U.</p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-2xl border border-border">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[600px] text-sm">
                    <thead className="border-b border-border bg-muted/40 text-[11px] uppercase tracking-wider text-muted-foreground">
                      <tr>
                        <th className="px-4 py-3 text-left font-semibold">Channel</th>
                        <th className="px-4 py-3 text-left font-semibold">Group</th>
                        <th className="px-4 py-3 text-right font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {channels.map((c) => (
                        <tr key={`${c.name}|${c.stream_url}`} className="hover:bg-muted/30">
                          <td className="px-4 py-3">
                            <div className="font-semibold text-foreground">{c.name}</div>
                            <div className="max-w-xs truncate text-xs text-muted-foreground">{c.stream_url}</div>
                          </td>
                          <td className="px-4 py-3 text-xs text-muted-foreground">{c.group_name || "General"}</td>
                          <td className="px-4 py-3 text-right">
                            <button
                              onClick={() => removeChannel(c)}
                              className="inline-flex items-center gap-1 rounded-lg border border-rose-500/30 bg-rose-500/10 px-2.5 py-1.5 text-xs font-semibold text-rose-400 hover:bg-rose-500/20"
                            >
                              <Trash2 className="size-3" /> Remove
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  )
}
