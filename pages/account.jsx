import { useEffect, useState } from "react"
import { useRouter } from "next/router"
import Link from "next/link"
import { motion } from "framer-motion"
import {
  ArrowLeft,
  Loader2,
  User,
  Mail,
  ShieldCheck,
  KeyRound,
  Trash2,
  LogOut,
  CheckCircle,
  AlertTriangle,
} from "lucide-react"
import { useAuth } from "../lib/auth-context"
import { validateNewPassword } from "../lib/validate"

function Banner({ tone, children }) {
  if (!children) return null
  const cls =
    tone === "success"
      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
      : "border-rose-500/30 bg-rose-500/10 text-rose-300"
  return (
    <div role={tone === "success" ? "status" : "alert"} className={`rounded-xl border px-4 py-3 text-sm ${cls}`}>
      {children}
    </div>
  )
}

export default function AccountPage() {
  const { user, loading, refresh, logout, resendVerification } = useAuth()
  const router = useRouter()

  const [name, setName] = useState("")
  const [profileMsg, setProfileMsg] = useState(null)
  const [savingProfile, setSavingProfile] = useState(false)

  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [pwMsg, setPwMsg] = useState(null)
  const [savingPw, setSavingPw] = useState(false)

  const [resendState, setResendState] = useState(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (!loading && !user) router.push("/login?redirect=/account")
  }, [loading, user, router])

  useEffect(() => {
    if (user) setName(user.name || "")
  }, [user])

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const saveProfile = async (e) => {
    e.preventDefault()
    setSavingProfile(true)
    setProfileMsg(null)
    try {
      const res = await fetch("/api/auth/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      await refresh()
      setProfileMsg({ tone: "success", text: "Profile updated." })
    } catch (err) {
      setProfileMsg({ tone: "error", text: err.message || "Could not update profile." })
    } finally {
      setSavingProfile(false)
    }
  }

  const changePassword = async (e) => {
    e.preventDefault()
    const check = validateNewPassword(newPassword)
    if (!check.ok) {
      setPwMsg({ tone: "error", text: check.error })
      return
    }
    setSavingPw(true)
    setPwMsg(null)
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setPwMsg({ tone: "success", text: "Password changed." })
      setCurrentPassword("")
      setNewPassword("")
    } catch (err) {
      setPwMsg({ tone: "error", text: err.message || "Could not change password." })
    } finally {
      setSavingPw(false)
    }
  }

  const handleResend = async () => {
    setResendState("sending")
    try {
      await resendVerification()
      setResendState("sent")
    } catch {
      setResendState("error")
    }
  }

  const deleteAccount = async () => {
    if (!window.confirm("Delete your account permanently? This cannot be undone.")) return
    setDeleting(true)
    try {
      await fetch("/api/auth/delete", { method: "POST" })
      await refresh()
      router.push("/")
    } catch {
      setDeleting(false)
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <nav className="border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-4" /> Back to app
          </Link>
          <span className="text-base font-bold">Account</span>
        </div>
      </nav>

      <div className="mx-auto max-w-3xl space-y-6 px-4 py-8">
        <h1 className="sr-only">Account settings</h1>
        {/* Verification status */}
        <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl glass-card p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              {user.is_verified ? (
                <CheckCircle className="size-5 text-emerald-400" />
              ) : (
                <AlertTriangle className="size-5 text-amber-400" />
              )}
              <div>
                <div className="text-sm font-semibold">
                  {user.is_verified ? "Email verified" : "Email not verified"}
                </div>
                <div className="text-xs text-muted-foreground">
                  {user.is_verified
                    ? "You have access to all channels."
                    : "Verify your email to unlock all channels."}
                </div>
              </div>
            </div>
            {!user.is_verified && (
              <button
                onClick={handleResend}
                disabled={resendState === "sending" || resendState === "sent"}
                className="inline-flex items-center gap-2 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-2 text-xs font-semibold text-amber-200 hover:bg-amber-500/20 disabled:opacity-70"
              >
                <ShieldCheck className="size-4" />
                {resendState === "sending"
                  ? "Sending…"
                  : resendState === "sent"
                  ? "Email sent ✓"
                  : resendState === "error"
                  ? "Failed — retry"
                  : "Resend verification"}
              </button>
            )}
          </div>
        </motion.section>

        {/* Profile */}
        <section className="rounded-2xl glass-card p-6">
          <h2 className="flex items-center gap-2 text-lg font-bold">
            <User className="size-5 text-[#a78bfa]" /> Profile
          </h2>
          <form onSubmit={saveProfile} className="mt-4 space-y-4">
            <div>
              <label htmlFor="acct-email" className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Email
              </label>
              <div className="relative mt-1.5">
                <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  id="acct-email"
                  value={user.email}
                  readOnly
                  className="w-full cursor-not-allowed rounded-xl border border-border bg-muted/50 py-2.5 pl-10 pr-4 text-sm text-muted-foreground"
                />
              </div>
            </div>
            <div>
              <label htmlFor="acct-name" className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Display name
              </label>
              <input
                id="acct-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="mt-1.5 w-full rounded-xl border border-border bg-muted px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-[#6d35ff] focus:outline-none"
              />
            </div>
            <Banner tone={profileMsg?.tone}>{profileMsg?.text}</Banner>
            <button
              type="submit"
              disabled={savingProfile}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#6d35ff] to-[#2ebfff] px-5 py-2.5 text-sm font-bold text-white hover:opacity-90 disabled:opacity-60"
            >
              {savingProfile && <Loader2 className="size-4 animate-spin" />} Save changes
            </button>
          </form>
        </section>

        {/* Change password */}
        <section className="rounded-2xl glass-card p-6">
          <h2 className="flex items-center gap-2 text-lg font-bold">
            <KeyRound className="size-5 text-[#a78bfa]" /> Change password
          </h2>
          <form onSubmit={changePassword} className="mt-4 space-y-4">
            <div>
              <label htmlFor="acct-cpw" className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Current password
              </label>
              <input
                id="acct-cpw"
                type="password"
                autoComplete="current-password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-border bg-muted px-4 py-2.5 text-sm text-foreground focus:border-[#6d35ff] focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="acct-npw" className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                New password (6+ characters)
              </label>
              <input
                id="acct-npw"
                type="password"
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-border bg-muted px-4 py-2.5 text-sm text-foreground focus:border-[#6d35ff] focus:outline-none"
              />
            </div>
            <Banner tone={pwMsg?.tone}>{pwMsg?.text}</Banner>
            <button
              type="submit"
              disabled={savingPw}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#6d35ff] to-[#2ebfff] px-5 py-2.5 text-sm font-bold text-white hover:opacity-90 disabled:opacity-60"
            >
              {savingPw && <Loader2 className="size-4 animate-spin" />} Update password
            </button>
          </form>
        </section>

        {/* Sign out + danger zone */}
        <section className="rounded-2xl glass-card p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <button
              onClick={() => { logout(); router.push("/") }}
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-muted px-5 py-2.5 text-sm font-semibold text-foreground hover:bg-accent"
            >
              <LogOut className="size-4" /> Sign out
            </button>
            <button
              onClick={deleteAccount}
              disabled={deleting}
              className="inline-flex items-center gap-2 rounded-xl border border-rose-500/40 bg-rose-500/10 px-5 py-2.5 text-sm font-semibold text-rose-300 hover:bg-rose-500/20 disabled:opacity-60"
            >
              {deleting ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />} Delete account
            </button>
          </div>
        </section>
      </div>
    </div>
  )
}
