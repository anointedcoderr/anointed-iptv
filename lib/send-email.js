import { Resend } from "resend"

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://iptv.anointedcoder.com"

export async function sendVerificationEmail(email, token) {
  if (!resend) {
    console.warn("RESEND_API_KEY missing — skipping email")
    return
  }

  const link = `${SITE_URL}/verify?token=${token}`

  await resend.emails.send({
    from: "Anointed Coder <verification@anointedcoder.com>",
    to: email,
    subject: "Verify your Anointed IPTV account",
    html: `
      <div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;padding:32px 20px">
        <div style="text-align:center;margin-bottom:24px">
          <div style="display:inline-block;width:56px;height:56px;border-radius:50%;overflow:hidden;background:#7c3aed">
            <img src="${SITE_URL}/images/logo.png" alt="Anointed Coder" width="56" height="56" style="display:block;width:100%;height:100%;object-fit:contain" />
          </div>
        </div>
        <h2 style="text-align:center;font-size:22px;font-weight:700;margin:0 0 8px">Welcome to Anointed IPTV</h2>
        <p style="text-align:center;color:#6b7280;font-size:14px;line-height:1.6;margin:0 0 28px">
          Click the button below to verify your email and unlock 60+ live channels.
        </p>
        <div style="text-align:center;margin-bottom:28px">
          <a href="${link}" style="display:inline-block;background:linear-gradient(135deg,#e11d48,#f97316);color:#fff;font-weight:700;font-size:14px;text-decoration:none;padding:14px 36px;border-radius:12px">
            Verify My Account
          </a>
        </div>
        <p style="text-align:center;color:#9ca3af;font-size:12px;line-height:1.6">
          Or copy this link: <a href="${link}" style="color:#7c3aed;word-break:break-all">${link}</a>
        </p>
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:28px 0 16px" />
        <p style="text-align:center;color:#9ca3af;font-size:11px">
          This is a demo by <a href="https://anointedcoder.com" style="color:#7c3aed">Anointed Coder</a>. If you didn't sign up, ignore this email.
        </p>
      </div>
    `,
  })
}
