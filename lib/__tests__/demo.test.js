import { describe, it, expect } from "vitest"
import { DEMO, demoNotice } from "../demo"

describe("demo config", () => {
  it("exposes notice copy for known features", () => {
    expect(demoNotice("payments")).toMatch(/no payment/i)
    expect(demoNotice("watchlist")).toMatch(/demo/i)
    expect(demoNotice("monitor")).toMatch(/simulated/i)
  })
  it("returns empty string for unknown keys", () => {
    expect(demoNotice("nope")).toBe("")
  })
  it("flags simulated subsystems", () => {
    expect(DEMO.simulatedHealth).toBe(true)
    expect(DEMO.payments).toBe(false)
  })
})
