# Anointed IPTV — Upgrade & Rebrand Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the Anointed IPTV demo from a polished-but-hollow MVP into a credible, on-brand, expert-grade IPTV platform: make every advertised feature actually work (or be honestly labelled as demo-only), repaint it in the Anointed Coder violet→cyan brand, and add the real IPTV pillars (EPG, VOD/Series, player controls) that convince a buyer.

**Architecture:** Next.js 14 (pages router) + Supabase (Postgres) + hls.js. Keep the existing API-route + cookie-JWT auth model. New persistence reuses the already-built Supabase endpoints. New brand lives in CSS custom properties so a single token layer drives the whole UI. Larger features (EPG, VOD, Xtream, analytics, billing) are added as self-contained modules under `lib/` + new pages, each behind a clear data interface.

**Tech Stack:** Next.js 14, React 18, Tailwind v4, framer-motion, hls.js, m3u8-parser, Supabase JS, Resend, bcryptjs, jsonwebtoken. New: Vitest + React Testing Library + jsdom (tests), react-window (virtualization, Phase 3), Manrope (brand font).

---

## Testing Strategy (read first)

The repo currently has **zero tests and no test runner**. This plan therefore:
- Adds **Vitest + React Testing Library** in Phase 0.
- Applies **TDD** (write failing test → implement → pass) to **pure logic units**: watchlist reducer, M3U/EPG/Xtream parsers, channel-id stabilisation, health classification, demo-flag helpers. These are where tests pay off.
- Uses **build + lint + manual/preview verification** for pure visual/theme/markup tasks (gradient swap, skeletons, fonts), where snapshot-style assertions are brittle and low value. Each such task lists an explicit manual verification (what to look at, expected result).
- Standard verification command for any task touching code: `npm run lint && npm run build` must pass.

## Scope Note

This is a **master plan**. Phases 0–2 are specified to full task/step granularity with exact edits and code — they are ready to execute now and deliver the highest credibility-per-hour (working features + on-brand look). **Phases 3–5 are specified at design granularity** (files, data models, component/API interfaces, acceptance criteria, order). Before executing each of Phases 3–5, expand it into its own dated plan (`docs/superpowers/plans/...`) using this skill, because writing full TDD code for EPG/VOD/Xtream/analytics/billing now would be speculative. Each phase produces working, shippable software on its own.

**Pre-req for persistence tasks:** Supabase env vars (`NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`) and `RESEND_API_KEY` must be set in `.env.local` / Vercel. Tasks that need them note it; where unset, the feature must degrade gracefully + show the demo notice.

---

# Phase 0 — Tooling & shared foundations

**Goal:** Make the codebase testable and create the shared helpers (demo copy, stable IDs) the later phases depend on.

### Task 0.1: Add Vitest + React Testing Library

**Files:**
- Modify: `package.json` (scripts + devDependencies)
- Create: `vitest.config.mjs`
- Create: `vitest.setup.js`
- Create: `lib/__tests__/smoke.test.js`

- [ ] **Step 1: Install deps**

```bash
npm i -D vitest@^2 @testing-library/react@^16 @testing-library/jest-dom@^6 @testing-library/user-event@^14 jsdom@^25 @vitejs/plugin-react@^4
```

- [ ] **Step 2: Add scripts to `package.json`**

In the `"scripts"` block add:

```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 3: Create `vitest.config.mjs`**

```js
import { defineConfig } from "vitest/config"
import react from "@vitejs/plugin-react"

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.js"],
    include: ["**/__tests__/**/*.test.{js,jsx}"],
  },
})
```

- [ ] **Step 4: Create `vitest.setup.js`**

```js
import "@testing-library/jest-dom/vitest"
```

- [ ] **Step 5: Create `lib/__tests__/smoke.test.js`**

```js
import { describe, it, expect } from "vitest"
describe("test harness", () => {
  it("runs", () => { expect(1 + 1).toBe(2) })
})
```

- [ ] **Step 6: Run and verify**

Run: `npm test`
Expected: 1 passing test.

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json vitest.config.mjs vitest.setup.js lib/__tests__/smoke.test.js
git commit -m "chore: add vitest + react testing library"
```

### Task 0.2: Stable channel-id helper

A single deterministic ID per channel so watchlists survive refresh/re-import. Built-in channels keep numeric ids (as strings); imported/shared channels derive a stable id from their stream URL.

**Files:**
- Create: `lib/channel-id.js`
- Test: `lib/__tests__/channel-id.test.js`

- [ ] **Step 1: Write the failing test**

```js
import { describe, it, expect } from "vitest"
import { stableChannelId } from "../channel-id"

describe("stableChannelId", () => {
  it("uses the numeric id for built-in channels", () => {
    expect(stableChannelId({ id: 12, url: "https://x/y.m3u8" })).toBe("12")
  })
  it("derives a stable id from the url when id is missing", () => {
    const a = stableChannelId({ url: "https://a.com/s.m3u8", name: "A" })
    const b = stableChannelId({ url: "https://a.com/s.m3u8", name: "A" })
    expect(a).toBe(b)
    expect(a).toMatch(/^ch_/)
  })
  it("differs for different urls", () => {
    expect(stableChannelId({ url: "https://a" })).not.toBe(stableChannelId({ url: "https://b" }))
  })
})
```

