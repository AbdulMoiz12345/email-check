# CAITO360 Mail Test

Tiny Next.js app to confirm your Microsoft Graph mail setup works before wiring
it into CAITO360 proper. It sends real emails through Graph's app-only
(client-credentials) flow — no user sign-in involved.

## What's in here

- `app/page.js` — one page, two forms: "send verification code" and "send invite"
- `app/api/send-code/route.js` — POST { to, code }
- `app/api/send-invite/route.js` — POST { to, inviterName, orgName, inviteLink }
- `lib/graphMail.js` — gets an app-only access token from Azure AD, then calls
  Graph's `/users/{MAIL_FROM}/sendMail`

## 1. Before you deploy — checklist on the Azure side

- Your app registration needs the **Application permission** `Mail.Send`
  (not delegated), and it must have **admin consent granted**. Check under
  Azure AD → App registrations → your app → API permissions.
- `MAIL_FROM` must be a real mailbox that exists in your tenant — either a
  licensed user mailbox or a shared mailbox. Graph sends "as" this address,
  it isn't just a display header.
- If you want to restrict which mailbox the app can send from (recommended
  for anything beyond this test), set up an
  [application access policy](https://learn.microsoft.com/en-us/graph/auth-limit-mailbox-access)
  scoping `Mail.Send` to just `MAIL_FROM`.

## 2. Deploy to Vercel

1. Push this folder to a new GitHub repo (or `vercel` CLI can deploy a local
   folder directly — `vercel` from inside this directory works too).
2. Import the repo in Vercel, or run `vercel` from this folder.
3. In the Vercel project → Settings → Environment Variables, add:
   - `MS_TENANT_ID`
   - `MS_CLIENT_ID`
   - `MS_CLIENT_SECRET`
   - `MAIL_FROM`
4. Redeploy (env var changes need a redeploy to take effect).

## 3. Test

Open the deployed URL, fill in a real "to" address you can check, and hit
send on each form. You'll see the raw JSON response from the API route
below the button — a `{"success": true}` means Graph accepted the message
(HTTP 202), which typically means it lands within seconds.

Common failures and what they mean:

- `Token request failed: invalid_client` — client ID/secret wrong or the
  secret has expired.
- `Graph sendMail failed (403): ... Access is denied` — permission not
  granted/consented, or an access policy is blocking `MAIL_FROM`.
- `Graph sendMail failed (404): ... user not found` — `MAIL_FROM` isn't a
  real mailbox in the tenant.

## Local testing (optional)

```bash
npm install
cp .env.example .env.local   # fill in your real values, not committed
npm run dev
```

Then open http://localhost:3000.
