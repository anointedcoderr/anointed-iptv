// Shared validation helpers (unit-tested), used by account UI + API routes.
export function validateNewPassword(pw) {
  if (!pw || pw.length < 6) return { ok: false, error: "Password must be at least 6 characters." }
  return { ok: true }
}