- [ ] **Step 2: Run to verify it fails** — `npm test -- channel-id` → FAIL (module not found).

- [ ] **Step 3: Implement `lib/channel-id.js`**

```js
// Deterministic, collision-resistant channel id used for watchlist keys.
function djb2(str) {
  let h = 5381
  for (let i = 0; i < str.length; i++) h = (h * 33) ^ str.charCodeAt(i)
  return (h >>> 0).toString(36)
}

export function stableChannelId(channel) {
  if (channel == null) return "ch_unknown"
  if (channel.id != null && typeof channel.id === "number") return String(channel.id)
  if (channel.id != null && /^\d+$/.test(String(channel.id))) return String(channel.id)
  const seed = `${channel.url || ""}|${channel.name || ""}`
  return `ch_${djb2(seed)}`
}
```

- [ ] **Step 4: Run to verify it passes** — `npm test -- channel-id` → PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/channel-id.js lib/__tests__/channel-id.test.js
git commit -m "feat: stable channel id helper for persistent watchlists"
```

### Task 0.3: Central demo-copy + flags module

One source of truth for every "demo-only" notice and which features are simulated, so copy is consistent and easy to flip off later.

**Files:**
- Create: `lib/demo.js`
- Test: `lib/__tests__/demo.test.js`

- [ ] **Step 1: Write the failing test**

```js
import { describe, it, expect } from "vitest"
import { DEMO, demoNotice } from "../demo"

describe("demo config", () => {
  it("exposes notice copy for known features", () => {
    expect(demoNotice("payments")).toMatch(/no payment/i)
    expect(demoNotice("watchlist")).toMatch(/demo/i)
    expect(demoNotice("monitor")).toMatch(/simulated/i)
  })
  it("flags simulated subsystems", () => {
    expect(DEMO.simulatedHealth).toBe(true)
    expect(DEMO.payments).toBe(false)
  })
})
```

- [ ] **Step 2: Run to verify it fails.**

- [ ] **Step 3: Implement `lib/demo.js`**

```js
// Single source of truth for demo limitations + the exact copy shown in-UI.
export const DEMO = {
  payments: false,          // no billing/subscription exists
  simulatedHealth: true,    // Monitor uses simulated data unless a real check is run
  emailDelivery: "external" // verification email needs Resend; may not arrive
}

const NOTICES = {
  payments:
    "Demo — no payment required. Channels unlock by verifying your email (free). No subscription or billing exists in this demo.",
  watchlist:
    "Demo — sign in to save your watchlist to your account; as a guest it is kept in this browser only.",
  monitor:
    "Demo — health, latency and uptime are simulated for illustration. Use “Run check” to ping a stream for real.",
  import:
    "Demo — imported channels load instantly; sign in to save them, otherwise they last for this session only.",
  verification:
    "Demo — the verification email is sent via an external service and may not always arrive. Use “Resend” if it doesn’t.",
  epg:
    "Demo — no program guide yet. “LIVE” means the channel is streaming now, not a scheduled programme.",
}

export function demoNotice(key) {
  return NOTICES[key] || ""
}
```

- [ ] **Step 4: Run to verify it passes.**

- [ ] **Step 5: Commit**

```bash
git add lib/demo.js lib/__tests__/demo.test.js
git commit -m "feat: central demo copy + feature flags"
```

---

# Phase 1 — Credibility quick wins

**Goal:** Every visible feature does what it claims, or says clearly that it's demo-only. Fix the broken admin and the 4 bugs.

### Task 1.1: Persist the watchlist (wire the existing endpoint, correctly)

The current `/api/watchlist.js` targets the wrong table (`watchlist`, whose `channel_id` FK references a `channels` table the built-ins aren't in) and trusts a `userId` from the request body. Rewrite it to use cookie auth + the `iptv_user_watchlist` table, and widen that table's `channel_id` to text so any channel (built-in numeric, imported, shared) can be saved. Then wire the frontend.

**Files:**
- Modify: `supabase/auth-schema.sql` (migrate `channel_id` to text)
- Rewrite: `pages/api/watchlist.js`
- Modify: `pages/index.jsx:432-497` (load on mount + persist toggles)
- Modify: `pages/index.jsx:360-428` (footer: remove false "watchlist persistence" claim → accurate)
- Test: `lib/__tests__/watchlist-reducer.test.js`
- Create: `lib/watchlist.js` (pure toggle logic + client API wrapper)

- [ ] **Step 1: DB migration.** In Supabase SQL editor (and update `supabase/auth-schema.sql`) change the watchlist channel id to text:

```sql
-- iptv_user_watchlist.channel_id widened to text so built-in + imported ids coexist
alter table iptv_user_watchlist alter column channel_id type text using channel_id::text;
```

Update the table definition in `supabase/auth-schema.sql:20-26` to `channel_id text not null`.

- [ ] **Step 2: Write failing test for the pure reducer** (`lib/__tests__/watchlist-reducer.test.js`):

```js
import { describe, it, expect } from "vitest"
import { toggleId } from "../watchlist"

