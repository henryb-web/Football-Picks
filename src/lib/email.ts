// Minimal email sender. With no provider configured it logs to the server
// console (fine for local dev); set RESEND_API_KEY to send real email.
// Swappable: only this file talks to the email provider.

type SendArgs = { to: string; subject: string; html: string };

async function send({ to, subject, html }: SendArgs) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM ?? "PickSix <onboarding@resend.dev>";

  if (!apiKey) {
    console.log(
      `\n[email:dev] (no RESEND_API_KEY set — not actually sending)\n  to: ${to}\n  subject: ${subject}\n  ${html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()}\n`,
    );
    return;
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to, subject, html }),
  });
  if (!res.ok) {
    console.error("Resend send failed:", res.status, await res.text());
    throw new Error("Failed to send email.");
  }
}

export async function sendPasswordResetEmail(to: string, resetUrl: string) {
  await send({
    to,
    subject: "Reset your PickSix password",
    html: `
      <div style="font-family:system-ui,sans-serif;font-size:15px;line-height:1.5">
        <h2>Reset your password</h2>
        <p>We received a request to reset your PickSix password. Click below to choose a new one:</p>
        <p><a href="${resetUrl}" style="display:inline-block;background:#0891b2;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none;font-weight:600">Reset password</a></p>
        <p style="color:#666">Or paste this link into your browser:<br>${resetUrl}</p>
        <p style="color:#666">This link expires in 1 hour. If you didn't request this, you can ignore this email.</p>
      </div>`,
  });
}
