import { describe, it, expect } from "vitest"
import { programmesForDay, nowNext } from "../epg"

const ch = { cid: "12", name: "DW English", group: "News" }
const NOON = new Date(2026, 5, 25, 12, 0, 0).getTime()

describe("epg", () => {
  it("generates a deterministic full-day schedule", () => {
    const a = programmesForDay(ch, NOON)
    const b = programmesForDay(ch, NOON)
    expect(a).toEqual(b)
    expect(a.length).toBeGreaterThan(8)
    expect(a[0].title).toBeTruthy()
  })
  it("covers 24h contiguously", () => {
    const a = programmesForDay(ch, NOON)
    for (let i = 1; i < a.length; i++) expect(a[i].start).toBe(a[i - 1].stop)
  })
  it("nowNext returns a current and an upcoming programme", () => {
    const { now, next } = nowNext(ch, NOON)
    expect(now.start).toBeLessThanOrEqual(NOON)
    expect(now.stop).toBeGreaterThan(NOON)
    expect(next.start).toBeGreaterThan(NOON)
  })
})