describe("toggleId", () => {
  it("adds an id when absent", () => { expect(toggleId(["1"], "2")).toEqual(["1", "2"]) })
  it("removes an id when present", () => { expect(toggleId(["1", "2"], "1")).toEqual(["2"]) })
})
```

- [ ] **Step 3: Run → FAIL.**

- [ ] **Step 4: Implement `lib/watchlist.js`**

```js
export function toggleId(list, id) {
  return list.includes(id) ? list.filter((x) => x !== id) : [...list, id]
}

// Client API wrappers (no-op-safe; return null when unauthenticated/unconfigured)
export async function fetchWatchlist() {
  const res = await fetch("/api/watchlist")
  if (!res.ok) return null
  const data = await res.json()
  return data.channelIds || []
}

export async function persistToggle(channelId, action) {
  try {
    await fetch("/api/watchlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ channelId, action }),
    })
  } catch { /* optimistic UI already updated */ }
}
```

- [ ] **Step 5: Run → PASS.**

- [ ] **Step 6: Rewrite `pages/api/watchlist.js`** (cookie auth + adminSupabase + `iptv_user_watchlist`):

```js
import { getUserFromReq } from "../../lib/auth"
import { adminSupabase } from "../../lib/admin-supabase"

export default async function handler(req, res) {
  if (!adminSupabase) return res.status(503).json({ error: "Database not configured." })
  const session = getUserFromReq(req)
  if (!session?.id) return res.status(401).json({ error: "Sign in to use your watchlist." })

  if (req.method === "GET") {
    const { data, error } = await adminSupabase
      .from("iptv_user_watchlist")
      .select("channel_id")
      .eq("user_id", session.id)
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ channelIds: data.map((d) => String(d.channel_id)) })
  }

  if (req.method === "POST") {
    const { channelId, action } = req.body || {}
    if (!channelId) return res.status(400).json({ error: "channelId required" })
    const id = String(channelId)
    if (action === "remove") {
      await adminSupabase.from("iptv_user_watchlist").delete()
        .eq("user_id", session.id).eq("channel_id", id)
      return res.status(200).json({ action: "removed", channelId: id })
    }
    await adminSupabase.from("iptv_user_watchlist")
      .upsert({ user_id: session.id, channel_id: id }, { onConflict: "user_id,channel_id", ignoreDuplicates: true })
    return res.status(200).json({ action: "added", channelId: id })
  }
  return res.status(405).json({ error: "Method not allowed" })
}
```

- [ ] **Step 7: Wire the frontend.** In `pages/index.jsx`:
  - Add imports near top: `import { toggleId, fetchWatchlist, persistToggle } from "../lib/watchlist"` and `import { stableChannelId } from "../lib/channel-id"`.
  - Replace `withMockHealth` channel mapping so every channel carries `cid: stableChannelId(c)` (built-ins and imports).
  - Change watchlist state to hold `cid` strings. Replace toggle (`index.jsx:495-497`):

```jsx
// load saved watchlist for signed-in users
useEffect(() => {
  if (!user) return
  fetchWatchlist().then((ids) => { if (ids) setWatchlist(ids) })
}, [user])

const toggleWatchlist = useCallback((cid) => {
  setWatchlist((w) => {
    const next = toggleId(w, cid)
    if (user) persistToggle(cid, next.includes(cid) ? "add" : "remove")
    else { try { localStorage.setItem("iptv_watchlist", JSON.stringify(next)) } catch {} }
    return next
  })
}, [user])
```
  - For guests, hydrate from localStorage on mount. Update every `watchlist.includes(c.id)` / `onToggleWatchlist(channel.id)` call site to use `c.cid` / `channel.cid`.

- [ ] **Step 8: Fix the footer claim** (`index.jsx:392`): change "watchlist persistence" → "watchlist (saved to your account when signed in)".

- [ ] **Step 9: Verify** — `npm run lint && npm run build && npm test`. Manual: sign in, heart a channel, refresh → still hearted; sign out → guest hearts persist in localStorage only.

- [ ] **Step 10: Commit**

```bash
git add supabase/auth-schema.sql pages/api/watchlist.js lib/watchlist.js lib/__tests__/watchlist-reducer.test.js pages/index.jsx
git commit -m "feat: persist watchlist to account (wire iptv_user_watchlist) with guest localStorage fallback"
```

### Task 1.2: Persist M3U imports + fix volatile IDs

**Files:**
- Modify: `pages/index.jsx:499-531` (handleImport: save after import; stable ids; load shared on mount)
- Modify: `pages/api/import-m3u.js:62` (remove misleading comment)
- (Reuse as-is) `pages/api/save-channels.js`, `pages/api/shared-channels.js`

- [ ] **Step 1:** In `handleImport`, after a successful parse, give each channel a stable id and (best-effort) persist:

```jsx
const withHealth = withMockHealth(
  data.channels.map((c) => ({ ...c, cid: stableChannelId(c), id: stableChannelId(c) })),
)
setImportedChannels((prev) => [...prev, ...withHealth])
// best-effort persistence (silent if Supabase not configured)
fetch("/api/save-channels", {
  method: "POST", headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ channels: data.channels, sourceUrl: m3uUrl || null }),
}).catch(() => {})
```

- [ ] **Step 2:** On mount, load previously-saved shared channels:

```jsx
useEffect(() => {
  fetch("/api/shared-channels").then((r) => r.json()).then((d) => {
    if (d?.channels?.length) {
      setImportedChannels((prev) => [
        ...prev,
        ...withMockHealth(d.channels.map((c) => ({ ...c, cid: stableChannelId(c), id: stableChannelId(c) }))),
      ])
    }
  }).catch(() => {})
}, [])
```

- [ ] **Step 3:** In `pages/api/shared-channels.js:28-29`, change `id: \`shared_${i}\`` to a stable id derived from `stream_url` (mirror `stableChannelId`). Remove the stale comment in `import-m3u.js:62`.

