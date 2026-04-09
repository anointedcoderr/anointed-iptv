import { useEffect, useState } from "react"
import { useRouter } from "next/router"
import { useAuth } from "../lib/auth-context"
import { motion } from "framer-motion"
import { CheckCircle, XCircle, Loader2 } from "lucide-react"

export default function VerifyPage() {
  const router = useRouter()
  const { refresh } = useAuth()
  const [status, setStatus] = useState("loading") // loading | success | error
  const [error, setError] = useState("")

  useEffect(() => {
    const { token } = router.query
    if (!token) return

    fetch(`/api/auth/verify?token=${token}`)
      .then(async (res) => {
        const data = await res.json()
        if (!res.ok) throw new Error(data.error)
        setStatus("success")
        await refresh()
        setTimeout(() => router.push("/"), 2000)
      })
      .catch((err) => {
        setError(err.message)
        setStatus("error")
      })
  }, [router.query.token])

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center"
      >
        {status === "loading" && (
          <>
            <Loader2 className="mx-auto size-12 animate-spin text-rose-500" />
            <h1 className="mt-4 text-xl font-bold text-foreground">Verifying your account…</h1>
          </>
        )}

        {status === "success" && (
          <>
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10">
              <CheckCircle className="size-8 text-emerald-400" />
            </div>
            <h1 className="mt-4 text-2xl font-bold text-foreground">Email verified!</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              All channels unlocked. Redirecting you to the homepage…
            </p>
          </>
        )}

        {status === "error" && (
          <>
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-rose-500/10">
              <XCircle className="size-8 text-rose-400" />
            </div>
            <h1 className="mt-4 text-2xl font-bold text-foreground">Verification failed</h1>
            <p className="mt-2 text-sm text-muted-foreground">{error}</p>
            <button
              onClick={() => router.push("/signup")}
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-rose-600 to-orange-500 px-6 py-3 text-sm font-bold text-white"
            >
              Try signing up again
            </button>
          </>
        )}
      </motion.div>
    </div>
  )
}
