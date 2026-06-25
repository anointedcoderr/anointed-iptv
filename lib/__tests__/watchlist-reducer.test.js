import { describe, it, expect } from "vitest"
import { toggleId } from "../watchlist"

describe("toggleId", () => {
  it("adds an id when absent", () => {
    expect(toggleId(["1"], "2")).toEqual(["1", "2"])
  })
  it("removes an id when present", () => {
    expect(toggleId(["1", "2"], "1")).toEqual(["2"])
  })
  it("does not mutate the input", () => {
    const input = ["1"]
    toggleId(input, "2")
    expect(input).toEqual(["1"])
  })
})
