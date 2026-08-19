// Single source of truth for demo limitations + the exact copy shown in-UI.
// Flip a flag here (e.g. when real billing is added) and the notices update.
export const DEMO = {
  payments: false,          // no billing/subscription exists in this demo
  simulatedHealth: true,    // Monitor uses simulated data unless a real check is run
  emailDelivery: "external" // verification email needs Resend; may not always arrive
}

const NOTICES = {
  payments:
    "Demo: no payment required. Channels unlock by verifying your email (free). No subscription or billing exists in this demo.",
  watchlist:
    "Demo: sign in to save your watchlist to your account; as a guest it is kept in this browser only.",
  monitor:
    "Demo: health, latency and uptime are simulated for illustration. Use “Run check” to ping a stream for real.",
  import:
    "Demo: imported channels load instantly; sign in to save them, otherwise they last for this session only.",
  verification:
    "Demo: the verification email is sent via an external service and may not always arrive. Use “Resend” if it doesn’t.",
  epg:
    "Demo: no full program guide yet. “LIVE” means the channel is streaming now, not a scheduled programme.",
  billing:
    "Demo: checkout runs in test mode only. No real card is charged and no real subscription is created.",
}

export function demoNotice(key) {
  return NOTICES[key] || ""
}
