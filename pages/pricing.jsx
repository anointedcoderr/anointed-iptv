import { useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { ArrowLeft, Check, Sparkles } from "lucide-react"
import DemoNotice from "../components/DemoNotice"

const PLANS = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    highlight: false,
    features: ["60+ live demo channels", "Watchlist on this device", "Stream health monitor", "M3U import (session)"],
    cta: "Current plan",
  },
  {
    name: "Standard",
    price: "$9.99",
    period: "/mo",
    highlight: true,
    features: [
      "Everything in Free",
      "Account-saved watchlist & resume",
      "Full EPG guide + catch-up",
      "Movies & Series (VOD)",
      "2 simultaneous streams",
    ],
    cta: "Choose Standard",
  },
  {
    name: "Premium",
    price: "$19.99",
    period: "/mo",
    highlight: false,
    features: [
      "Everything in Standard",
      "Xtream Codes + unlimited playlists",
      "4K where available",
      "4 simultaneous streams",
      "DVR recording & multi-profile",
    ],
    cta: "Choose Premium",
  },
]

export default function PricingPage() {
  const [picked, setPicked] = useState(null)

  return (
    <div className="min-h-screen bg-background text-foreground">
      <nav className="border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-4" /> Back to app
          </Link>
          <span className="text-base font-bold">Pricing</span>
        </div>
      </nav>

      <div className="mx-auto max-w-5xl px-4 py-12">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Simple,{" "}
            <span className="bg-gradient-to-r from-[#6d35ff] to-[#2ebfff] bg-clip-text text-transparent">
              honest pricing
            </span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground">
            Pick the plan that fits. Cancel anytime. This is how a production build would present
            tiers — wired to Stripe in a real deployment.
          </p>
        </div>

        <DemoNotice k="billing" className="mx-auto mt-6 max-w-xl justify-center" />

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {PLANS.map((p) => (
            <motion.div
              key={p.name}
              whileHover={{ y: -6 }}
              transition={{ duration: 0.25 }}
              className={`relative flex flex-col rounded-2xl border p-6 ${
                p.highlight ? "border-[#6d35ff]/50 glass-card glow-violet" : "border-border glass-card"
              }`}
            >
              {p.highlight && (
                <span className="absolute -top-3 left-1/2 inline-flex -translate-x-1/2 items-center gap-1 rounded-full bg-gradient-to-r from-[#6d35ff] to-[#2ebfff] px-3 py-1 text-[11px] font-bold text-white">
                  <Sparkles className="size-3" /> Most popular
                </span>
              )}
              <div className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">{p.name}</div>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-4xl font-bold">{p.price}</span>
                <span className="text-sm text-muted-foreground">{p.period}</span>
              </div>
              <ul className="mt-5 flex-1 space-y-2.5">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <Check className="mt-0.5 size-4 flex-shrink-0 text-[#a78bfa]" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <button
                onClick={() => setPicked(p.name)}
                className={`mt-6 rounded-xl px-5 py-2.5 text-sm font-bold transition-opacity ${
                  p.highlight
                    ? "bg-gradient-to-r from-[#6d35ff] to-[#2ebfff] text-white hover:opacity-90"
                    : "border border-border bg-muted text-foreground hover:bg-accent"
                }`}
              >
                {p.cta}
              </button>
            </motion.div>
          ))}
        </div>

        {picked && (
          <div
            role="status"
            aria-live="polite"
            className="mx-auto mt-8 max-w-xl rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-center text-sm text-amber-200"
          >
            You picked <strong>{picked}</strong> — but this is a demo, so no card is charged and no
            subscription is created. In production this would open Stripe Checkout.
          </div>
        )}
      </div>
    </div>
  )
}
