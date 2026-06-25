import { describe, it, expect } from "vitest"
import { upsertProgress, pruneProgress } from "../progress"

describe("progress store helpers", () => {
  it("upserts by cid (replaces, moves to front)", () => {
    const list = [{ cid: "a", position: 10, updatedAt: 1 }]
    const next = upsertProgress(list, { cid: "a", position: 20, updatedAt: 2 })
    expect(next).toHaveLength(1)
    expect(next[0].position).toBe(20)
  })
  it("adds new entries at the front", () => {
    const next = upsertProgress([{ cid: "a", position: 1, updatedAt: 1 }], { cid: "b", position: 2, updatedAt: 2 })
    expect(next[0].cid).toBe("b")
  })
  it("prunes to max, newest first", () => {
    const many = Array.from({ length: 40 }, (_, i) => ({ cid: `c${i}`, position: 1, updatedAt: i }))
    const pruned = pruneProgress(many, 30)
    expect(pruned).toHaveLength(30)
    expect(pruned[0].updatedAt).toBe(39)
  })
})
