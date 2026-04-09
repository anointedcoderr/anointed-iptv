import jwt from "jsonwebtoken"

const SECRET = process.env.JWT_SECRET || "dev-secret-change-me"
const COOKIE_NAME = "iptv_session"

export function signToken(payload) {
  return jwt.sign(payload, SECRET, { expiresIn: "30d" })
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, SECRET)
  } catch {
    return null
  }
}

export function setSessionCookie(res, token) {
  res.setHeader("Set-Cookie", [
    `${COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${60 * 60 * 24 * 30}${
      process.env.NODE_ENV === "production" ? "; Secure" : ""
    }`,
  ])
}

export function clearSessionCookie(res) {
  res.setHeader("Set-Cookie", [
    `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`,
  ])
}

export function getUserFromReq(req) {
  const cookies = req.headers.cookie || ""
  const match = cookies.match(new RegExp(`${COOKIE_NAME}=([^;]+)`))
  if (!match) return null
  return verifyToken(match[1])
}
