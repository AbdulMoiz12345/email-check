// Minimal Microsoft Graph mail helper using the client-credentials (app-only) flow.
// Requires an Azure AD app registration with the Application permission
// "Mail.Send" (admin consented), and MAIL_FROM must be a real mailbox
// (licensed user or shared mailbox) in the tenant.

let cachedToken = null;
let cachedTokenExpiry = 0;

async function getAccessToken() {
  const now = Date.now();
  if (cachedToken && now < cachedTokenExpiry - 60_000) {
    return cachedToken;
  }

  const tenantId = process.env.MS_TENANT_ID;
  const clientId = process.env.MS_CLIENT_ID;
  const clientSecret = process.env.MS_CLIENT_SECRET;

  if (!tenantId || !clientId || !clientSecret) {
    throw new Error(
      "Missing MS_TENANT_ID / MS_CLIENT_ID / MS_CLIENT_SECRET environment variables"
    );
  }

  const url = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;

  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    scope: "https://graph.microsoft.com/.default",
    grant_type: "client_credentials",
  });

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(
      `Token request failed: ${data.error} - ${data.error_description || ""}`
    );
  }

  cachedToken = data.access_token;
  cachedTokenExpiry = now + data.expires_in * 1000;

  return cachedToken;
}

async function sendMail({ to, subject, htmlBody }) {
  const from = process.env.MAIL_FROM;
  if (!from) {
    throw new Error("Missing MAIL_FROM environment variable");
  }

  const token = await getAccessToken();
  const url = `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(
    from
  )}/sendMail`;

  const message = {
    message: {
      subject,
      body: {
        contentType: "HTML",
        content: htmlBody,
      },
      toRecipients: [{ emailAddress: { address: to } }],
    },
    saveToSentItems: false,
  };

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(message),
  });

  if (res.status === 202) {
    return { success: true };
  }

  const errText = await res.text();
  throw new Error(`Graph sendMail failed (${res.status}): ${errText}`);
}

module.exports = { sendMail };
