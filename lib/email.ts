import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

// Until the retailit.lk domain is verified in Resend, this falls back to
// Resend's shared sender. Set RESEND_FROM to "Retail IT <no-reply@retailit.lk>"
// once the domain is verified.
const FROM = process.env.RESEND_FROM || 'Retail IT <onboarding@resend.dev>'

export async function sendPasswordResetEmail(to: string, link: string) {
  await resend.emails.send({
    from: FROM,
    to,
    subject: 'Reset your Retail IT password',
    html: `
      <div style="font-family:Arial,Helvetica,sans-serif;max-width:480px;margin:0 auto;color:#111827;">
        <h2 style="color:#166534;">Retail IT — Password reset</h2>
        <p>We received a request to reset your Dealer Management Portal password.</p>
        <p style="margin:24px 0;">
          <a href="${link}" style="background:#15803d;color:#ffffff;text-decoration:none;padding:10px 18px;border-radius:8px;display:inline-block;">Reset password</a>
        </p>
        <p style="font-size:13px;color:#6b7280;">This link is valid for 1 hour and can be used once. If you didn't request this, you can safely ignore this email.</p>
        <p style="font-size:12px;color:#9ca3af;word-break:break-all;">${link}</p>
      </div>
    `,
  })
}
