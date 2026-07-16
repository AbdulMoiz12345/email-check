# CAITO360 Auth & Email Demo

Mini-app proving the full **signup → verification email → verify link → login** and
**invite email → verify-and-return → auto-accept** flows using the SAME code as the
real app: `lib/email.ts` (Microsoft Graph sender + both templates), `lib/rate-limit.ts`,
`lib/auth-schema.ts`, `db/better-auth-tables.sql`, and the auth route are verbatim
copies; `lib/auth.ts` has the identical Better-Auth configuration.

## Deploy on Vercel (10 min)
1. Push this folder to a GitHub repo (or a subfolder; set it as Root Directory).
2. Vercel → Add New → Project → import it.
3. Storage tab → create a **Postgres (Neon)** database → connect (this injects
   DATABASE_URL automatically). Any other Postgres URL works too.
4. Environment variables:
   - `BETTER_AUTH_SECRET` = any long random string
   - `MS_TENANT_ID`, `MS_CLIENT_ID`, `MS_CLIENT_SECRET`, `MAIL_FROM` = the four Microsoft values
   - after first deploy: `BETTER_AUTH_URL` and `NEXT_PUBLIC_API_BASE_URL` = your Vercel URL, then Redeploy
5. Visit `https://<your-app>/api/setup` once → `{ ok: true }`.

## Test checklist
- [ ] Sign up with a real inbox → **verification email arrives** (branded template)
- [ ] Try logging in BEFORE clicking it → blocked with resend option
- [ ] Click the emailed link → lands on /home signed in, `email verified: true`
- [ ] From /home, invite a second real address → **invite email arrives**
- [ ] Click invite link → sign up → check-inbox → click verification → returns to invite → **accepted ✓**
- [ ] Back on the first account's /home → invitation shows **accepted**
- [ ] (No MS keys set? Links appear in Vercel → Logs instead — same fallback as the real app.)
