import { describe, it, expect } from "vitest"
import { validateNewPassword } from "../validate"

describe("validateNewPassword", () => {
  it("rejects short or empty passwords", () => {
    expect(validateNewPassword("").ok).toBe(false)
    expect(validateNewPassword("12345").ok).toBe(false)
  })
  it("accepts 6+ character passwords", () => {
    expect(validateNewPassword("secret6").ok).toBe(true)
  })
})
