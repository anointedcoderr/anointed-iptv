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
