const appUrl = () =>
  (process.env.CLIENT_APP_URL || "http://localhost:5173").replace(/\/$/, "");

export async function sendTransactionalEmail({ to, subject, html, text }) {
  const apiKey = String(process.env.RESEND_API_KEY || "").trim();
  const from = String(
    process.env.EMAIL_FROM || "CareerHub <onboarding@resend.dev>",
  ).trim();

  if (!apiKey) {
    console.warn(`Email provider not configured. ${subject} link: ${text}`);
    return { delivered: false, preview: text };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to: [to], subject, html, text }),
    signal: AbortSignal.timeout(15000),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || "Unable to send email.");
  }
  return { delivered: true, id: data.id || null };
}

export function verificationEmail({ name, token }) {
  const url = `${appUrl()}/verify-email?token=${encodeURIComponent(token)}`;
  return {
    subject: "Verify your CareerHub email",
    text: `Hi ${name}, verify your CareerHub email: ${url}`,
    html: `<p>Hi ${name},</p><p>Verify your CareerHub email to keep your account secure.</p><p><a href="${url}">Verify email</a></p><p>This link expires in 24 hours.</p>`,
  };
}

export function resetEmail({ name, token }) {
  const url = `${appUrl()}/reset-password?token=${encodeURIComponent(token)}`;
  return {
    subject: "Reset your CareerHub password",
    text: `Hi ${name}, reset your CareerHub password: ${url}`,
    html: `<p>Hi ${name},</p><p>Use the link below to choose a new CareerHub password.</p><p><a href="${url}">Reset password</a></p><p>This link expires in 1 hour.</p>`,
  };
}
