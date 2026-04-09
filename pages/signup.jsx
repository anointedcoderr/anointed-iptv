import { useState } from "react"
import { useAuth } from "../lib/auth-context"
import { useRouter } from "next/router"
import { motion } from "framer-motion"
import { Mail, Lock, User, ArrowRight, Loader2, CheckCircle } from "lucide-react"
import Link from "next/link"

export default function SignupPage() {
  const { signup } = useAuth()
  const router = useRouter()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      await signup(email, password, name)
      setSuccess(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center"
        >
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10">
            <CheckCircle className="size-8 text-emerald-400" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Check your email</h1>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            We've sent a verification link to <strong className="text-foreground">{email}</strong>.
            Click it to unlock all channels. Check your spam folder if you don't see it.
          </p>
          <button
            onClick={() => router.push("/")}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-rose-600 to-orange-500 px-6 py-3 text-sm font-bold text-white hover:opacity-90"
          >
            Browse Free Channels <ArrowRight className="size-4" />
          </button>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md rounded-2xl border border-border bg-card p-8"
      >
        <div className="mb-6 flex items-center justify-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-white ring-2 ring-violet-500/50">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/logo.png" alt="Anointed Coder" className="h-full w-full object-contain" />
          </div>
          <span className="text-lg font-bold text-foreground">
            Anointed <span className="bg-gradient-to-r from-rose-500 to-orange-400 bg-clip-text text-transparent">IPTV</span>
          </span>
        </div>

        <h1 className="text-center text-2xl font-bold text-foreground">Create your account</h1>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          Sign up to unlock 60+ live channels
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="relative">
            <User className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Name (optional)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-border bg-muted py-3 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-rose-500 focus:outline-none"
            />
          </div>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="email"
              required
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-border bg-muted py-3 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-rose-500 focus:outline-none"
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="password"
              required
              minLength={6}
              placeholder="Password (6+ characters)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-border bg-muted py-3 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-rose-500 focus:outline-none"
            />
          </div>

          {error && (
            <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-rose-600 to-orange-500 py-3 text-sm font-bold text-white shadow-lg shadow-rose-500/30 hover:opacity-90 disabled:opacity-60"
          >
            {loading ? <Loader2 className="size-4 animate-spin" /> : <ArrowRight className="size-4" />}
            {loading ? "Creating account…" : "Sign Up"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-rose-400 hover:text-rose-300">
            Log in
          </Link>
        </p>
      </motion.div>
    </div>
  )
}
