import { describe, it, expect } from "vitest"
import { isAllowed, restrictChannels } from "../profiles"

const channels = [
  { name: "DW", group: "News" },
  { name: "Toons", group: "Kids" },
  { name: "Stingray", group: "Music" },
  { name: "Bloomberg", group: "Business" },
]

describe("parental restriction", () => {
  it("allows everything for non-kids profiles", () => {
    const p = { kids: false }
    expect(restrictChannels(channels, p)).toHaveLength(4)
    expect(isAllowed({ group: "News" }, p)).toBe(true)
  })
  it("restricts kids profiles to family groups", () => {
    const p = { kids: true }
    const out = restrictChannels(channels, p)
    expect(out.map((c) => c.group).sort()).toEqual(["Kids", "Music"])
    expect(isAllowed({ group: "News" }, p)).toBe(false)
    expect(isAllowed({ group: "Kids" }, p)).toBe(true)
  })
})
