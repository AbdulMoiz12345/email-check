/**
 * Outbound email for CAITO360 — verification links + team invites.
 *
 * TRANSPORT — Microsoft Graph (company M365), per team decision:
 *   The app has its own Entra ID app registration with the Mail.Send application
 *   permission and sends as the shared mailbox (e.g. no-reply@caito360.ai) using the
 *   client-credentials flow. Configure with FOUR env vars (see .env.example):
 *
 *     MS_TENANT_ID      — Entra "Directory (tenant) ID"
 *     MS_CLIENT_ID      — Entra "Application (client) ID"
 *     MS_CLIENT_SECRET  — the client secret VALUE
 *     MAIL_FROM         — the sending mailbox, e.g. no-reply@caito360.ai
 *
 * DEV FALLBACK — when any key is missing, emails are NOT sent; the full message and
 * its action link are logged to the server console in a single greppable line:
 *   [mail stub] to=<addr> subject="<subject>" url=<link>
 * This keeps every flow (signup verification, invites) testable end-to-end with no
 * keys — drop the keys in and the exact same code paths go live. No other file changes.
 */

interface MailInput {
  to: string;
  subject: string;
  html: string;
  /** The primary action link, logged by the dev stub for easy extraction in tests. */
  actionUrl?: string;
}

const GRAPH_SCOPE = 'https://graph.microsoft.com/.default';
const TOKEN_URL = (tenant: string) =>
  `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/token`;

function graphEnv() {
  const tenantId = process.env.MS_TENANT_ID;
  const clientId = process.env.MS_CLIENT_ID;
  const clientSecret = process.env.MS_CLIENT_SECRET;
  const from = process.env.MAIL_FROM;
  if (!tenantId || !clientId || !clientSecret || !from) return null;
  return { tenantId, clientId, clientSecret, from };
}

// App-only token, cached until ~2 min before expiry (Graph tokens last ~1h).
let cachedToken: { value: string; expiresAt: number } | null = null;

async function getGraphToken(env: NonNullable<ReturnType<typeof graphEnv>>): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt) return cachedToken.value;
  const res = await fetch(TOKEN_URL(env.tenantId), {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: env.clientId,
      client_secret: env.clientSecret,
      scope: GRAPH_SCOPE,
      grant_type: 'client_credentials',
    }),
  });
  if (!res.ok) {
    throw new Error(`Graph token request failed (${res.status}): ${(await res.text()).slice(0, 200)}`);
  }
  const data = (await res.json()) as { access_token: string; expires_in: number };
  cachedToken = { value: data.access_token, expiresAt: Date.now() + (data.expires_in - 120) * 1000 };
  return data.access_token;
}

/** Send one email. Uses Graph when configured; logs a stub line otherwise. */
export async function sendMail(input: MailInput): Promise<void> {
  const env = graphEnv();
  if (!env) {
    console.log(
      `[mail stub] to=${input.to} subject="${input.subject}"${input.actionUrl ? ` url=${input.actionUrl}` : ''}`,
    );
    return;
  }
  const token = await getGraphToken(env);
  const res = await fetch(
    `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(env.from)}/sendMail`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: {
          subject: input.subject,
          body: { contentType: 'HTML', content: input.html },
          toRecipients: [{ emailAddress: { address: input.to } }],
          from: { emailAddress: { address: env.from } },
        },
        saveToSentItems: false,
      }),
    },
  );
  // Graph returns 202 Accepted on success.
  if (!res.ok) {
    throw new Error(`Graph sendMail failed (${res.status}): ${(await res.text()).slice(0, 300)}`);
  }
}

/** Shared shell so both emails look consistent (inline styles: email-client-safe). */
function template(title: string, bodyHtml: string, buttonText: string, buttonUrl: string): string {
  return `<!doctype html><html><body style="margin:0;padding:0;background:#f4f6f8;font-family:Segoe UI,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 16px;">
    <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:10px;border:1px solid #e6eaf0;">
      <tr><td style="padding:28px 32px 8px 32px;">
        <div style="font-size:18px;font-weight:700;color:#061F4A;">CAITO<span style="color:#14B8C8;">360</span></div>
      </td></tr>
      <tr><td style="padding:8px 32px 0 32px;">
        <h1 style="margin:0 0 12px 0;font-size:20px;color:#0b1524;">${title}</h1>
        <div style="font-size:14px;line-height:1.6;color:#41506b;">${bodyHtml}</div>
      </td></tr>
      <tr><td style="padding:24px 32px;">
        <a href="${buttonUrl}" style="display:inline-block;background:#14B8C8;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:11px 22px;border-radius:8px;">${buttonText}</a>
        <p style="margin:18px 0 0 0;font-size:12px;color:#8a96a8;">If the button doesn't work, copy this link into your browser:<br>
          <span style="word-break:break-all;color:#41506b;">${buttonUrl}</span></p>
      </td></tr>
      <tr><td style="padding:0 32px 28px 32px;">
        <p style="margin:0;font-size:11px;color:#a9b3c2;">You received this because this address was used on CAITO360. If this wasn't you, you can ignore this email.</p>
      </td></tr>
    </table>
  </td></tr></table>
</body></html>`;
}

/** Signup verification email (Better-Auth calls this with the ready-made link). */
export async function sendVerificationEmail(params: { to: string; url: string }): Promise<void> {
  await sendMail({
    to: params.to,
    subject: 'Verify your email — CAITO360',
    actionUrl: params.url,
    html: template(
      'Confirm your email address',
      'Welcome to CAITO360! Click the button below to verify your email address and activate your account. This link expires in 1 hour.',
      'Verify my email',
      params.url,
    ),
  });
}

/** Team invite email (existing flow — now goes through the same transport). */
export async function sendInviteEmail(params: {
  to: string;
  token: string;
  tenantId: string;
}): Promise<void> {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3000';
  const inviteUrl = `${base}/invite/${params.token}?tenant=${params.tenantId}`;
  await sendMail({
    to: params.to,
    subject: "You've been invited to CAITO360",
    actionUrl: inviteUrl,
    html: template(
      "You're invited",
      'A teammate has invited you to their CAITO360 workspace. Click below to accept the invitation and set up your account.',
      'Accept invitation',
      inviteUrl,
    ),
  });
}
