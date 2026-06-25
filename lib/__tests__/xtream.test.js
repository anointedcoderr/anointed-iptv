import { describe, it, expect } from "vitest"
import { buildBase, streamUrl, normalizeStreams } from "../xtream"

describe("xtream helpers", () => {
  it("normalizes server base (adds scheme, strips trailing slash)", () => {
    expect(buildBase("example.com/")).toBe("http://example.com")
    expect(buildBase("https://x.tv//")).toBe("https://x.tv")
    expect(buildBase("")).toBe("")
  })
  it("builds a live stream url", () => {
    expect(streamUrl("http://x.tv", "u", "p", 42)).toBe("http://x.tv/live/u/p/42.m3u8")
  })
  it("normalizes streams with category names", () => {
    const out = normalizeStreams(
      [{ stream_id: 1, name: "BBC", category_id: 9, stream_icon: "i.png" }],
      [{ category_id: 9, category_name: "News" }],
      "http://x.tv",
      "u",
      "p",
    )
    expect(out[0]).toMatchObject({ name: "BBC", group: "News", logo: "i.png" })
    expect(out[0].url).toBe("http://x.tv/live/u/p/1.m3u8")
  })
})