- [ ] **Step 4:** Add the import demo notice (Task 1.6 supplies the component) to the import modal success state.

- [ ] **Step 5: Verify** — import a small public M3U; refresh → channels still present (if Supabase configured); IDs don't collide.

- [ ] **Step 6: Commit**

```bash
git add pages/index.jsx pages/api/import-m3u.js pages/api/shared-channels.js
git commit -m "feat: persist imported channels + stabilise channel ids"
```

### Task 1.3: Real (optional) stream health + fix the CORS bug + label simulated data

**Files:**
- Modify: `pages/api/health-check.js:57-59` (don't report failed pings as online)
- Modify: `pages/index.jsx` Monitor section (~1080-1204): add per-row "Run check" + demo notice

- [ ] **Step 1: Fix the bug.** In `health-check.js`, a thrown fetch should not be "online". Replace the CORS branch:

```js
// A thrown fetch means we couldn't verify — report unknown, never assume online.
return { status: "unknown", latency: null, error: err.message }
```

- [ ] **Step 2:** Add a Monitor demo notice (component from Task 1.6) under the Monitor header; change copy "live health & latency" → "stream health & latency (simulated)".

- [ ] **Step 3:** Add a per-row "Run check" button that calls `/api/health-check` for that channel's `url` and updates that row's status/latency in place. Keep simulated values as the default so the table is populated.

- [ ] **Step 4: Verify** — `npm run build`; click "Run check" on a row → status updates from the real ping (or "unknown" for CORS-blocked).

- [ ] **Step 5: Commit**

```bash
git add pages/api/health-check.js pages/index.jsx
git commit -m "fix: health-check no longer reports failed pings as online; label simulated monitor + add real per-row check"
```

### Task 1.4: Fix the broken admin Users endpoint

Rewrite `pages/api/admin/users.js` to match what `admin.jsx` actually calls (GET list, PATCH toggle, DELETE remove) using cookie-JWT admin auth — the same scheme as `stats.js`.

**Files:**
- Rewrite: `pages/api/admin/users.js`
- Modify: `pages/admin.jsx:43-62` (add error + empty states; add Remove action)
- Test: `lib/__tests__/admin-users-contract.test.js` (shape of request body builder)

- [ ] **Step 1: Rewrite `pages/api/admin/users.js`**

```js
import { getUserFromReq } from "../../../lib/auth"
import { adminSupabase } from "../../../lib/admin-supabase"

export default async function handler(req, res) {
  const session = getUserFromReq(req)
  if (!session?.isAdmin) return res.status(403).json({ error: "Admin access required." })
  if (!adminSupabase) return res.status(503).json({ error: "Database not configured." })

  if (req.method === "GET") {
    const { data, error } = await adminSupabase
      .from("iptv_users")
      .select("id, email, name, is_admin, is_verified, created_at")
      .order("created_at", { ascending: false })
      .limit(500)
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ users: data || [] })
  }

  if (req.method === "PATCH") {
    const { userId, is_admin, is_verified } = req.body || {}
    if (!userId) return res.status(400).json({ error: "userId required" })
    const patch = {}
    if (typeof is_admin === "boolean") patch.is_admin = is_admin
    if (typeof is_verified === "boolean") patch.is_verified = is_verified
    const { error } = await adminSupabase.from("iptv_users").update(patch).eq("id", userId)
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ success: true })
  }

  if (req.method === "DELETE") {
    const { userId } = req.body || {}
    if (!userId) return res.status(400).json({ error: "userId required" })
    if (String(userId) === String(session.id)) return res.status(400).json({ error: "You cannot delete yourself." })
    const { error } = await adminSupabase.from("iptv_users").delete().eq("id", userId)
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ success: true })
  }

  return res.status(405).json({ error: "Method not allowed" })
}
```

- [ ] **Step 2:** In `admin.jsx`, surface load errors (replace the empty `catch {}` at `:49`) and render an empty state when `users.length === 0`. Add a "Verify" toggle (PATCH `is_verified`) and a "Remove" (DELETE) with a confirm dialog.

- [ ] **Step 3: Verify** — sign in as an admin user, open `/admin` → Users tab populates; Make Admin / Demote / Verify / Remove all work and refresh the list.

- [ ] **Step 4: Commit**

```bash
git add pages/api/admin/users.js pages/admin.jsx
git commit -m "fix: admin users endpoint contract (GET/PATCH/DELETE + cookie auth) so user management works"
```

### Task 1.5: Resend-verification path (so the only unlock can't dead-end)

**Files:**
- Create: `pages/api/auth/resend-verification.js`
- Modify: `pages/signup.jsx` (success screen: add Resend button)
- Modify: `pages/index.jsx` (unverified signed-in banner with Resend)
- Modify: `lib/auth-context.jsx` (expose `resendVerification`)

- [ ] **Step 1: Create endpoint** (authed; regenerate token; resend):

```js
import crypto from "crypto"
import { getUserFromReq } from "../../../lib/auth"
import { adminSupabase } from "../../../lib/admin-supabase"
import { sendVerificationEmail } from "../../../lib/send-email"

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" })
  const session = getUserFromReq(req)
  if (!session?.id) return res.status(401).json({ error: "Sign in first." })
  if (!adminSupabase) return res.status(503).json({ error: "Database not configured." })

  const token = crypto.randomBytes(32).toString("hex")
  await adminSupabase.from("iptv_users").update({ verify_token: token }).eq("id", session.id)
  try { await sendVerificationEmail(session.email, token) }
  catch (e) { return res.status(502).json({ error: "Email service unavailable." }) }
  return res.status(200).json({ success: true })
}
```

- [ ] **Step 2:** Add `resendVerification` to `auth-context.jsx` (POST the endpoint) and a "Resend verification email" button on the signup success screen + an unverified banner on the homepage. Show the `demoNotice("verification")` copy.

- [ ] **Step 3: Verify** — `npm run build`; as an unverified user, click Resend → success toast (or graceful 502 message).

- [ ] **Step 4: Commit**

```bash
git add pages/api/auth/resend-verification.js lib/auth-context.jsx pages/signup.jsx pages/index.jsx
git commit -m "feat: resend verification email so the unlock path can't dead-end"
```

### Task 1.6: Demo-only notices everywhere they're needed

**Files:**
- Create: `components/DemoNotice.jsx` (+ `components/` dir)
- Modify: `pages/index.jsx` (locked modal, watchlist tab, monitor, import, hero LIVE)
- Modify: `pages/signup.jsx` (success screen)
- Modify: `pages/_app.jsx:9-13` (meta copy honesty)

- [ ] **Step 1: Create `components/DemoNotice.jsx`**

```jsx
import { Info } from "lucide-react"
import { demoNotice } from "../lib/demo"

export default function DemoNotice({ k, className = "" }) {
  const text = demoNotice(k)
  if (!text) return null
  return (
    <div
      role="note"
      className={`flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs leading-relaxed text-amber-200 ${className}`}
    >
      <Info className="mt-0.5 size-3.5 flex-shrink-0" aria-hidden="true" />
      <span>{text}</span>
    </div>
  )
}
```

- [ ] **Step 2:** Place `<DemoNotice k="..." />`:
  - `payments` → inside the locked-channel modal (`index.jsx:736-773`), and rename badge text "MEMBERS"→"VERIFIED" / "Members Only Channel"→"Verified Members Only (free)".
  - `watchlist` → top of the Watchlist tab (`index.jsx:1037-1077`).
  - `monitor` → under the Monitor header (`index.jsx:1080-1103`).
  - `import` → in the import modal (`index.jsx:805`).
  - `epg` → small, near the hero "Live now" badge (`index.jsx:902-909`).
  - `verification` → signup success screen + unverified banner.

- [ ] **Step 3:** Update `_app.jsx` meta description to not over-claim (e.g. drop implications of persistence/monitoring beyond what's wired).

- [ ] **Step 4: Verify** — `npm run build`; visually confirm each notice renders in the right place.

- [ ] **Step 5: Commit**

```bash
git add components/DemoNotice.jsx pages/index.jsx pages/signup.jsx pages/_app.jsx
git commit -m "feat: honest demo-only notices for payments, watchlist, monitor, import, EPG, verification"
```

---

# Phase 2 — On-brand rebrand (violet → cyan)

**Goal:** The product looks like a bespoke Anointed Coder build, not a template. Brand: violet `#6d35ff` → cyan `#2ebfff`, Manrope type, glassmorphism + violet glow, semantic status colors. (Source: anointedcoder.com brand audit.)

### Task 2.1: Brand token + font + utility foundation

**Files:**
- Modify: `styles/globals.css` (font import, tokens, glow utilities, reduced-motion, tokenized glass hover, ambient grid)

- [ ] **Step 1:** Replace the Geist `@import` (`globals.css:1`) with Manrope + keep Geist Mono:

```css
@import url('https://fonts.googleapis.com/css2?family=Manrope:wght@300..800&family=Geist+Mono:wght@100..900&display=swap');
```

- [ ] **Step 2:** Add brand tokens to `:root` (and set primary/ring violet):

```css
--brand-violet: #6d35ff;
--brand-cyan: #2ebfff;
--brand-grad: linear-gradient(135deg, #6d35ff 0%, #2ebfff 100%);
--ring: oklch(0.55 0.24 285); /* violet */
```

- [ ] **Step 3:** Set `--font-sans` to Manrope in `@theme inline` (`globals.css:52`):

```css
--font-sans: 'Manrope', 'Inter', system-ui, -apple-system, sans-serif;
```

- [ ] **Step 4:** Tokenise the glass-card hover (`globals.css:100-103`) → violet, and add glow + ambient grid + reduced-motion:

```css
.glass-card:hover { background: rgba(255,255,255,0.05); border-color: rgba(109,53,255,0.35); }
.glow-violet { box-shadow: 0 0 20px rgba(109,53,255,0.35), 0 22px 60px rgba(109,53,255,0.16); }
.bg-violet-grid {
  background-image: linear-gradient(rgba(109,53,255,0.08) 1px, transparent 1px),
                    linear-gradient(90deg, rgba(109,53,255,0.08) 1px, transparent 1px);
  background-size: 44px 44px;
}
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation-duration: 0.001ms !important; animation-iteration-count: 1 !important; transition-duration: 0.001ms !important; }
}
```

- [ ] **Step 5: Verify** — `npm run build`; homepage renders in Manrope.

- [ ] **Step 6: Commit**

```bash
git add styles/globals.css
git commit -m "feat(theme): brand tokens, Manrope font, violet glow + grid utilities, reduced-motion"
```

### Task 2.2: Swap rose/orange → violet/cyan across all pages

Apply this find→replace mapping in `pages/index.jsx`, `pages/login.jsx`, `pages/signup.jsx`, `pages/verify.jsx`, `pages/admin.jsx`. (≈76 gradient occurrences + focus/links/shadows.)

| Find | Replace |
|---|---|
| `from-rose-600 to-orange-500` | `from-[#6d35ff] to-[#2ebfff]` |
| `from-rose-600 via-red-600 to-orange-500` | `from-[#6d35ff] to-[#2ebfff]` |
| `from-rose-500 via-red-500 to-orange-400` (text gradient) | `from-[#6d35ff] to-[#2ebfff]` |
| `from-rose-500 to-orange-400` | `from-[#6d35ff] to-[#2ebfff]` |
| `shadow-rose-500/30` · `/40` · `/50` | `shadow-[#6d35ff]/30` · `/40` · `/50` |
| `focus:border-rose-500` | `focus:border-[#6d35ff]` |
| `text-rose-400 hover:text-rose-300` (links) | `text-[#8b5cf6] hover:text-[#a78bfa]` |
| `bg-violet-600` (nav signup) | `bg-gradient-to-r from-[#6d35ff] to-[#2ebfff]` |
| `text-fuchsia-400` (the "Total" metric) | `text-foreground` |

- [ ] **Step 1:** Apply the mapping (grep each page for `rose`/`orange`/`fuchsia` and convert; keep semantic status rose for "offline" only until Task 2.3 reassigns it).
- [ ] **Step 2:** Unify the signup CTA: the nav "Sign up" and the signup-page submit and the "Sign Up Free" modal button must all use the same `from-[#6d35ff] to-[#2ebfff]` treatment.
- [ ] **Step 3: Verify** — `npm run build`; click through home/login/signup/verify/admin → no rose/orange remains except where Task 2.3 maps semantics; CTAs are violet→cyan.
- [ ] **Step 4: Commit**

```bash
git add pages/index.jsx pages/login.jsx pages/signup.jsx pages/verify.jsx pages/admin.jsx
git commit -m "feat(theme): replace rose/orange with brand violet→cyan across all pages"
```

### Task 2.3: Semantic status colors + LIVE badge

**Files:** `pages/index.jsx:27-35` (helpers), status dots/badges.

- [ ] **Step 1:** Keep `online=emerald`, `degraded=amber`; change `offline` to `#e54b4f`. Add a text label/`title` to the card status dot (also satisfies the Phase 4 a11y item) so color isn't the only signal.
- [ ] **Step 2:** Change the "LIVE" badge from `bg-rose-600` to brand `bg-[#6d35ff]` (or keep a dedicated semantic red — pick violet to stay on-brand) and the pulse to use the brand color.
- [ ] **Step 3: Verify** — Monitor + cards show green/amber/red status, violet LIVE; no rose as a status hue.
- [ ] **Step 4: Commit**

```bash
git add pages/index.jsx
git commit -m "feat(theme): semantic status colors + on-brand LIVE badge with text alternative"
```

### Task 2.4: Typography scale fix (kill sub-legible sizes)

**Files:** `pages/index.jsx`, `pages/admin.jsx`.

- [ ] **Step 1:** Replace `text-[9px]` → `text-[10px]`→ use `text-[11px]`/`text-xs` minimum; map all `text-[9px]`/`text-[10px]` labels onto `text-xs` (12px) for body-ish text, keeping `text-[11px]` only for true micro eyebrows. Use Geist Mono + `tabular-nums` for numeric stats/latency/uptime.
- [ ] **Step 2: Verify** — labels legible; numbers use tabular figures (no width jitter).
- [ ] **Step 3: Commit**

```bash
git add pages/index.jsx pages/admin.jsx
git commit -m "feat(theme): legible type scale + tabular numerals for stats"
```

### Task 2.5: Branded skeleton loaders + ambient hero

**Files:**
- Create: `components/Skeleton.jsx` (+ `ChannelCardSkeleton`, `TableRowSkeleton`)
- Modify: `pages/index.jsx` (hero ambient `bg-violet-grid` + radial wash; use skeletons for initial channel grid + Monitor table; replace bare spinners where a skeleton fits)
- Modify: `pages/admin.jsx` (table skeleton)

- [ ] **Step 1:** Build shimmer skeleton components (pure CSS shimmer, respects reduced-motion).
- [ ] **Step 2:** Add the violet grid + violet/cyan radial wash behind the hero/header (`index.jsx:889-894`).
- [ ] **Step 3:** Use skeletons during initial load instead of empty flashes / spinners.
- [ ] **Step 4: Verify** — `npm run build`; throttle network → skeletons show; hero has subtle violet ambiance.
- [ ] **Step 5: Commit**

```bash
git add components/Skeleton.jsx pages/index.jsx pages/admin.jsx
git commit -m "feat(theme): branded skeleton loaders + violet/cyan ambient hero"
```

### Task 2.6: Rebrand the verification email

**Files:** `lib/send-email.js:27,36,41,45`.

- [ ] **Step 1:** Change the avatar bg `#7c3aed` → `#6d35ff`; the button `linear-gradient(135deg,#e11d48,#f97316)` → `linear-gradient(135deg,#6d35ff,#2ebfff)`; link colors `#7c3aed` → `#6d35ff`.
- [ ] **Step 2: Verify** — trigger a signup (with Resend configured) → email matches brand.
- [ ] **Step 3: Commit**

```bash
git add lib/send-email.js
git commit -m "feat(theme): brand the verification email violet→cyan"
```

---

# Phase 3 — Real IPTV pillars  *(design-granularity; expand into its own plan before executing)*

**Goal:** Add the structural features that make a buyer say "this is an IPTV platform." Execution order within the phase as listed.

### Task 3.1: EPG (Electronic Program Guide)
- **Files:** Create `lib/epg.js` (XMLTV → `{channelId, programmes:[{start,stop,title,desc}]}`, supports `.xml`/`.gz`); create `pages/api/epg.js` (fetch + parse a user-supplied XMLTV URL, cache in memory); create `components/EpgGrid.jsx` (scrollable time grid, now/next highlight); modify `pages/api/import-m3u.js` parser to capture `tvg-id`; modify the M3U import modal to accept a companion EPG/XMLTV URL; modify `ChannelCard` to show now/next when EPG present.
- **Data model:** map channel `tvg-id` → XMLTV `channel id`.
- **TDD targets:** `lib/epg.js` parser (sample XMLTV fixture → expected programmes; now/next selection by timestamp).
- **Acceptance:** importing an M3U + its XMLTV shows now/next on cards and a working guide grid; absent EPG keeps today's behaviour + the `epg` demo notice.

### Task 3.2: VOD + Series sections
- **Files:** Create `lib/catalog.js` (sample VOD movies + a series with seasons/episodes, using public-domain/Blender/Mux assets so it's legal like the live list); create `pages/vod.jsx`, `pages/series/index.jsx`, `pages/series/[id].jsx`; create `components/PosterCard.jsx`; extend the player to play VOD assets; add Live/Movies/Series nav.
- **TDD targets:** catalog selectors (by genre, by series → seasons/episodes).
- **Acceptance:** Movies grid with posters + detail; Series → seasons → episodes → playback; matches the Smarters/GSE Live/Movies/Series model.

### Task 3.3: Xtream Codes login
- **Files:** Create `lib/xtream.js` (build `player_api.php` URLs for live/vod/series + categories); create `pages/api/xtream/[...proxy].js` (server-side proxy to avoid CORS, never expose creds to client logs); add an "Add provider (Xtream)" flow to the import modal (server URL + username + password).
- **TDD targets:** URL builders + response normalisers (Xtream JSON → internal channel shape).
- **Acceptance:** entering demo Xtream creds loads live/VOD/series via the proxy; failures surface a clear message.

### Task 3.4: Player track controls + PiP
- **Files:** Modify `PlayerModal` in `pages/index.jsx` (read `hls.levels`, `hls.audioTracks`, `hls.subtitleTracks`; render quality/audio/subtitle menus; wire `video.requestPictureInPicture()`; explicit fullscreen button). Consider extracting `components/Player.jsx`.
- **Acceptance:** a multi-bitrate stream exposes a working quality menu; audio/subtitle menus appear when tracks exist; PiP + fullscreen work.

### Task 3.5: Continue-watching + resume
- **Files:** Create `lib/progress.js` (save `{cid, positionSec, updatedAt}` to localStorage; optional `iptv_progress` table + `/api/progress` for signed-in users); add a "Continue watching" rail to Browse; player seeks to saved position on open and writes progress on `timeupdate` (throttled).
- **TDD targets:** progress store (upsert, prune, most-recent ordering).
- **Acceptance:** reopening a channel resumes near where you left off; a Continue-watching rail shows recent items.

### Task 3.6: Catalog virtualization
- **Files:** add `react-window`; virtualize the Browse grids and the Monitor table; keep carousels for small groups.
- **Acceptance:** importing a 10k-entry M3U scrolls smoothly without freezing.

---

# Phase 4 — Accessibility, routing & account UX  *(design-granularity; expand before executing)*

### Task 4.1: Global focus-visible + accessible dialogs
- **Files:** add a `:focus-visible` ring (violet) in `globals.css`; create `components/Dialog.jsx` (role="dialog", aria-modal, focus trap, Esc to close, focus restore, labelled by title); refactor the three modals (player, locked, import) to use it.
- **Acceptance:** keyboard-only user can open/operate/close every modal; visible focus everywhere; passes an axe scan.

### Task 4.2: Real routing for views
- **Files:** convert Browse/Watchlist/Monitor from `useState` tabs to routes — create `pages/watchlist.jsx`, `pages/monitor.jsx`, extract a shared `components/AppLayout.jsx` (nav/footer); make admin tabs query-param routes (`/admin?tab=users`). Add `aria-current` to active nav/pills.
- **Acceptance:** views are linkable/bookmarkable; refresh keeps the view; Back button works.

### Task 4.3: Forms, labels, status regions, skip link, targets
- **Files:** `pages/login.jsx`, `pages/signup.jsx`, import modal: associated `<label htmlFor>`/ids or `aria-label`; `aria-live="polite"` on error/success banners + `role="status"`; add a skip link + `id="main"` on `<main>`; bump sub-44px targets (card heart, pills, "Watch", "See all").
- **Acceptance:** screen reader announces errors; skip link works; targets ≥44px; admin page has an `<h1>`.

### Task 4.4: Account / settings page
- **Files:** create `pages/account.jsx` (view profile, change name, change password, resend verification, delete account) + `pages/api/auth/update.js`, `pages/api/auth/change-password.js`, `pages/api/auth/delete.js`.
- **TDD targets:** password-change validation logic.
- **Acceptance:** signed-in users have a self-service account surface.

---

# Phase 5 — Operator platform  *(design-granularity; expand before executing)*

### Task 5.1: Admin channel/content CRUD
- **Files:** new Admin "Channels" tab; `pages/api/admin/channels.js` (list/create/update/delete against `shared_channels`/`channels`); feature-flag + category management; choose featured channel (replaces auto `getFeatured`).
- **Acceptance:** an operator can add/edit/remove/feature channels and manage categories from the panel.

### Task 5.2: Viewership analytics + telemetry
- **Files:** `iptv_play_events` table; `/api/track` (record play events); `/api/admin/analytics` (most-watched, concurrent, watch-time, signups-over-time); Admin "Analytics" tab with charts (recharts) + `aria` summaries + CSV export; `iptv_audit_log` for admin actions.
- **Acceptance:** dashboard shows real viewership metrics + an audit trail.

### Task 5.3: Subscription / pricing stub (clearly demo)
- **Files:** `pages/pricing.jsx` (plans); Stripe **test-mode** checkout stub + `subscription` fields on the user; gate "premium" channels on subscription state instead of (or alongside) verification; prominent `payments` demo notice that real charges are disabled.
- **Acceptance:** a demo upgrade flow exists end-to-end in test mode, clearly labelled non-charging.

### Task 5.4: Parental PIN, profiles, device sessions
- **Files:** PIN gate on flagged categories; `iptv_profiles` + profile switcher; device/session registry with concurrent-stream limit display.
- **Acceptance:** PIN-locked content; multiple profiles with separate favorites; device list with revoke.

### Task 5.5 (stretch): Big-screen / remote layout
- A 10-foot, arrow-key-navigable layout variant to compete with TiviMate.

---

## Self-Review (completed against the audit spec)

- **Spec coverage:** Every "expert gap" from the audit maps to a task — EPG (3.1), VOD/Series (3.2), wire dead features (1.1–1.3), fix admin (1.4), rebrand (2.x), Xtream (3.3), track controls (3.4), continue-watching (3.5), virtualization (3.6), focus/modals/routing/a11y (4.1–4.3), account page (4.4), admin CRUD (5.1), analytics (5.2), skeletons+Manrope (2.4–2.5), subscription (5.3). Every demo-disclaimer maps to Task 1.6/1.3/1.5.
- **Bug coverage:** admin contract (1.4), watchlist non-persistence + volatile ids (1.1–1.2), health-check CORS misclassification (1.3), dead save/shared-channels (1.2).
- **Type consistency:** `stableChannelId` (0.2) is used identically in 1.1, 1.2, and `shared-channels.js`; `cid` is the single watchlist key everywhere; `demoNotice(k)` keys match `DemoNotice` usages.
- **Known prerequisite risk:** watchlist persistence + admin + resend require Supabase/Resend env vars; tasks degrade gracefully and show notices when unset.

---

## Execution Handoff

**Phases 0–2 are ready to execute now.** Phases 3–5 should each be expanded into their own dated plan immediately before starting them.

Two execution options:
1. **Subagent-Driven (recommended)** — dispatch a fresh subagent per task, review between tasks.
2. **Inline Execution** — execute tasks in this session with checkpoints after each task.
